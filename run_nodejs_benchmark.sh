#!/bin/bash
set -e

echo "=== Node.js IoT Benchmark ==="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Install it with:"
    echo "  macOS: brew install node"
    echo "  Or download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not available"
    exit 1
fi

# Check if wrk is available
if ! command -v wrk &> /dev/null; then
    echo "ERROR: wrk is not installed. Install it with:"
    echo "  macOS: brew install wrk"
    exit 1
fi

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --silent

# Generate payload using python3 directly
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
        echo "Stopping Node.js server (PID: $pid)..."
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
echo "Cleaning up any existing Node.js processes..."
pkill -f "nodejs-server.js" || true
wait_for_port_free 8080

# Start Node.js server
echo ""
echo "=== Testing Node.js Performance ==="
echo "Starting Node.js server..."
node nodejs-server.js &
NODE_PID=$!
echo "Started with PID: $NODE_PID"

# Wait for application to be ready
wait_for_port_ready 8080

echo "Running wrk benchmark (60 seconds)..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > result_nodejs.txt
echo "Results saved to result_nodejs.txt"

# Stop Node.js server
stop_app $NODE_PID

echo ""
echo "=== Benchmark Complete! ==="
echo "Results:"
echo "  Node.js: result_nodejs.txt"
echo ""
echo "Node.js Results:"
grep -E "(Requests/sec|Transfer/sec)" result_nodejs.txt || echo "No results found in result_nodejs.txt"

echo ""
echo "=== Comparison with Spring Boot ==="
if [ -f "result_off.txt" ] && [ -f "result_on.txt" ]; then
    echo "Spring Boot Virtual Threads OFF:"
    grep -E "(Requests/sec|Transfer/sec)" result_off.txt || echo "No results found"
    echo ""
    echo "Spring Boot Virtual Threads ON:"
    grep -E "(Requests/sec|Transfer/sec)" result_on.txt || echo "No results found"
    echo ""
    echo "Node.js:"
    grep -E "(Requests/sec|Transfer/sec)" result_nodejs.txt || echo "No results found"
else
    echo "Run the Spring Boot benchmark first with: ./run_benchmark_fixed.sh"
fi
