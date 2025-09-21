#!/bin/bash

# Database Performance Isolation Test
# Tests the same business logic with different database backends

echo "🗄️  Database Performance Isolation Test"
echo "======================================="
echo "Testing if H2 vs SQLite is causing the performance difference"
echo ""

# Test 1: Pure computation (no database)
echo "🧮 Test 1: Pure Computation (No Database)"
echo "Testing business logic without any database operations"
echo ""

# Create pure computation versions
cat > pure-computation-java.java << 'EOF'
import java.util.*;

public class PureComputationJava {
    public static void main(String[] args) {
        long start = System.nanoTime();
        
        for (int i = 0; i < 10000; i++) {
            // Same pricing calculation as enterprise benchmark
            double totalAmount = 100.0 + (i * 0.1);
            double discountRate = 0.15;
            double discountAmount = totalAmount * discountRate;
            
            // Volume discount simulation
            double volumeDiscount = 0.0;
            if (i % 10 == 0) volumeDiscount = totalAmount * 0.05;
            
            // Seasonal discount
            double seasonalDiscount = totalAmount * 0.10;
            
            // Shipping calculation
            double weight = 5.0 + (i * 0.01);
            double shippingCost = (5.99 + weight * 0.5) * 1.2;
            
            // Tax calculation
            double taxAmount = totalAmount * 0.08 * 1.0;
            
            // Final calculation
            double finalAmount = totalAmount - discountAmount - volumeDiscount 
                               - seasonalDiscount + shippingCost + taxAmount;
            
            // Simulate some result processing
            if (finalAmount > 150.0) {
                Math.sin(finalAmount * Math.PI / 180);
            }
        }
        
        long elapsed = System.nanoTime() - start;
        System.out.println("Java Pure Computation: " + (elapsed / 1_000_000) + "ms for 10,000 calculations");
    }
}
EOF

cat > pure-computation-node.js << 'EOF'
const start = process.hrtime.bigint();

for (let i = 0; i < 10000; i++) {
    // Same pricing calculation as enterprise benchmark
    let totalAmount = 100.0 + (i * 0.1);
    const discountRate = 0.15;
    let discountAmount = totalAmount * discountRate;
    
    // Volume discount simulation
    let volumeDiscount = 0.0;
    if (i % 10 === 0) volumeDiscount = totalAmount * 0.05;
    
    // Seasonal discount
    const seasonalDiscount = totalAmount * 0.10;
    
    // Shipping calculation
    const weight = 5.0 + (i * 0.01);
    const shippingCost = (5.99 + weight * 0.5) * 1.2;
    
    // Tax calculation
    const taxAmount = totalAmount * 0.08 * 1.0;
    
    // Final calculation
    const finalAmount = totalAmount - discountAmount - volumeDiscount 
                       - seasonalDiscount + shippingCost + taxAmount;
    
    // Simulate some result processing
    if (finalAmount > 150.0) {
        Math.sin(finalAmount * Math.PI / 180);
    }
}

const elapsed = process.hrtime.bigint() - start;
console.log(`Node.js Pure Computation: ${Number(elapsed) / 1_000_000}ms for 10,000 calculations`);
EOF

# Run pure computation tests
echo "Running Java pure computation..."
javac pure-computation-java.java
java PureComputationJava

echo ""
echo "Running Node.js pure computation..."
node pure-computation-node.js

if command -v bun &> /dev/null; then
    echo ""
    echo "Running Bun pure computation..."
    bun run pure-computation-node.js
fi

echo ""
echo "🗄️  Test 2: Database Operation Isolation"
echo "Testing just database insert/select operations"
echo ""

# Create database-only test for Java
cat > DatabaseOnlyJava.java << 'EOF'
import java.sql.*;

public class DatabaseOnlyJava {
    public static void main(String[] args) throws Exception {
        // H2 in-memory database
        Connection conn = DriverManager.getConnection("jdbc:h2:mem:test", "", "");
        
        // Create table
        conn.createStatement().execute(
            "CREATE TABLE test_orders (id BIGINT, amount DECIMAL(10,2), status VARCHAR(50))"
        );
        
        PreparedStatement insertStmt = conn.prepareStatement(
            "INSERT INTO test_orders (id, amount, status) VALUES (?, ?, ?)"
        );
        
        PreparedStatement selectStmt = conn.prepareStatement(
            "SELECT amount, status FROM test_orders WHERE id = ?"
        );
        
        long start = System.nanoTime();
        
        // Test 1000 insert/select cycles
        for (int i = 0; i < 1000; i++) {
            // Insert
            insertStmt.setLong(1, i);
            insertStmt.setDouble(2, 100.0 + i);
            insertStmt.setString(3, "CONFIRMED");
            insertStmt.executeUpdate();
            
            // Select
            selectStmt.setLong(1, i);
            ResultSet rs = selectStmt.executeQuery();
            if (rs.next()) {
                double amount = rs.getDouble("amount");
                String status = rs.getString("status");
                // Simulate some processing
                if (amount > 500) {
                    // Do something
                }
            }
            rs.close();
        }
        
        long elapsed = System.nanoTime() - start;
        System.out.println("Java H2 Database: " + (elapsed / 1_000_000) + "ms for 1,000 operations");
        
        conn.close();
    }
}
EOF

# Create database-only test for Node.js
cat > database-only-node.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE test_orders (id INTEGER, amount REAL, status TEXT)");
    
    const insertStmt = db.prepare("INSERT INTO test_orders (id, amount, status) VALUES (?, ?, ?)");
    const selectStmt = db.prepare("SELECT amount, status FROM test_orders WHERE id = ?");
    
    const start = process.hrtime.bigint();
    let completed = 0;
    
    // Test 1000 insert/select cycles
    for (let i = 0; i < 1000; i++) {
        insertStmt.run(i, 100.0 + i, "CONFIRMED", function() {
            selectStmt.get(i, function(err, row) {
                if (row) {
                    const amount = row.amount;
                    const status = row.status;
                    // Simulate some processing
                    if (amount > 500) {
                        // Do something
                    }
                }
                
                completed++;
                if (completed === 1000) {
                    const elapsed = process.hrtime.bigint() - start;
                    console.log(`Node.js SQLite Database: ${Number(elapsed) / 1_000_000}ms for 1,000 operations`);
                    db.close();
                }
            });
        });
    }
});
EOF

# Create database-only test for Bun
cat > database-only-bun.ts << 'EOF'
import { Database } from "bun:sqlite";

const db = new Database(":memory:");

db.exec("CREATE TABLE test_orders (id INTEGER, amount REAL, status TEXT)");

const insertStmt = db.prepare("INSERT INTO test_orders (id, amount, status) VALUES (?, ?, ?)");
const selectStmt = db.prepare("SELECT amount, status FROM test_orders WHERE id = ?");

const start = Bun.nanoseconds();

// Test 1000 insert/select cycles  
for (let i = 0; i < 1000; i++) {
    // Insert
    insertStmt.run(i, 100.0 + i, "CONFIRMED");
    
    // Select
    const row = selectStmt.get(i) as any;
    if (row) {
        const amount = row.amount;
        const status = row.status;
        // Simulate some processing
        if (amount > 500) {
            // Do something
        }
    }
}

const elapsed = Bun.nanoseconds() - start;
console.log(`Bun Native SQLite Database: ${elapsed / 1_000_000}ms for 1,000 operations`);

db.close();
EOF

# Run database tests
echo "Running Java H2 database test..."
javac -cp ".:$(find ~/.m2/repository -name 'h2*.jar' | head -1)" DatabaseOnlyJava.java 2>/dev/null || javac DatabaseOnlyJava.java
java -cp ".:$(find ~/.m2/repository -name 'h2*.jar' | head -1)" DatabaseOnlyJava 2>/dev/null || echo "❌ H2 driver not found in Maven repo"

echo ""
echo "Running Node.js SQLite database test..."
node database-only-node.js

if command -v bun &> /dev/null; then
    echo ""
    echo "Running Bun native SQLite database test..."
    bun run database-only-bun.ts
fi

echo ""
echo "🔍 Analysis:"
echo "• If pure computation shows similar performance, the issue is database-related"
echo "• If Java H2 is significantly slower than SQLite, that explains the benchmark results"
echo "• Bun's native SQLite integration is likely much faster than JDBC overhead"

# Cleanup
rm -f *.java *.class pure-computation-node.js database-only-node.js database-only-bun.ts

echo ""
echo "💡 Potential Solutions to Test:"
echo "1. Use SQLite with Java (via SQLite JDBC driver)"
echo "2. Test with identical database operations"
echo "3. Measure database vs computation time separately"
