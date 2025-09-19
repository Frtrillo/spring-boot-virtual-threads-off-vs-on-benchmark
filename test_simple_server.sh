#!/bin/bash
set -e

echo "=== Test Simple Server (No Database) ==="

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

# Function to stop application
stop_app() {
    local pid=$1
    if [ ! -z "$pid" ] && kill -0 $pid 2>/dev/null; then
        echo "Stopping server (PID: $pid)..."
        kill $pid
        wait_for_port_free 8080
    fi
}

# Generate payload
python3 generate_payload.py > payload.json

# Clean up
pkill -f "simple-server.js" || true
wait_for_port_free 8080

echo ""
echo "=== Testing Node.js (No Database) ==="
node simple-server.js &
NODE_PID=$!
wait_for_port_ready 8080
wrk -t12 -c2000 -d30s -s post.lua http://localhost:8080/ingest > result_simple_node.txt
stop_app $NODE_PID

echo ""
echo "=== Testing Bun (No Database) ==="
bun simple-server.js &
BUN_PID=$!
wait_for_port_ready 8080
wrk -t12 -c2000 -d30s -s post.lua http://localhost:8080/ingest > result_simple_bun.txt
stop_app $BUN_PID

echo ""
echo "=== Results Comparison (No Database) ==="
echo "Node.js (No DB):"
grep -E "(Requests/sec|Transfer/sec|Latency)" result_simple_node.txt || echo "No results"
echo ""
echo "Bun (No DB):"
grep -E "(Requests/sec|Transfer/sec|Latency)" result_simple_bun.txt || echo "No results"
