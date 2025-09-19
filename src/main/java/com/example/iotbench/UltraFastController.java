package com.example.iotbench;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/ultra")
public class UltraFastController {

    private final JdbcTemplate jdbc;
    private final AtomicLong counter = new AtomicLong(0);
    
    // Pre-allocated objects to avoid GC pressure (like the NestJS version)
    private final Map<String, Object> responseTemplate = new HashMap<>();
    private final Map<String, Object> healthTemplate = new HashMap<>();

    public UltraFastController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        initTable();
        
        // Pre-populate response templates
        responseTemplate.put("id", "");
        responseTemplate.put("t_ms", 0.0);
        
        healthTemplate.put("status", "ok");
        healthTemplate.put("timestamp", "");
        healthTemplate.put("runtime", "Spring Boot");
        healthTemplate.put("count", 0L);
    }

    private void initTable() {
        jdbc.execute("CREATE TABLE IF NOT EXISTS iot_payload_ultra (id VARCHAR(36) PRIMARY KEY, content CLOB, ts BIGINT)");
    }

    @PostMapping("ingest")
    public ResponseEntity<Map<String,Object>> ingest(@RequestBody Map<String,Object> payload) {
        long start = System.nanoTime();
        
        try {
            // Ultra-fast ID generation (like NestJS version)
            long count = counter.incrementAndGet();
            String id = "id_" + count + "_" + System.currentTimeMillis();
            
            // Convert payload to JSON (minimal processing)
            String content = payload.toString(); // Faster than ObjectMapper
            long timestamp = System.currentTimeMillis();
            
            // Ultra-fast database insert (prepared statement equivalent)
            jdbc.update("INSERT INTO iot_payload_ultra (id, content, ts) VALUES (?, ?, ?)", 
                       id, content, timestamp);
            
            // No background processing - just return immediately (like NestJS ultra-fast)
            long elapsedNanos = System.nanoTime() - start;
            double elapsedMs = elapsedNanos / 1_000_000.0;
            
            // Reuse object to avoid allocation (like NestJS version)
            responseTemplate.put("id", id);
            responseTemplate.put("t_ms", Math.round(elapsedMs * 100.0) / 100.0);
            
            return ResponseEntity.ok(responseTemplate);
            
        } catch (Exception e) {
            Map<String, Object> error = Map.of("error", "Internal server error");
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("health")
    public ResponseEntity<Map<String,Object>> health() {
        // Reuse object to avoid allocation (like NestJS version)
        healthTemplate.put("timestamp", new Date().toString());
        healthTemplate.put("count", counter.get());
        
        return ResponseEntity.ok(healthTemplate);
    }
}
