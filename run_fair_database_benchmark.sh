#!/bin/bash

# Fair Database Benchmark - All using SQLite
# This should level the playing field

echo "⚖️  Fair Database Benchmark - All Using SQLite"
echo "=============================================="
echo "Testing with identical database backend (SQLite) for all runtimes"
echo ""

# Download SQLite JDBC driver if not present
if [ ! -f sqlite-jdbc.jar ]; then
    echo "📥 Downloading SQLite JDBC driver..."
    curl -L -o sqlite-jdbc.jar https://repo1.maven.org/maven2/org/xerial/sqlite-jdbc/3.44.1.0/sqlite-jdbc-3.44.1.0.jar
fi

# Test pure computation first (fixed Java version)
cat > PureComputationJava.java << 'EOF'
class PureComputationJava {
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

echo "🧮 Pure Computation Test (No Database):"
javac PureComputationJava.java
java PureComputationJava

node -e "
const start = process.hrtime.bigint();
for (let i = 0; i < 10000; i++) {
    let totalAmount = 100.0 + (i * 0.1);
    const discountRate = 0.15;
    let discountAmount = totalAmount * discountRate;
    let volumeDiscount = 0.0;
    if (i % 10 === 0) volumeDiscount = totalAmount * 0.05;
    const seasonalDiscount = totalAmount * 0.10;
    const weight = 5.0 + (i * 0.01);
    const shippingCost = (5.99 + weight * 0.5) * 1.2;
    const taxAmount = totalAmount * 0.08 * 1.0;
    const finalAmount = totalAmount - discountAmount - volumeDiscount - seasonalDiscount + shippingCost + taxAmount;
    if (finalAmount > 150.0) {
        Math.sin(finalAmount * Math.PI / 180);
    }
}
const elapsed = process.hrtime.bigint() - start;
console.log('Node.js Pure Computation: ' + (Number(elapsed) / 1_000_000) + 'ms for 10,000 calculations');
"

echo ""
echo "🗄️  SQLite Database Test (Fair Comparison):"

# Java with SQLite
cat > JavaSQLiteTest.java << 'EOF'
import java.sql.*;

class JavaSQLiteTest {
    public static void main(String[] args) throws Exception {
        // SQLite in-memory database (same as Node.js/Bun)
        Connection conn = DriverManager.getConnection("jdbc:sqlite::memory:");
        
        // Create table
        conn.createStatement().execute(
            "CREATE TABLE test_orders (id INTEGER, amount REAL, status TEXT)"
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
            insertStmt.setInt(1, i);
            insertStmt.setDouble(2, 100.0 + i);
            insertStmt.setString(3, "CONFIRMED");
            insertStmt.executeUpdate();
            
            // Select
            selectStmt.setInt(1, i);
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
        System.out.println("Java SQLite Database: " + (elapsed / 1_000_000) + "ms for 1,000 operations");
        
        conn.close();
    }
}
EOF

javac -cp ".:sqlite-jdbc.jar" JavaSQLiteTest.java
java -cp ".:sqlite-jdbc.jar" JavaSQLiteTest

# Node.js SQLite (same as before)
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run('CREATE TABLE test_orders (id INTEGER, amount REAL, status TEXT)');
    
    const insertStmt = db.prepare('INSERT INTO test_orders (id, amount, status) VALUES (?, ?, ?)');
    const selectStmt = db.prepare('SELECT amount, status FROM test_orders WHERE id = ?');
    
    const start = process.hrtime.bigint();
    let completed = 0;
    
    for (let i = 0; i < 1000; i++) {
        insertStmt.run(i, 100.0 + i, 'CONFIRMED', function() {
            selectStmt.get(i, function(err, row) {
                if (row) {
                    const amount = row.amount;
                    const status = row.status;
                    if (amount > 500) {
                        // Do something
                    }
                }
                
                completed++;
                if (completed === 1000) {
                    const elapsed = process.hrtime.bigint() - start;
                    console.log('Node.js SQLite Database: ' + (Number(elapsed) / 1_000_000) + 'ms for 1,000 operations');
                    db.close();
                }
            });
        });
    }
});
"

echo ""
echo "📊 Results Analysis:"
echo "• If Java SQLite performs similar to Node.js/Bun, the issue was H2 vs SQLite"
echo "• If JavaScript still wins significantly, it's the runtime performance"
echo "• This isolates database vs computation performance"

# Cleanup
rm -f *.java *.class
