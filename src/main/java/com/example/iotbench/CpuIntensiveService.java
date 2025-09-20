package com.example.iotbench;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.IntStream;

@Service
public class CpuIntensiveService {

    /**
     * CPU-intensive computation that showcases Java's strengths:
     * 1. JIT compilation optimizations
     * 2. Multi-core parallel processing
     * 3. Efficient memory management
     * 4. Mathematical computation performance
     */
    public CpuComputationResult performCpuIntensiveComputation(Map<String, Object> payload, ForkJoinPool threadPool) throws Exception {
        String computationId = UUID.randomUUID().toString();
        
        // Use CompletableFuture to run computations in parallel
        CompletableFuture<Double> monteCarloFuture = CompletableFuture.supplyAsync(
            () -> performMonteCarloSimulation(payload), threadPool);
        
        CompletableFuture<Double> matrixFuture = CompletableFuture.supplyAsync(
            () -> calculateMatrixDeterminant(payload), threadPool);
        
        CompletableFuture<Integer> primeFuture = CompletableFuture.supplyAsync(
            () -> countPrimesInRange(payload), threadPool);
        
        CompletableFuture<Long> fibonacciFuture = CompletableFuture.supplyAsync(
            () -> calculateFibonacciSum(payload), threadPool);
        
        CompletableFuture<Integer> parallelTasksFuture = CompletableFuture.supplyAsync(
            () -> performParallelTasks(payload), threadPool);

        // Wait for all computations to complete
        CompletableFuture<Void> allTasks = CompletableFuture.allOf(
            monteCarloFuture, matrixFuture, primeFuture, fibonacciFuture, parallelTasksFuture);
        
        // Wait with timeout
        allTasks.get(30, TimeUnit.SECONDS);

        return new CpuComputationResult(
            computationId,
            monteCarloFuture.get(),
            matrixFuture.get(),
            primeFuture.get(),
            fibonacciFuture.get(),
            parallelTasksFuture.get()
        );
    }

    /**
     * Monte Carlo simulation - CPU-intensive mathematical computation
     */
    private double performMonteCarloSimulation(Map<String, Object> payload) {
        int iterations = 100_000; // Significant computation load
        Random random = new Random(payload.hashCode()); // Deterministic seed
        
        return IntStream.range(0, iterations)
            .parallel() // Use parallel streams (Java advantage)
            .mapToDouble(i -> {
                double x = random.nextDouble();
                double y = random.nextDouble();
                
                // Complex calculation simulating IoT sensor data processing
                double temperature = 20 + (x * 40); // 20-60°C range
                double humidity = y * 100;          // 0-100% range
                double pressure = 1000 + (x * y * 100); // 1000-1100 hPa range
                
                // Environmental stress calculation
                double stress = Math.sin(temperature * Math.PI / 180) * 
                               Math.cos(humidity * Math.PI / 180) *
                               Math.log(pressure / 1000.0);
                
                return Math.exp(-stress * stress);
            })
            .average()
            .orElse(0.0);
    }

    /**
     * Matrix determinant calculation - memory and CPU intensive
     */
    private double calculateMatrixDeterminant(Map<String, Object> payload) {
        int size = 50; // 50x50 matrix for significant computation
        double[][] matrix = generateMatrix(size, payload.hashCode());
        return calculateDeterminant(matrix);
    }

    private double[][] generateMatrix(int size, int seed) {
        Random random = new Random(seed);
        double[][] matrix = new double[size][size];
        
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                matrix[i][j] = random.nextGaussian() * 10; // Gaussian distribution
            }
        }
        return matrix;
    }

    private double calculateDeterminant(double[][] matrix) {
        int n = matrix.length;
        
        // Create a copy to avoid modifying original
        double[][] copy = new double[n][n];
        for (int i = 0; i < n; i++) {
            System.arraycopy(matrix[i], 0, copy[i], 0, n);
        }
        
        // LU decomposition for determinant calculation
        double det = 1.0;
        for (int i = 0; i < n; i++) {
            // Find pivot
            int maxRow = i;
            for (int k = i + 1; k < n; k++) {
                if (Math.abs(copy[k][i]) > Math.abs(copy[maxRow][i])) {
                    maxRow = k;
                }
            }
            
            // Swap rows
            if (maxRow != i) {
                double[] temp = copy[i];
                copy[i] = copy[maxRow];
                copy[maxRow] = temp;
                det = -det;
            }
            
            det *= copy[i][i];
            
            // Make all rows below this one 0 in current column
            for (int k = i + 1; k < n; k++) {
                double factor = copy[k][i] / copy[i][i];
                for (int j = i; j < n; j++) {
                    copy[k][j] -= factor * copy[i][j];
                }
            }
        }
        
        return det;
    }

    /**
     * Prime counting - CPU-intensive number theory computation
     */
    private int countPrimesInRange(Map<String, Object> payload) {
        int start = Math.abs(payload.hashCode() % 10000) + 1000; // Start from 1000+
        int end = start + 10000; // Count primes in range of 10,000 numbers
        
        return (int) IntStream.rangeClosed(start, end)
            .parallel() // Parallel computation (Java advantage)
            .filter(this::isPrime)
            .count();
    }

    private boolean isPrime(int n) {
        if (n < 2) return false;
        if (n == 2) return true;
        if (n % 2 == 0) return false;
        
        int sqrt = (int) Math.sqrt(n);
        for (int i = 3; i <= sqrt; i += 2) {
            if (n % i == 0) return false;
        }
        return true;
    }

    /**
     * Fibonacci computation - recursive mathematical calculation
     */
    private long calculateFibonacciSum(Map<String, Object> payload) {
        int count = 35; // Fibonacci numbers to calculate
        
        return IntStream.rangeClosed(1, count)
            .parallel()
            .mapToLong(this::fibonacci)
            .sum();
    }

    private long fibonacci(int n) {
        if (n <= 1) return n;
        
        // Iterative approach for better performance
        long a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            long temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }

    /**
     * Parallel task execution - tests multi-threading capabilities
     */
    private int performParallelTasks(Map<String, Object> payload) {
        int taskCount = Runtime.getRuntime().availableProcessors() * 4;
        
        List<CompletableFuture<Integer>> tasks = new ArrayList<>();
        
        for (int i = 0; i < taskCount; i++) {
            final int taskId = i;
            CompletableFuture<Integer> task = CompletableFuture.supplyAsync(() -> {
                // Simulate CPU-intensive work
                double result = 0;
                for (int j = 0; j < 100_000; j++) {
                    result += Math.sin(j * taskId) * Math.cos(j * taskId);
                }
                return (int) (result % 1000);
            });
            tasks.add(task);
        }
        
        // Wait for all tasks and count completed ones
        int completed = 0;
        for (CompletableFuture<Integer> task : tasks) {
            try {
                task.get(5, TimeUnit.SECONDS);
                completed++;
            } catch (Exception e) {
                // Task failed or timed out
            }
        }
        
        return completed;
    }
}
