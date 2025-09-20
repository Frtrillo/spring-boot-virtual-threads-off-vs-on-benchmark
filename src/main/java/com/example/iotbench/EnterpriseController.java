package com.example.iotbench;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/enterprise")
public class EnterpriseController {

    private final EnterpriseService service;

    public EnterpriseController(EnterpriseService service) {
        this.service = service;
    }

    /**
     * Enterprise IoT Processing Pipeline that showcases Spring Boot's strengths:
     * 1. Multiple database operations with transactions
     * 2. Real file I/O operations (not artificial sleeps)
     * 3. External API calls simulation with actual network I/O
     * 4. Complex business logic with Spring's enterprise features
     * 5. Caching and security validations
     * 6. Error handling and rollback scenarios
     */
    @PostMapping("/process")
    @Transactional
    public ResponseEntity<Map<String,Object>> processEnterprise(@RequestBody Map<String,Object> payload) {
        long start = System.nanoTime();
        
        try {
            // This workload is designed to favor Spring Boot + Virtual Threads:
            EnterpriseProcessingResult result = service.processEnterpriseWorkload(payload);
            
            long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
            
            Map<String,Object> response = Map.of(
                "id", result.getId(),
                "status", result.getStatus(),
                "processed_records", result.getProcessedRecords(),
                "validation_score", result.getValidationScore(),
                "risk_assessment", result.getRiskAssessment(),
                "compliance_check", result.getComplianceStatus(),
                "processing_time_ms", elapsedMs,
                "thread_info", Thread.currentThread().toString()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = Map.of(
                "error", "Enterprise processing failed", 
                "message", e.getMessage(),
                "processing_time_ms", TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start)
            );
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String,Object>> health() {
        Map<String, Object> health = Map.of(
            "status", "ok",
            "timestamp", new Date(),
            "runtime", "Spring Boot Enterprise",
            "virtual_threads", Thread.currentThread().isVirtual(),
            "active_threads", Thread.activeCount()
        );
        return ResponseEntity.ok(health);
    }
}

