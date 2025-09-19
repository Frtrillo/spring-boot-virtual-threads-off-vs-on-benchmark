#!/bin/bash
set -e

echo "=== Ultra-Fast NestJS + SQLite Benchmark ==="
echo "Optimizado al máximo pero REALISTA:"
echo "- CON base de datos SQLite (Bun nativo vs Node.js)"
echo "- Sin background processing"
echo "- Sin dependency injection"
echo "- Sin logging"
echo "- Prepared statements optimizados"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check available runtimes
NODE_AVAILABLE=false
BUN_AVAILABLE=false

if command_exists node; then
    NODE_AVAILABLE=true
    NODE_VERSION=$(node --version)
fi

if command_exists bun; then
    BUN_AVAILABLE=true
    BUN_VERSION=$(bun --version)
fi

# Display available options
echo "Available JavaScript runtimes:"
if [ "$NODE_AVAILABLE" = true ]; then
    echo "  1) Node.js $NODE_VERSION"
fi
if [ "$BUN_AVAILABLE" = true ]; then
    echo "  2) Bun v$BUN_VERSION"
fi

# Ask user to choose runtime
echo ""
if [ "$NODE_AVAILABLE" = true ] && [ "$BUN_AVAILABLE" = true ]; then
    read -p "Choose runtime (1 for Node.js, 2 for Bun): " choice
    case $choice in
        1)
            RUNTIME="node"
            RUNTIME_NAME="Node.js $NODE_VERSION"
            PACKAGE_MANAGER="npm"
            ;;
        2)
            RUNTIME="bun"
            RUNTIME_NAME="Bun v$BUN_VERSION"
            PACKAGE_MANAGER="bun"
            ;;
        *)
            echo "Invalid choice. Using Node.js as default."
            RUNTIME="node"
            RUNTIME_NAME="Node.js $NODE_VERSION"
            PACKAGE_MANAGER="npm"
            ;;
    esac
elif [ "$NODE_AVAILABLE" = true ]; then
    echo "Using Node.js (only available runtime)"
    RUNTIME="node"
    RUNTIME_NAME="Node.js $NODE_VERSION"
    PACKAGE_MANAGER="npm"
else
    echo "Using Bun (only available runtime)"
    RUNTIME="bun"
    RUNTIME_NAME="Bun v$BUN_VERSION"
    PACKAGE_MANAGER="bun"
fi

echo "Selected runtime: $RUNTIME_NAME"

# Copy NestJS package.json and install
cp package-nestjs.json package.json

echo "Installing dependencies with $PACKAGE_MANAGER..."
if [ "$PACKAGE_MANAGER" = "npm" ]; then
    npm install --silent
else
    bun install --silent
fi

# Build TypeScript
echo "Building TypeScript..."
if [ "$PACKAGE_MANAGER" = "npm" ]; then
    npx tsc
else
    bun run tsc
fi

# Generate payload
python3 generate_payload.py > payload.json

# Function to wait for port to be free
wait_for_port_free() {
    local port=$1
    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; do
        sleep 1
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

# Clean up
pkill -f "ultra-fast-server.js" || true
wait_for_port_free 8080

# Determine output file
if [ "$RUNTIME" = "bun" ]; then
    RESULT_FILE="result_ultra_fast_bun.txt"
    RUNTIME_DISPLAY="Ultra-Fast NestJS (Bun)"
else
    RESULT_FILE="result_ultra_fast_node.txt"
    RUNTIME_DISPLAY="Ultra-Fast NestJS (Node.js)"
fi

# Start server
echo ""
echo "=== Testing $RUNTIME_DISPLAY ==="
$RUNTIME dist/ultra-fast-server.js &
SERVER_PID=$!
wait_for_port_ready 8080

echo "Running MAXIMUM SPEED benchmark..."
wrk -t12 -c2000 -d60s -s post.lua http://localhost:8080/ingest > "$RESULT_FILE"

# Stop server
kill $SERVER_PID 2>/dev/null || true
wait_for_port_free 8080

echo ""
echo "=== ULTRA-FAST RESULTS ==="
echo "$RUNTIME_DISPLAY:"
grep -E "(Requests/sec|Transfer/sec|Latency)" "$RESULT_FILE" || echo "No results found"

echo ""
echo "=== Comparison with Previous Results ==="
if [ -f "result_realistic_bun.txt" ]; then
    echo "Previous Bun (with DB + processing):"
    grep -E "(Requests/sec)" result_realistic_bun.txt || echo "No results"
fi

if [ -f "result_realistic_node.txt" ]; then
    echo "Previous Node.js (with DB + processing):"
    grep -E "(Requests/sec)" result_realistic_node.txt || echo "No results"
fi

echo ""
echo "🚀 NOW Bun should DOMINATE like in the official benchmarks!"
