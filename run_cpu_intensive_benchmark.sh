#!/bin/bash

# CPU-Intensive IoT Processing Benchmark
# This benchmark is designed to showcase Java's strengths:
# 1. CPU-intensive computations (JVM optimizations, JIT compilation)
# 2. Multi-core utilization (parallel processing)
# 3. Memory management (garbage collection efficiency)
# 4. Mathematical computations (where Java excels)

echo "🧮 CPU-Intensive IoT Processing Benchmark"
echo "========================================="
echo "This benchmark tests computationally heavy workloads with:"
echo "• Complex mathematical calculations (Monte Carlo simulations)"
echo "• Multi-threaded parallel processing"
echo "• Memory-intensive operations"
echo "• JVM optimization advantages (JIT compilation)"
echo ""

# Check if wrk is installed
if ! command -v wrk &> /dev/null; then
    echo "❌ wrk is not installed. Please install it first:"
    echo "   macOS: brew install wrk"
    echo "   Ubuntu: sudo apt-get install wrk"
    echo "   Or build from source: https://github.com/wg/wrk"
    exit 1
fi

# Generate payload
echo "📝 Generating test payload..."
if [ ! -f payload.json ]; then
    python3 generate_payload.py
fi

# Function to run benchmark
run_benchmark() {
    local name="$1"
    local port="$2"
    local result_file="$3"
    
    echo ""
    echo "🧪 Testing $name..."
    echo "⏱️  Warming up (15 seconds for JIT compilation)..."
    
    # Extended warmup for JVM JIT compilation
    wrk -t4 -c50 -d15s -s post_cpu.lua http://localhost:$port/cpu/compute > /dev/null 2>&1
    
    sleep 2
    
    echo "🚀 Running benchmark (60 seconds, 1000 connections)..."
    echo "📊 This workload favors technologies with strong CPU performance"
    
    # CPU-intensive benchmark - fewer connections, focus on throughput
    wrk -t8 -c1000 -d60s --timeout 30s -s post_cpu.lua http://localhost:$port/cpu/compute > "$result_file"
    
    # Show results
    echo "📈 Results for $name:"
    grep -E "(Requests/sec|Transfer/sec|Latency|Socket errors)" "$result_file" | head -4
    
    # Extract key metrics for comparison
    local rps=$(grep "Requests/sec:" "$result_file" | awk '{print $2}' | tr -d ',')
    local latency=$(grep "Latency" "$result_file" | awk '{print $2}')
    local errors=$(grep "Socket errors:" "$result_file" | grep -o "timeout [0-9]*" | awk '{print $2}' || echo "0")
    
    echo "   • RPS: $rps"
    echo "   • Latency: $latency"
    echo "   • Timeouts: $errors"
    
    sleep 3
}

# Build Spring Boot application
echo "🔨 Building Spring Boot CPU-Intensive application..."
mvn clean package -q -DskipTests

# Test 1: Spring Boot with Virtual Threads ON
echo ""
echo "🟢 Starting Spring Boot CPU-Intensive (Virtual Threads ON)..."
export SPRING_THREADS_VIRTUAL_ENABLED=true
java -server -Xms2g -Xmx4g -XX:+UseG1GC -XX:+UseStringDeduplication \
     -jar target/iot-bench-0.1.0.jar --spring.main.web-application-type=servlet \
     --spring.application.name=cpu-intensive-vt-on \
     --server.port=8080 \
     --logging.level.org.springframework=WARN \
     --logging.level.com.zaxxer.hikari=WARN \
     --spring.main.class=com.example.iotbench.CpuIntensiveApplication > /dev/null 2>&1 &
SPRING_VT_PID=$!

# Wait for Spring Boot to start with JIT warmup
echo "⏳ Waiting for Spring Boot to start and JIT to warm up..."
sleep 20

# Check if Spring Boot started
if ! curl -s http://localhost:8080/cpu/health > /dev/null; then
    echo "❌ Spring Boot failed to start"
    kill $SPRING_VT_PID 2>/dev/null
    exit 1
fi

run_benchmark "Spring Boot + Virtual Threads (CPU)" 8080 "result_cpu_spring_vt_on.txt"

# Kill Spring Boot VT
kill $SPRING_VT_PID
sleep 5

# Test 2: Spring Boot with Virtual Threads OFF
echo ""
echo "🟡 Starting Spring Boot CPU-Intensive (Virtual Threads OFF)..."
export SPRING_THREADS_VIRTUAL_ENABLED=false
java -server -Xms2g -Xmx4g -XX:+UseG1GC -XX:+UseStringDeduplication \
     -jar target/iot-bench-0.1.0.jar --spring.main.web-application-type=servlet \
     --spring.application.name=cpu-intensive-vt-off \
     --server.port=8080 \
     --logging.level.org.springframework=WARN \
     --logging.level.com.zaxxer.hikari=WARN \
     --spring.main.class=com.example.iotbench.CpuIntensiveApplication > /dev/null 2>&1 &
SPRING_TRADITIONAL_PID=$!

# Wait for Spring Boot to start with JIT warmup
echo "⏳ Waiting for Spring Boot to start and JIT to warm up..."
sleep 20

# Check if Spring Boot started
if ! curl -s http://localhost:8080/cpu/health > /dev/null; then
    echo "❌ Spring Boot failed to start"
    kill $SPRING_TRADITIONAL_PID 2>/dev/null
    exit 1
fi

run_benchmark "Spring Boot Traditional (CPU)" 8080 "result_cpu_spring_vt_off.txt"

# Kill Spring Boot Traditional
kill $SPRING_TRADITIONAL_PID
sleep 5

# Test 3: Node.js CPU-Intensive
echo ""
echo "🟦 Starting Node.js CPU-Intensive server..."
node cpu-intensive-nodejs-server.js > /dev/null 2>&1 &
NODE_PID=$!

# Wait for Node.js to start
echo "⏳ Waiting for Node.js to start..."
sleep 5

# Check if Node.js started
if ! curl -s http://localhost:8080/cpu/health > /dev/null; then
    echo "❌ Node.js failed to start"
    kill $NODE_PID 2>/dev/null
    exit 1
fi

run_benchmark "Node.js CPU-Intensive" 8080 "result_cpu_nodejs.txt"

# Kill Node.js
kill $NODE_PID
sleep 3

# Test 4: Bun CPU-Intensive
echo ""
echo "🟠 Starting Bun CPU-Intensive server..."
if command -v bun &> /dev/null; then
    bun run cpu-intensive-bun-server.ts > /dev/null 2>&1 &
    BUN_PID=$!
    
    # Wait for Bun to start
    echo "⏳ Waiting for Bun to start..."
    sleep 5
    
    # Check if Bun started
    if curl -s http://localhost:8080/cpu/health > /dev/null; then
        run_benchmark "Bun CPU-Intensive" 8080 "result_cpu_bun.txt"
    else
        echo "❌ Bun failed to start"
    fi
    
    # Kill Bun
    kill $BUN_PID 2>/dev/null
    sleep 3
else
    echo "⚠️  Bun not installed, skipping Bun benchmark"
    echo "   Install with: curl -fsSL https://bun.sh/install | bash"
fi

# Final Results Summary
echo ""
echo "🏆 CPU-INTENSIVE BENCHMARK RESULTS SUMMARY"
echo "==========================================="
echo ""

# Function to extract and display results
show_results() {
    local file="$1"
    local name="$2"
    
    if [ -f "$file" ]; then
        local rps=$(grep "Requests/sec:" "$file" | awk '{print $2}' | tr -d ',')
        local transfer=$(grep "Transfer/sec:" "$file" | awk '{print $2}')
        local latency=$(grep "Latency" "$file" | awk '{print $2}')
        local timeouts=$(grep "Socket errors:" "$file" | grep -o "timeout [0-9]*" | awk '{print $2}' || echo "0")
        
        printf "%-35s | %10s | %8s | %8s | %8s\n" "$name" "$rps" "$transfer" "$latency" "$timeouts"
    else
        printf "%-35s | %10s | %8s | %8s | %8s\n" "$name" "N/A" "N/A" "N/A" "N/A"
    fi
}

printf "%-35s | %10s | %8s | %8s | %8s\n" "Framework" "RPS" "Transfer" "Latency" "Timeouts"
printf "%-35s | %10s | %8s | %8s | %8s\n" "-----------------------------------" "----------" "--------" "--------" "--------"

show_results "result_cpu_spring_vt_on.txt" "Spring Boot + Virtual Threads (CPU)"
show_results "result_cpu_spring_vt_off.txt" "Spring Boot Traditional (CPU)"
show_results "result_cpu_nodejs.txt" "Node.js CPU-Intensive"
show_results "result_cpu_bun.txt" "Bun CPU-Intensive"

echo ""
echo "📊 Analysis:"
echo "• This benchmark tests CPU-intensive computations"
echo "• Complex mathematical calculations (Monte Carlo simulations)"
echo "• Multi-threaded parallel processing (Java advantage)"
echo "• JVM optimizations and JIT compilation (Java advantage)"
echo "• Memory-intensive operations (Java GC advantage)"
echo ""
echo "🎯 Expected Winner: Spring Boot (especially with JIT warmup)"
echo "   Reason: JVM optimizations, multi-core utilization, efficient GC"
echo ""
echo "📁 Detailed results saved to result_cpu_*.txt files"
