#!/bin/bash

# Enterprise IoT Processing Benchmark
# This benchmark is designed to showcase Spring Boot + Virtual Threads strengths:
# 1. Multiple sequential I/O operations (database, file, network)
# 2. Complex enterprise patterns (transactions, caching, auditing)
# 3. Real blocking I/O (not artificial sleeps)

echo "🏢 Enterprise IoT Processing Benchmark"
echo "======================================"
echo "This benchmark tests a realistic enterprise workload with:"
echo "• Multiple database operations with transactions"
echo "• File I/O operations (real blocking I/O)"
echo "• External API calls (network I/O)"
echo "• Complex business logic and caching"
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
    echo "⏱️  Warming up (10 seconds)..."
    
    # Warmup
    wrk -t4 -c100 -d10s -s post.lua http://localhost:$port/enterprise/process > /dev/null 2>&1
    
    sleep 2
    
    echo "🚀 Running benchmark (60 seconds, 2000 connections)..."
    echo "📊 This workload favors technologies that handle multiple I/O operations well"
    
    # Main benchmark - longer timeout for complex operations
    wrk -t12 -c2000 -d60s --timeout 10s -s post.lua http://localhost:$port/enterprise/process > "$result_file"
    
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
echo "🔨 Building Spring Boot Enterprise application..."
mvn clean package -q -DskipTests

# Test 1: Spring Boot with Virtual Threads ON
echo ""
echo "🟢 Starting Spring Boot Enterprise (Virtual Threads ON)..."
export SPRING_THREADS_VIRTUAL_ENABLED=true
java -jar target/iot-bench-0.1.0.jar --spring.main.web-application-type=servlet \
     --spring.application.name=enterprise-vt-on \
     --server.port=8080 \
     --logging.level.org.springframework=WARN \
     --logging.level.com.zaxxer.hikari=WARN \
     --spring.main.class=com.example.iotbench.EnterpriseApplication > /dev/null 2>&1 &
SPRING_VT_PID=$!

# Wait for Spring Boot to start
echo "⏳ Waiting for Spring Boot to start..."
sleep 15

# Check if Spring Boot started
if ! curl -s http://localhost:8080/enterprise/health > /dev/null; then
    echo "❌ Spring Boot failed to start"
    kill $SPRING_VT_PID 2>/dev/null
    exit 1
fi

run_benchmark "Spring Boot + Virtual Threads" 8080 "result_enterprise_spring_vt_on.txt"

# Kill Spring Boot VT
kill $SPRING_VT_PID
sleep 5

# Test 2: Spring Boot with Virtual Threads OFF
echo ""
echo "🟡 Starting Spring Boot Enterprise (Virtual Threads OFF)..."
export SPRING_THREADS_VIRTUAL_ENABLED=false
java -jar target/iot-bench-0.1.0.jar --spring.main.web-application-type=servlet \
     --spring.application.name=enterprise-vt-off \
     --server.port=8080 \
     --logging.level.org.springframework=WARN \
     --logging.level.com.zaxxer.hikari=WARN \
     --spring.main.class=com.example.iotbench.EnterpriseApplication > /dev/null 2>&1 &
SPRING_TRADITIONAL_PID=$!

# Wait for Spring Boot to start
echo "⏳ Waiting for Spring Boot to start..."
sleep 15

# Check if Spring Boot started
if ! curl -s http://localhost:8080/enterprise/health > /dev/null; then
    echo "❌ Spring Boot failed to start"
    kill $SPRING_TRADITIONAL_PID 2>/dev/null
    exit 1
fi

run_benchmark "Spring Boot Traditional" 8080 "result_enterprise_spring_vt_off.txt"

# Kill Spring Boot Traditional
kill $SPRING_TRADITIONAL_PID
sleep 5

# Test 3: Node.js Enterprise
echo ""
echo "🟦 Starting Node.js Enterprise server..."
node enterprise-nodejs-server.js > /dev/null 2>&1 &
NODE_PID=$!

# Wait for Node.js to start
echo "⏳ Waiting for Node.js to start..."
sleep 5

# Check if Node.js started
if ! curl -s http://localhost:8080/enterprise/health > /dev/null; then
    echo "❌ Node.js failed to start"
    kill $NODE_PID 2>/dev/null
    exit 1
fi

run_benchmark "Node.js Enterprise" 8080 "result_enterprise_nodejs.txt"

# Kill Node.js
kill $NODE_PID
sleep 3

# Test 4: Bun Enterprise
echo ""
echo "🟠 Starting Bun Enterprise server..."
if command -v bun &> /dev/null; then
    bun run enterprise-bun-server.ts > /dev/null 2>&1 &
    BUN_PID=$!
    
    # Wait for Bun to start
    echo "⏳ Waiting for Bun to start..."
    sleep 5
    
    # Check if Bun started
    if curl -s http://localhost:8080/enterprise/health > /dev/null; then
        run_benchmark "Bun Enterprise" 8080 "result_enterprise_bun.txt"
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
echo "🏆 ENTERPRISE BENCHMARK RESULTS SUMMARY"
echo "======================================="
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
        
        printf "%-30s | %10s | %8s | %8s | %8s\n" "$name" "$rps" "$transfer" "$latency" "$timeouts"
    else
        printf "%-30s | %10s | %8s | %8s | %8s\n" "$name" "N/A" "N/A" "N/A" "N/A"
    fi
}

printf "%-30s | %10s | %8s | %8s | %8s\n" "Framework" "RPS" "Transfer" "Latency" "Timeouts"
printf "%-30s | %10s | %8s | %8s | %8s\n" "------------------------------" "----------" "--------" "--------" "--------"

show_results "result_enterprise_spring_vt_on.txt" "Spring Boot (Virtual Threads)"
show_results "result_enterprise_spring_vt_off.txt" "Spring Boot (Traditional)"
show_results "result_enterprise_nodejs.txt" "Node.js Enterprise"
show_results "result_enterprise_bun.txt" "Bun Enterprise"

echo ""
echo "📊 Analysis:"
echo "• This benchmark tests REAL enterprise I/O patterns"
echo "• Multiple sequential database operations"
echo "• File I/O operations (where Virtual Threads excel)"
echo "• Network I/O operations (where all async runtimes do well)"
echo "• Complex business logic with transactions and caching"
echo ""
echo "🎯 Expected Winner: Spring Boot + Virtual Threads"
echo "   Reason: Designed for multiple blocking I/O operations"
echo ""
echo "📁 Detailed results saved to result_enterprise_*.txt files"
