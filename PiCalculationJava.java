/**
 * Pure computational benchmark: Leibniz formula for π
 * Single-threaded Java vs Single-threaded Bun
 * No I/O, no database, just pure math - where Java JIT should excel
 */
public class PiCalculationJava {
    
    public static void main(String[] args) {
        System.out.println("🔢 Java Single-Thread π Calculation (Leibniz Formula)");
        System.out.println("====================================================");
        
        // Warm up JIT compiler with smaller calculation
        System.out.println("⚡ Warming up JIT compiler...");
        warmupJIT();
        
        // Test different iteration counts
        int[] iterations = {1_000_000, 10_000_000, 100_000_000};
        
        for (int n : iterations) {
            System.out.println("\n🧮 Calculating π with " + String.format("%,d", n) + " iterations:");
            
            long startTime = System.nanoTime();
            double pi = calculatePiLeibniz(n);
            long endTime = System.nanoTime();
            
            double elapsedMs = (endTime - startTime) / 1_000_000.0;
            double accuracy = Math.abs(Math.PI - pi);
            
            System.out.println("   Result: " + pi);
            System.out.println("   Actual π: " + Math.PI);
            System.out.println("   Error: " + accuracy);
            System.out.println("   Time: " + String.format("%.2f", elapsedMs) + " ms");
            System.out.println("   Rate: " + String.format("%.0f", n / elapsedMs * 1000) + " iterations/second");
        }
        
        // Extended precision test - where Java should really shine
        System.out.println("\n🎯 Extended precision test (1 billion iterations):");
        long startTime = System.nanoTime();
        double pi = calculatePiLeibnizOptimized(1_000_000_000);
        long endTime = System.nanoTime();
        
        double elapsedMs = (endTime - startTime) / 1_000_000.0;
        double accuracy = Math.abs(Math.PI - pi);
        
        System.out.println("   Result: " + pi);
        System.out.println("   Error: " + accuracy);
        System.out.println("   Time: " + String.format("%.2f", elapsedMs) + " ms");
        System.out.println("   Rate: " + String.format("%.0f", 1_000_000_000 / elapsedMs * 1000) + " iterations/second");
        
        System.out.println("\n✅ Java benchmark complete!");
    }
    
    /**
     * Warm up the JIT compiler with repeated calculations
     */
    private static void warmupJIT() {
        for (int i = 0; i < 10; i++) {
            calculatePiLeibniz(100_000);
        }
    }
    
    /**
     * Calculate π using Leibniz formula: π/4 = 1 - 1/3 + 1/5 - 1/7 + 1/9 - ...
     * Standard implementation
     */
    private static double calculatePiLeibniz(int iterations) {
        double pi = 0.0;
        
        for (int i = 0; i < iterations; i++) {
            double term = 1.0 / (2 * i + 1);
            if (i % 2 == 0) {
                pi += term;
            } else {
                pi -= term;
            }
        }
        
        return pi * 4.0;
    }
    
    /**
     * Optimized version - should benefit from JIT compilation
     * Reduces conditional branching and improves cache locality
     */
    private static double calculatePiLeibnizOptimized(int iterations) {
        double pi = 0.0;
        double sign = 1.0;
        
        // Unroll loop for better performance (JIT should optimize this)
        int i = 0;
        for (; i < iterations - 4; i += 4) {
            pi += sign / (2 * i + 1);
            pi -= sign / (2 * i + 3);
            pi += sign / (2 * i + 5);
            pi -= sign / (2 * i + 7);
        }
        
        // Handle remaining iterations
        for (; i < iterations; i++) {
            pi += sign / (2 * i + 1);
            sign = -sign;
        }
        
        return pi * 4.0;
    }
}
