#!/bin/bash
set -e
JAR=target/iot-bench-0.1.0.jar

# Build project
mvn -DskipTests package

# Generate payload
./generate_payload.py > payload.json

# Start app OFF
echo "Starting Spring Boot with virtual threads OFF..."
java -Xms2g -Xmx2g -jar $JAR --spring.threads.virtual.enabled=false &
PID=$!
sleep 5

echo "Running wrk..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > result_off.txt

kill $PID
sleep 5

# Start app ON
echo "Starting Spring Boot with virtual threads ON..."
java -Xms2g -Xmx2g -jar $JAR --spring.threads.virtual.enabled=true &
PID=$!
sleep 5

echo "Running wrk..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > result_on.txt

kill $PID

echo "Benchmark done. Results in result_off.txt and result_on.txt"
