#!/bin/bash
set -e

echo "=== Clustered JavaScript Benchmark (Multi-Core) ==="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check available runtimes
NODE_AVAILABLE=false
BUN_AVAILABLE=false

if command_exists node; then
    NODE_AVAILABLE=true
    NODE_VERSION=$(node --version)
fi

if command_exists bun; then
    BUN_AVAILABLE=true
    BUN_VERSION=$(bun --version)
fi

# Get CPU count
CPU_COUNT=$(sysctl -n hw.ncpu)
echo "Detected $CPU_COUNT CPU cores (matching Java's multi-core usage)"

# Display available options
echo "Available JavaScript runtimes:"
if [ "$NODE_AVAILABLE" = true ]; then
    echo "  1) Node.js $NODE_VERSION (Cluster mode - $CPU_COUNT workers)"
fi
if [ "$BUN_AVAILABLE" = true ]; then
    echo "  2) Bun v$BUN_VERSION (Cluster mode - $CPU_COUNT workers)"
fi

if [ "$NODE_AVAILABLE" = false ] && [ "$BUN_AVAILABLE" = false ]; then
    echo "ERROR: Neither Node.js nor Bun is installed."
    exit 1
fi

# Ask user to choose runtime
echo ""
if [ "$NODE_AVAILABLE" = true ] && [ "$BUN_AVAILABLE" = true ]; then
    read -p "Choose runtime (1 for Node.js, 2 for Bun): " choice
    case $choice in
        1)
            RUNTIME="node"
            RUNTIME_NAME="Node.js $NODE_VERSION"
            ;;
        2)
            RUNTIME="bun"
            RUNTIME_NAME="Bun v$BUN_VERSION"
            ;;
        *)
            echo "Invalid choice. Using Node.js as default."
            RUNTIME="node"
            RUNTIME_NAME="Node.js $NODE_VERSION"
            ;;
    esac
elif [ "$NODE_AVAILABLE" = true ]; then
    echo "Using Node.js (only available runtime)"
    RUNTIME="node"
    RUNTIME_NAME="Node.js $NODE_VERSION"
else
    echo "Using Bun (only available runtime)"
    RUNTIME="bun"
    RUNTIME_NAME="Bun v$BUN_VERSION"
fi

echo "Selected runtime: $RUNTIME_NAME"
echo "Using $CPU_COUNT worker processes"

# Check if wrk is available
if ! command_exists wrk; then
    echo "ERROR: wrk is not installed."
    echo "Install wrk: brew install wrk"
    exit 1
fi

# Generate payload
echo "Generating payload..."
python3 generate_payload.py > payload.json

# Function to wait for port to be free
wait_for_port_free() {
    local port=$1
    local timeout=30
    local count=0
    
    echo "Waiting for port $port to be free..."
    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; do
        if [ $count -ge $timeout ]; then
            echo "Timeout waiting for port $port to be free"
            return 1
        fi
        sleep 1
        count=$((count + 1))
    done
    echo "Port $port is now free"
}

# Function to wait for port to be ready
wait_for_port_ready() {
    local port=$1
    local timeout=30
    local count=0
    
    echo "Waiting for port $port to be ready..."
    while ! curl -s http://localhost:$port/health >/dev/null 2>&1; do
        if [ $count -ge $timeout ]; then
            echo "Timeout waiting for port $port to be ready, trying anyway..."
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    echo "Port $port is ready"
}

# Function to stop application gracefully
stop_app() {
    local pid=$1
    if [ ! -z "$pid" ] && kill -0 $pid 2>/dev/null; then
        echo "Stopping clustered server (PID: $pid)..."
        kill $pid
        
        # Wait for process to stop
        local count=0
        while kill -0 $pid 2>/dev/null && [ $count -lt 15 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            echo "Force killing application..."
            kill -9 $pid 2>/dev/null || true
        fi
        
        wait_for_port_free 8080
    fi
}

# Clean up any existing processes
echo "Cleaning up any existing processes..."
pkill -f "clustered-server.js" || true
wait_for_port_free 8080

# Determine output file name based on runtime
if [ "$RUNTIME" = "bun" ]; then
    RESULT_FILE="result_clustered_bun.txt"
    RUNTIME_DISPLAY="Clustered Bun ($CPU_COUNT cores)"
else
    RESULT_FILE="result_clustered_node.txt"
    RUNTIME_DISPLAY="Clustered Node.js ($CPU_COUNT cores)"
fi

# Start clustered server
echo ""
echo "=== Testing $RUNTIME_DISPLAY Performance ==="
echo "Starting $RUNTIME_DISPLAY server..."
$RUNTIME clustered-server.js &
SERVER_PID=$!
echo "Started master process with PID: $SERVER_PID"

# Wait for application to be ready
wait_for_port_ready 8080

echo "Running wrk benchmark (60 seconds) against $CPU_COUNT workers..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > "$RESULT_FILE"
echo "Results saved to $RESULT_FILE"

# Stop server
stop_app $SERVER_PID

echo ""
echo "=== Benchmark Complete! ==="
echo "Results:"
echo "  $RUNTIME_DISPLAY: $RESULT_FILE"
echo ""
echo "$RUNTIME_DISPLAY Results:"
grep -E "(Requests/sec|Transfer/sec)" "$RESULT_FILE" || echo "No results found"

echo ""
echo "=== Multi-Core vs Single-Core Comparison ==="
echo "Spring Boot Virtual Threads (Multi-core):"
grep -E "(Requests/sec|Transfer/sec)" result_on.txt 2>/dev/null || echo "No results found"
echo ""
echo "$RUNTIME_DISPLAY (Multi-core):"
grep -E "(Requests/sec|Transfer/sec)" "$RESULT_FILE" || echo "No results found"
echo ""

if [ "$RUNTIME" = "bun" ] && [ -f "result_fastify.txt" ]; then
    echo "Fastify Bun (Single-core):"
    grep -E "(Requests/sec|Transfer/sec)" result_bun.txt 2>/dev/null || echo "No results found"
elif [ "$RUNTIME" = "node" ] && [ -f "result_fastify.txt" ]; then
    echo "Fastify Node.js (Single-core):"
    grep -E "(Requests/sec|Transfer/sec)" result_fastify.txt 2>/dev/null || echo "No results found"
fi

echo ""
echo "🎯 NOW THIS IS A FAIR COMPARISON! Multi-core vs Multi-core"
