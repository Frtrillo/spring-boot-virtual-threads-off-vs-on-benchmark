package com.example.iotbench;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/enterprise")
public class EnterpriseController {

    private final EnterpriseService enterpriseService;

    public EnterpriseController(EnterpriseService enterpriseService) {
        this.enterpriseService = enterpriseService;
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String,Object>> processEnterprise(@RequestBody Map<String,Object> payload) {
        long start = System.nanoTime();
        
        try {
            EnterpriseProcessingResult result = enterpriseService.processEnterpriseWorkload(payload);
            long elapsedNanos = System.nanoTime() - start;
            double elapsedMs = elapsedNanos / 1_000_000.0;
            
            Map<String,Object> response = Map.of(
                "id", result.getEventId(),
                "status", "PROCESSED",
                "processed_records", result.getProcessedRecords(),
                "validation_score", result.getValidationResult(),
                "risk_assessment", result.getRiskScore(),
                "compliance_check", result.getComplianceStatus(),
                "processing_time_ms", Math.round(elapsedMs * 100.0) / 100.0,
                "thread_info", "Java " + System.getProperty("java.version") + " - " + 
                              (Thread.currentThread().isVirtual() ? "Virtual Thread" : "Platform Thread")
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            long elapsedNanos = System.nanoTime() - start;
            double elapsedMs = elapsedNanos / 1_000_000.0;
            
            Map<String,Object> errorResponse = Map.of(
                "error", "Enterprise processing failed",
                "message", e.getMessage(),
                "processing_time_ms", Math.round(elapsedMs * 100.0) / 100.0
            );
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String,Object>> health() {
        Runtime runtime = Runtime.getRuntime();
        
        Map<String,Object> health = Map.of(
            "status", "ok",
            "timestamp", new Date(),
            "runtime", "Spring Boot Enterprise",
            "virtual_threads", Thread.currentThread().isVirtual(),
            "active_threads", Thread.activeCount(),
            "memory_usage", Map.of(
                "total", runtime.totalMemory(),
                "free", runtime.freeMemory(),
                "max", runtime.maxMemory()
            )
        );
        
        return ResponseEntity.ok(health);
    }
}