package com.example.iotbench;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/pi")
public class PiController {

    @PostMapping("/calculate")
    public ResponseEntity<Map<String,Object>> calculatePi(@RequestBody Map<String,Object> request) {
        long startTime = System.nanoTime();
        
        try {
            // Extract iterations from request
            Integer iterations = (Integer) request.get("iterations");
            if (iterations == null || iterations <= 0) {
                iterations = 1_000_000; // Default
            }
            
            // Warm up JIT if this is a large calculation
            if (iterations > 10_000_000) {
                warmupJIT();
            }
            
            // Calculate π using Leibniz formula
            double pi = calculatePiLeibniz(iterations);
            
            long endTime = System.nanoTime();
            double elapsedMs = (endTime - startTime) / 1_000_000.0;
            double accuracy = Math.abs(Math.PI - pi);
            
            Map<String,Object> response = new HashMap<>();
            response.put("result", pi);
            response.put("actualPi", Math.PI);
            response.put("error", accuracy);
            response.put("iterations", iterations);
            response.put("timeMs", Math.round(elapsedMs * 100.0) / 100.0);
            response.put("iterationsPerSecond", Math.round(iterations / elapsedMs * 1000.0));
            response.put("runtime", "Spring Boot + Java " + System.getProperty("java.version"));
            response.put("threadType", Thread.currentThread().isVirtual() ? "Virtual Thread" : "Platform Thread");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            long endTime = System.nanoTime();
            double elapsedMs = (endTime - startTime) / 1_000_000.0;
            
            Map<String,Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "π calculation failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timeMs", Math.round(elapsedMs * 100.0) / 100.0);
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String,Object>> health() {
        Runtime runtime = Runtime.getRuntime();
        
        Map<String,Object> health = new HashMap<>();
        health.put("status", "ok");
        health.put("timestamp", new Date());
        health.put("runtime", "Spring Boot π Calculator");
        health.put("javaVersion", System.getProperty("java.version"));
        health.put("virtualThreads", Thread.currentThread().isVirtual());
        health.put("availableProcessors", runtime.availableProcessors());
        health.put("totalMemory", runtime.totalMemory());
        health.put("freeMemory", runtime.freeMemory());
        
        return ResponseEntity.ok(health);
    }

    /**
     * Warm up the JIT compiler for large calculations
     */
    private void warmupJIT() {
        for (int i = 0; i < 5; i++) {
            calculatePiLeibniz(100_000);
        }
    }

    /**
     * Calculate π using Leibniz formula: π/4 = 1 - 1/3 + 1/5 - 1/7 + 1/9 - ...
     */
    private double calculatePiLeibniz(int iterations) {
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
}
