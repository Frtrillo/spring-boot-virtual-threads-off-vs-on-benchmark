#!/bin/bash
set -e

echo "=== Spring Boot Ultra-Fast Benchmark ==="
echo "Spring Boot optimizado al máximo para comparación justa:"
echo "- CON base de datos H2 (equivalente a SQLite)"
echo "- Sin background processing"
echo "- Sin AsyncWorker"
echo "- Sin logging innecesario"
echo "- Prepared statements optimizados (JdbcTemplate)"
echo "- Virtual Threads habilitados"
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
    while ! curl -s http://localhost:$port/ultra/health >/dev/null 2>&1; do
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
wait_for_port_free 8080

echo ""
echo "=== Spring Boot Ultra-Fast (Virtual Threads ON) ==="
java -Xms2g -Xmx2g -jar $JAR --spring.threads.virtual.enabled=true --spring.profiles.active=ultrafast &
SPRING_ULTRA_PID=$!
wait_for_port_ready 8080
echo "Running ultra-fast benchmark..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ultra/ingest > result_spring_ultra_fast.txt
stop_app $SPRING_ULTRA_PID "Spring Boot Ultra-Fast"

echo ""
echo "=== SPRING BOOT ULTRA-FAST RESULTS ==="
echo "Spring Boot Ultra-Fast (Virtual Threads):"
grep -E "(Requests/sec|Transfer/sec|Latency)" result_spring_ultra_fast.txt || echo "No results found"

echo ""
echo "=== COMPARISON WITH NESTJS ULTRA-FAST ==="
if [ -f "result_ultra_fast_bun.txt" ]; then
    echo "NestJS Ultra-Fast (Bun + SQLite nativo):"
    grep -E "(Requests/sec|Transfer/sec)" result_ultra_fast_bun.txt || echo "No results"
    echo ""
fi

if [ -f "result_ultra_fast_node.txt" ]; then
    echo "NestJS Ultra-Fast (Node.js + SQLite3):"
    grep -E "(Requests/sec|Transfer/sec)" result_ultra_fast_node.txt || echo "No results"
    echo ""
fi

echo "Spring Boot Ultra-Fast (Java + H2):"
grep -E "(Requests/sec|Transfer/sec)" result_spring_ultra_fast.txt || echo "No results"

echo ""
echo "🎯 FAIR COMPARISON: Framework vs Framework (Ultra-Optimized)"
echo "   - NestJS + Fastify + SQLite vs Spring Boot + H2"
echo "   - Sin background processing en ninguno"
echo "   - Máximo rendimiento en ambos"
