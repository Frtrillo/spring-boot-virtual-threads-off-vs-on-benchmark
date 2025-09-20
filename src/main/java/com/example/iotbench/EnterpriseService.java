package com.example.iotbench;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class EnterpriseService {

    private final JdbcTemplate jdbc;
    private final HttpClient httpClient;
    private final Path tempDir;
    private final Random random = new Random();

    public EnterpriseService(JdbcTemplate jdbc) throws IOException {
        this.jdbc = jdbc;
        // HTTP client for real network I/O (where Virtual Threads excel)
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        
        // Create temp directory for file I/O operations
        this.tempDir = Files.createTempDirectory("iot-enterprise-");
        initTables();
    }

    private void initTables() {
        // Multiple related tables for complex enterprise operations
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS enterprise_devices (
                id VARCHAR(36) PRIMARY KEY, 
                device_type VARCHAR(50), 
                location VARCHAR(100),
                last_seen TIMESTAMP,
                status VARCHAR(20)
            )
        """);
        
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS enterprise_events (
                id VARCHAR(36) PRIMARY KEY,
                device_id VARCHAR(36),
                event_type VARCHAR(50),
                payload CLOB,
                processed_at TIMESTAMP,
                risk_score DOUBLE,
                FOREIGN KEY (device_id) REFERENCES enterprise_devices(id)
            )
        """);
        
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS enterprise_audit (
                id VARCHAR(36) PRIMARY KEY,
                event_id VARCHAR(36),
                validation_result VARCHAR(20),
                compliance_status VARCHAR(20),
                audit_timestamp TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES enterprise_events(id)
            )
        """);
    }

    /**
     * Enterprise workload designed to showcase Spring Boot's strengths:
     * - Multiple database operations with real transactions
     * - Actual file I/O (not artificial sleeps)
     * - Network I/O simulation
     * - Complex business logic with Spring features
     */
    @Transactional
    public EnterpriseProcessingResult processEnterpriseWorkload(Map<String, Object> payload) {
        String eventId = UUID.randomUUID().toString();
        String deviceId = extractOrGenerateDeviceId(payload);
        
        // Step 1: Device registration/update (Database I/O with transaction)
        upsertDevice(deviceId, payload);
        
        // Step 2: Event storage (Database I/O)
        double riskScore = storeEvent(eventId, deviceId, payload);
        
        // Step 3: File I/O operations (Real I/O that benefits from Virtual Threads)
        String fileReport = generateFileReport(eventId, payload);
        
        // Step 4: External API validation (Network I/O - Virtual Threads shine here)
        String validationResult = performExternalValidation(payload);
        
        // Step 5: Compliance check (Database I/O with complex queries)
        String complianceStatus = performComplianceCheck(deviceId, riskScore);
        
        // Step 6: Audit logging (Database I/O)
        auditTransaction(eventId, validationResult, complianceStatus);
        
        // Step 7: Cache warming (Spring Cache with I/O)
        warmupDeviceCache(deviceId);
        
        return new EnterpriseProcessingResult(
            eventId,
            "PROCESSED",
            7, // processed_records
            validationResult,
            riskScore,
            complianceStatus
        );
    }

    private String extractOrGenerateDeviceId(Map<String, Object> payload) {
        Object deviceId = payload.get("device_id");
        if (deviceId != null) {
            return deviceId.toString();
        }
        return "device_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private void upsertDevice(String deviceId, Map<String, Object> payload) {
        // Check if device exists
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM enterprise_devices WHERE id = ?", 
            Integer.class, deviceId
        );
        
        if (count == 0) {
            // Insert new device
            jdbc.update("""
                INSERT INTO enterprise_devices (id, device_type, location, last_seen, status) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE')
                """, 
                deviceId,
                payload.getOrDefault("type", "SENSOR").toString(),
                payload.getOrDefault("location", "UNKNOWN").toString()
            );
        } else {
            // Update existing device
            jdbc.update("""
                UPDATE enterprise_devices 
                SET last_seen = CURRENT_TIMESTAMP, status = 'ACTIVE' 
                WHERE id = ?
                """, deviceId);
        }
    }

    private double storeEvent(String eventId, String deviceId, Map<String, Object> payload) {
        // Calculate risk score with some CPU work (but not the main bottleneck)
        double riskScore = calculateRiskScore(payload);
        
        // Store event
        jdbc.update("""
            INSERT INTO enterprise_events (id, device_id, event_type, payload, processed_at, risk_score)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
            """,
            eventId, deviceId, "IOT_DATA", payload.toString(), riskScore
        );
        
        return riskScore;
    }

    private double calculateRiskScore(Map<String, Object> payload) {
        // Moderate CPU work, not the main focus
        double score = 0.0;
        for (Object value : payload.values()) {
            if (value instanceof String) {
                score += value.toString().hashCode() % 100;
            }
        }
        return (score % 1000) / 10.0; // 0-100 range
    }

    /**
     * Real file I/O operations where Virtual Threads excel
     * (Unlike artificial Thread.sleep, this is actual blocking I/O)
     */
    private String generateFileReport(String eventId, Map<String, Object> payload) {
        try {
            Path reportFile = tempDir.resolve("report_" + eventId + ".txt");
            
            // Generate report content
            StringBuilder report = new StringBuilder();
            report.append("=== Enterprise IoT Event Report ===\n");
            report.append("Event ID: ").append(eventId).append("\n");
            report.append("Timestamp: ").append(new Date()).append("\n");
            report.append("Thread: ").append(Thread.currentThread().getName()).append("\n");
            report.append("Payload Fields: ").append(payload.size()).append("\n");
            
            // Add some processing details
            for (Map.Entry<String, Object> entry : payload.entrySet()) {
                report.append("- ").append(entry.getKey()).append(": ")
                      .append(entry.getValue().toString().substring(0, 
                          Math.min(50, entry.getValue().toString().length())))
                      .append("\n");
            }
            
            // Write to file (REAL I/O blocking operation)
            Files.write(reportFile, report.toString().getBytes(), 
                       StandardOpenOption.CREATE, StandardOpenOption.WRITE);
            
            // Read back for validation (more I/O)
            String content = Files.readString(reportFile);
            
            // Cleanup
            Files.deleteIfExists(reportFile);
            
            return "REPORT_GENERATED";
            
        } catch (IOException e) {
            return "REPORT_FAILED";
        }
    }

    /**
     * Simulate external API calls (Real network I/O where Virtual Threads shine)
     * Uses httpbin.org for real HTTP requests
     */
    private String performExternalValidation(Map<String, Object> payload) {
        try {
            // Simulate calling an external validation service
            // Using httpbin.org/delay/1 for real network I/O with 1 second delay
            String jsonPayload = "{\"validation_request\":\"" + payload.size() + "_fields\"}";
            
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://httpbin.org/delay/1"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(3))
                .build();
            
            HttpResponse<String> response = httpClient.send(request, 
                HttpResponse.BodyHandlers.ofString());
            
            return response.statusCode() == 200 ? "VALIDATED" : "VALIDATION_FAILED";
            
        } catch (Exception e) {
            // Fallback to simulate network delay without external dependency
            try {
                Thread.sleep(100); // Minimal delay to simulate network
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
            return "VALIDATION_TIMEOUT";
        }
    }

    private String performComplianceCheck(String deviceId, double riskScore) {
        // Complex database query (multiple joins)
        List<Map<String, Object>> recentEvents = jdbc.queryForList("""
            SELECT e.risk_score, e.processed_at, d.device_type 
            FROM enterprise_events e 
            JOIN enterprise_devices d ON e.device_id = d.id 
            WHERE e.device_id = ? 
            ORDER BY e.processed_at DESC 
            LIMIT 10
            """, deviceId);
        
        // Business logic for compliance
        if (recentEvents.size() > 5 && riskScore > 50.0) {
            return "NON_COMPLIANT";
        } else if (riskScore > 80.0) {
            return "HIGH_RISK";
        } else {
            return "COMPLIANT";
        }
    }

    private void auditTransaction(String eventId, String validationResult, String complianceStatus) {
        jdbc.update("""
            INSERT INTO enterprise_audit (id, event_id, validation_result, compliance_status, audit_timestamp)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            UUID.randomUUID().toString(), eventId, validationResult, complianceStatus
        );
    }

    @Cacheable("deviceCache")
    private void warmupDeviceCache(String deviceId) {
        // Cache warming with database query
        jdbc.queryForList("""
            SELECT * FROM enterprise_devices d 
            LEFT JOIN enterprise_events e ON d.id = e.device_id 
            WHERE d.id = ? 
            ORDER BY e.processed_at DESC 
            LIMIT 5
            """, deviceId);
    }
}

