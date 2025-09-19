#!/bin/bash
set -e
JAR=target/iot-bench-0.1.0.jar

echo "=== IoT Benchmark: Virtual Threads ON vs OFF ==="

# Generate payload using python3 directly (avoiding macOS security issues)
echo "Generating payload..."
python3 generate_payload.py > payload.json

# Check if wrk is available
if ! command -v wrk &> /dev/null; then
    echo "ERROR: wrk is not installed. Install it with:"
    echo "  macOS: brew install wrk"
    echo "  Ubuntu: sudo apt install wrk"
    exit 1
fi

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
    while ! curl -s http://localhost:$port/ingest >/dev/null 2>&1; do
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
        echo "Stopping application (PID: $pid)..."
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
echo "Cleaning up any existing Spring Boot processes..."
pkill -f "iot-bench-0.1.0.jar" || true
wait_for_port_free 8080

# Start app OFF
echo ""
echo "=== Testing with Virtual Threads OFF ==="
echo "Starting Spring Boot with virtual threads OFF..."
java -Xms2g -Xmx2g -jar $JAR --spring.threads.virtual.enabled=false &
PID_OFF=$!
echo "Started with PID: $PID_OFF"

# Wait for application to be ready
wait_for_port_ready 8080

echo "Running wrk benchmark (60 seconds) with 7s timeout..."
wrk -t12 -c2000 -d60s --timeout 7s -s post.lua http://localhost:8080/ingest > result_off.txt
echo "Results saved to result_off.txt"

# Stop first application
stop_app $PID_OFF

# Start app ON
echo ""
echo "=== Testing with Virtual Threads ON ==="
echo "Starting Spring Boot with virtual threads ON..."
java -Xms2g -Xmx2g -jar $JAR --spring.threads.virtual.enabled=true &
PID_ON=$!
echo "Started with PID: $PID_ON"

# Wait for application to be ready
wait_for_port_ready 8080

echo "Running wrk benchmark (60 seconds) with 7s timeout..."
wrk -t12 -c2000 -d60s --timeout 7s -s post.lua http://localhost:8080/ingest > result_on.txt
echo "Results saved to result_on.txt"

# Stop second application
stop_app $PID_ON

echo ""
echo "=== Benchmark Complete! ==="
echo "Results:"
echo "  Virtual Threads OFF: result_off.txt"
echo "  Virtual Threads ON:  result_on.txt"
echo ""
echo "Quick comparison:"
echo "--- Virtual Threads OFF ---"
grep -E "(Requests/sec|Transfer/sec)" result_off.txt || echo "No results found in result_off.txt"
echo "--- Virtual Threads ON ---"
grep -E "(Requests/sec|Transfer/sec)" result_on.txt || echo "No results found in result_on.txt"
