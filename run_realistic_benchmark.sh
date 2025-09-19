#!/bin/bash
set -e

echo "=== Realistic IoT Benchmark (No Artificial Sleep) ==="
echo "This benchmark represents real-world IoT processing:"
echo "- JSON parsing and validation"
echo "- Data enrichment and metrics calculation"
echo "- Monte Carlo risk assessment (CPU intensive)"
echo "- Database operations"
echo "- Background processing"
echo ""

JAR=target/iot-bench-0.1.0.jar

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
    local name=$2
    if [ ! -z "$pid" ] && kill -0 $pid 2>/dev/null; then
        echo "Stopping $name (PID: $pid)..."
        kill $pid
        
        # Wait for process to stop
        local count=0
        while kill -0 $pid 2>/dev/null && [ $count -lt 15 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            echo "Force killing $name..."
            kill -9 $pid 2>/dev/null || true
        fi
        
        wait_for_port_free 8080
    fi
}

# Generate payload
echo "Generating payload..."
python3 generate_payload.py > payload.json

# Clean up any existing processes
echo "Cleaning up any existing processes..."
pkill -f "iot-bench-0.1.0.jar" || true
pkill -f "realistic-server.js" || true
wait_for_port_free 8080

echo ""
echo "=== 1. Spring Boot Virtual Threads OFF (Realistic) ==="
java -Xms2g -Xmx2g -jar $JAR --spring.threads.virtual.enabled=false &
SPRING_OFF_PID=$!
wait_for_port_ready 8080
echo "Running benchmark..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > result_realistic_spring_off.txt
stop_app $SPRING_OFF_PID "Spring Boot OFF"

echo ""
echo "=== 2. Spring Boot Virtual Threads ON (Realistic) ==="
java -Xms2g -Xmx2g -jar $JAR --spring.threads.virtual.enabled=true &
SPRING_ON_PID=$!
wait_for_port_ready 8080
echo "Running benchmark..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > result_realistic_spring_on.txt
stop_app $SPRING_ON_PID "Spring Boot ON"

echo ""
echo "=== 3. Node.js Realistic (Single Core) ==="
node realistic-server.js &
NODE_PID=$!
wait_for_port_ready 8080
echo "Running benchmark..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > result_realistic_node.txt
stop_app $NODE_PID "Node.js"

echo ""
echo "=== 4. Bun Realistic (Single Core) ==="
bun realistic-server.js &
BUN_PID=$!
wait_for_port_ready 8080
echo "Running benchmark..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > result_realistic_bun.txt
stop_app $BUN_PID "Bun"

echo ""
echo "=== REALISTIC BENCHMARK RESULTS ==="
echo "🏆 FINAL RANKINGS:"
echo ""

echo "1. Spring Boot Virtual Threads ON:"
grep -E "(Requests/sec|Transfer/sec)" result_realistic_spring_on.txt || echo "No results found"
echo ""

echo "2. Spring Boot Virtual Threads OFF:"
grep -E "(Requests/sec|Transfer/sec)" result_realistic_spring_off.txt || echo "No results found"
echo ""

echo "3. Bun (Single Core):"
grep -E "(Requests/sec|Transfer/sec)" result_realistic_bun.txt || echo "No results found"
echo ""

echo "4. Node.js (Single Core):"
grep -E "(Requests/sec|Transfer/sec)" result_realistic_node.txt || echo "No results found"
echo ""

echo "🎯 This benchmark represents REAL IoT workloads:"
echo "   - JSON processing and validation"
echo "   - Data enrichment and calculations" 
echo "   - Monte Carlo risk assessment"
echo "   - Database operations"
echo "   - NO artificial sleep!"
echo ""
echo "💡 Now we should see Bun's true performance!"
