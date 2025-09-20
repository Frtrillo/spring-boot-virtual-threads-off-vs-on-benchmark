package com.example.iotbench;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/cpu")
public class CpuIntensiveController {

    private final CpuIntensiveService cpuService;
    private final ForkJoinPool customThreadPool;

    public CpuIntensiveController(CpuIntensiveService cpuService) {
        this.cpuService = cpuService;
        // Create a custom thread pool to maximize CPU utilization
        this.customThreadPool = new ForkJoinPool(Runtime.getRuntime().availableProcessors() * 2);
    }

    @PostMapping("/compute")
    public ResponseEntity<Map<String,Object>> computeIntensive(@RequestBody Map<String,Object> payload) {
        long start = System.nanoTime();
        
        try {
            // CPU-intensive computation that leverages Java's strengths
            CpuComputationResult result = cpuService.performCpuIntensiveComputation(payload, customThreadPool);
            
            long elapsedNanos = System.nanoTime() - start;
            double elapsedMs = elapsedNanos / 1_000_000.0;
            
            Map<String,Object> response = new HashMap<>();
            response.put("computation_id", result.getComputationId());
            response.put("status", "COMPUTED");
            response.put("monte_carlo_result", result.getMonteCarloResult());
            response.put("matrix_determinant", result.getMatrixDeterminant());
            response.put("prime_count", result.getPrimeCount());
            response.put("fibonacci_sum", result.getFibonacciSum());
            response.put("parallel_tasks_completed", result.getParallelTasksCompleted());
            response.put("processing_time_ms", Math.round(elapsedMs * 100.0) / 100.0);
            response.put("thread_info", "Java " + System.getProperty("java.version") + " - " + 
                        (Thread.currentThread().isVirtual() ? "Virtual Thread" : "Platform Thread"));
            response.put("cpu_cores_used", Runtime.getRuntime().availableProcessors());
            response.put("jvm_optimization", "JIT Compiled");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            long elapsedNanos = System.nanoTime() - start;
            double elapsedMs = elapsedNanos / 1_000_000.0;
            
            Map<String,Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "CPU computation failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("processing_time_ms", Math.round(elapsedMs * 100.0) / 100.0);
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String,Object>> health() {
        Runtime runtime = Runtime.getRuntime();
        
        Map<String,Object> memoryInfo = new HashMap<>();
        memoryInfo.put("total", runtime.totalMemory());
        memoryInfo.put("free", runtime.freeMemory());
        memoryInfo.put("max", runtime.maxMemory());
        memoryInfo.put("used", runtime.totalMemory() - runtime.freeMemory());
        
        Map<String,Object> health = new HashMap<>();
        health.put("status", "ok");
        health.put("timestamp", new Date());
        health.put("runtime", "Spring Boot CPU-Intensive");
        health.put("virtual_threads", Thread.currentThread().isVirtual());
        health.put("active_threads", Thread.activeCount());
        health.put("available_processors", runtime.availableProcessors());
        health.put("memory_usage", memoryInfo);
        health.put("gc_info", "G1 Garbage Collector");
        health.put("jit_status", "HotSpot JIT Enabled");
        
        return ResponseEntity.ok(health);
    }
}
