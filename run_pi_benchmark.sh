#!/bin/bash

# Pure Computational Benchmark: π Calculation using Leibniz Formula
# Single-threaded Java vs Single-threaded Bun vs Single-threaded Node.js
# No I/O, no database, just pure mathematical computation

echo "🔢 PURE COMPUTATIONAL BENCHMARK: π Calculation"
echo "=============================================="
echo "Testing Leibniz formula for π approximation"
echo "• Single-threaded execution only"
echo "• No I/O operations"
echo "• No database access"
echo "• Pure mathematical computation"
echo "• Fair comparison of JIT compilation effectiveness"
echo ""

echo "📊 This benchmark should favor:"
echo "   • Java: JIT compilation, optimized floating-point operations"
echo "   • Compiled languages: Direct machine code execution"
echo "   • Mathematical optimization: Loop unrolling, vectorization"
echo ""

# Test 1: Java (with JIT warmup)
echo "☕ Running Java π calculation..."
echo "================================"
javac PiCalculationJava.java
java PiCalculationJava

echo ""
echo "🟠 Running Bun π calculation..."
echo "=============================="
if command -v bun &> /dev/null; then
    bun run pi-calculation-bun.ts
else
    echo "⚠️  Bun not installed, skipping Bun test"
fi

echo ""
echo "🟦 Running Node.js π calculation..."
echo "=================================="
node pi-calculation-nodejs.js

echo ""
echo "🏆 PURE COMPUTATIONAL BENCHMARK SUMMARY"
echo "======================================="
echo ""
echo "📊 Expected Results:"
echo "• Java should excel due to:"
echo "  - HotSpot JIT compilation optimizations"
echo "  - Mature floating-point operation handling"
echo "  - Loop optimization and vectorization"
echo "  - Years of mathematical computation tuning"
echo ""
echo "• JavaScript runtimes may struggle with:"
echo "  - Less mature mathematical optimizations"
echo "  - Dynamic typing overhead"
echo "  - Limited low-level optimization control"
echo ""
echo "🎯 This benchmark eliminates:"
echo "  ❌ Database performance differences"
echo "  ❌ I/O operation overhead"
echo "  ❌ Framework complexity"
echo "  ❌ Multi-threading advantages"
echo ""
echo "✅ Pure focus on:"
echo "  • JIT compilation effectiveness"
echo "  • Mathematical operation optimization"
echo "  • Single-threaded computational performance"
echo "  • Fair runtime comparison"

# Cleanup
rm -f *.class

echo ""
echo "📁 This benchmark provides the fairest possible comparison"
echo "   of pure computational performance between runtimes."
