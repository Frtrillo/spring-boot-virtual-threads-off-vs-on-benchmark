#!/bin/bash
set -e

echo "=== NestJS + Bun Native SQLite Benchmark ==="

# Check if Bun is available
if ! command -v bun >/dev/null 2>&1; then
    echo "ERROR: Bun is not installed."
    echo "Install Bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check if wrk is available
if ! command -v wrk >/dev/null 2>&1; then
    echo "ERROR: wrk is not installed."
    echo "Install wrk: brew install wrk"
    exit 1
fi

BUN_VERSION=$(bun --version)
echo "Using Bun v$BUN_VERSION"

# Copy NestJS package.json
cp package-nestjs.json package.json

# Install dependencies with Bun
echo "Installing NestJS dependencies with Bun..."
bun install --silent

# Build TypeScript
echo "Building TypeScript..."
bun run tsc

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
        echo "Stopping NestJS server (PID: $pid)..."
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
pkill -f "nestjs-bun-server.js" || true
wait_for_port_free 8080

# Start server
echo ""
echo "=== Testing NestJS + Bun Native SQLite Performance ==="
echo "Starting NestJS + Bun Native SQLite server..."
bun dist/nestjs-bun-server.js &
SERVER_PID=$!
echo "Started with PID: $SERVER_PID"

# Wait for application to be ready
wait_for_port_ready 8080

echo "Running wrk benchmark (60 seconds)..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > result_nestjs_bun_optimized.txt
echo "Results saved to result_nestjs_bun_optimized.txt"

# Stop server
stop_app $SERVER_PID

echo ""
echo "=== Benchmark Complete! ==="
echo "Results:"
echo "  NestJS + Bun Native SQLite: result_nestjs_bun_optimized.txt"
echo ""
echo "NestJS + Bun Native SQLite Results:"
grep -E "(Requests/sec|Transfer/sec)" result_nestjs_bun_optimized.txt || echo "No results found"

echo ""
echo "=== Performance Comparison ==="
if [ -f "result_nestjs_node.txt" ]; then
    echo "NestJS + Fastify (Node.js):"
    grep -E "(Requests/sec|Transfer/sec)" result_nestjs_node.txt || echo "No results found"
    echo ""
fi

if [ -f "result_nestjs_bun.txt" ]; then
    echo "NestJS + Fastify (Bun + node-sqlite3):"
    grep -E "(Requests/sec|Transfer/sec)" result_nestjs_bun.txt || echo "No results found"
    echo ""
fi

if [ -f "result_bun_native.txt" ]; then
    echo "Bun Native (Bun.sqlite + Bun.serve):"
    grep -E "(Requests/sec|Transfer/sec)" result_bun_native.txt || echo "No results found"
    echo ""
fi

echo "NestJS + Bun Native SQLite:"
grep -E "(Requests/sec|Transfer/sec)" result_nestjs_bun_optimized.txt || echo "No results found"
