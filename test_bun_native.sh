#!/bin/bash
set -e

echo "=== Test Bun Native Server (Bun.sqlite + Bun.serve) ==="

# Function to wait for port to be free
wait_for_port_free() {
    local port=$1
    local timeout=30
    local count=0
    
    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; do
        if [ $count -ge $timeout ]; then
            echo "Timeout waiting for port $port to be free"
            return 1
        fi
        sleep 1
        count=$((count + 1))
    done
}

# Function to wait for port to be ready
wait_for_port_ready() {
    local port=$1
    local timeout=30
    local count=0
    
    while ! curl -s http://localhost:$port/health >/dev/null 2>&1; do
        if [ $count -ge $timeout ]; then
            echo "Timeout waiting for port $port to be ready, trying anyway..."
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
}

# Generate payload
python3 generate_payload.py > payload.json

# Clean up
pkill -f "bun-native-server.js" || true
wait_for_port_free 8080

echo ""
echo "=== Testing Bun Native (Bun.sqlite + Bun.serve) ==="
bun bun-native-server.js &
BUN_PID=$!
wait_for_port_ready 8080
wrk -t12 -c2000 -d30s -s post.lua http://localhost:8080/ingest > result_bun_native.txt
kill $BUN_PID
wait_for_port_free 8080

echo ""
echo "=== Results Comparison ==="
echo "Bun Native (Bun.sqlite + Bun.serve):"
grep -E "(Requests/sec|Transfer/sec|Latency)" result_bun_native.txt || echo "No results"
echo ""
echo "Previous Bun + Fastify + node-sqlite3:"
grep -E "(Requests/sec|Transfer/sec|Latency)" result_bun.txt || echo "No results"
echo ""
echo "Node.js + Fastify + node-sqlite3:"
grep -E "(Requests/sec|Transfer/sec|Latency)" result_fastify.txt || echo "No results"
