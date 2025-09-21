#!/bin/bash

# Simple Fair Enterprise Benchmark
# Uses existing clustered-server.js for Node.js cluster mode

echo "⚖️  Simple Fair Enterprise Benchmark"
echo "===================================="
echo "Fair CPU utilization comparison:"
echo "• Java: Virtual Threads (all cores)"
echo "• Node.js: Cluster mode (all cores)"  
echo "• Bun: Single instance (1 core) - baseline"
echo ""

# Check dependencies
if ! command -v wrk &> /dev/null; then
    echo "❌ wrk not installed"
    exit 1
fi

# Generate payload if needed
if [ ! -f payload.json ]; then
    python3 generate_payload.py
fi

run_test() {
    local name="$1"
    local port="$2" 
    local result_file="$3"
    
    echo ""
    echo "🧪 Testing $name..."
    echo "⏱️  Warming up..."
    wrk -t4 -c100 -d10s -s post.lua http://localhost:$port/enterprise/process > /dev/null 2>&1
    sleep 2
    
    echo "🚀 Running benchmark (60s, 2000 connections)..."
    wrk -t12 -c2000 -d60s --timeout 10s -s post.lua http://localhost:$port/enterprise/process > "$result_file"
    
    local rps=$(grep "Requests/sec:" "$result_file" | awk '{print $2}' | tr -d ',')
    local latency=$(grep "Latency" "$result_file" | awk '{print $2}')
    echo "   📊 RPS: $rps, Latency: $latency"
}

# Build Java app
echo "🔨 Building Java..."
mvn clean package -q -DskipTests

# Test 1: Java Virtual Threads
echo ""
echo "🟢 Java + Virtual Threads..."
java -jar target/iot-bench-0.1.0.jar \
     --spring.main.class=com.example.iotbench.EnterpriseApplication \
     --server.port=8080 > /dev/null 2>&1 &
JAVA_PID=$!

sleep 15
if curl -s http://localhost:8080/enterprise/health > /dev/null; then
    run_test "Java Virtual Threads" 8080 "result_java_fair.txt"
else
    echo "❌ Java failed to start"
fi
kill $JAVA_PID 2>/dev/null
sleep 3

# Test 2: Node.js Cluster  
echo ""
echo "🟦 Node.js Cluster Mode..."
node clustered-server.js > /dev/null 2>&1 &
NODE_PID=$!

sleep 8
if curl -s http://localhost:8080/enterprise/health > /dev/null; then
    run_test "Node.js Cluster (8 cores)" 8080 "result_nodejs_fair.txt"
else
    echo "❌ Node.js cluster failed"
fi
kill $NODE_PID 2>/dev/null
sleep 3

# Test 3: Bun Single Instance
echo ""
echo "🟠 Bun Single Instance..."
if command -v bun &> /dev/null; then
    bun run enterprise-bun-server.ts > /dev/null 2>&1 &
    BUN_PID=$!
    
    sleep 5
    if curl -s http://localhost:8080/enterprise/health > /dev/null; then
        run_test "Bun Single (1 core)" 8080 "result_bun_fair.txt"
    else
        echo "❌ Bun failed"
    fi
    kill $BUN_PID 2>/dev/null
else
    echo "⚠️  Bun not installed"
fi

# Results Summary
echo ""
echo "🏆 FAIR BENCHMARK RESULTS"
echo "========================="
printf "%-25s | %10s | %10s\n" "Runtime" "RPS" "Latency"
printf "%-25s | %10s | %10s\n" "-------------------------" "----------" "----------"

for result in result_java_fair.txt result_nodejs_fair.txt result_bun_fair.txt; do
    if [ -f "$result" ]; then
        name=$(echo $result | sed 's/result_//;s/_fair.txt//;s/_/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
        rps=$(grep "Requests/sec:" "$result" | awk '{print $2}' | tr -d ',')
        latency=$(grep "Latency" "$result" | awk '{print $2}')
        printf "%-25s | %10s | %10s\n" "$name" "$rps" "$latency"
    fi
done

echo ""
echo "📊 Now it's a fair fight with proper CPU utilization!"
