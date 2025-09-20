package com.example.iotbench;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EnterpriseService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, List<Map<String, Object>>> deviceCache = new ConcurrentHashMap<>();
    private final Path tempDir;

    public EnterpriseService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "temp-enterprise");
        initializeTables();
        createTempDirectory();
    }

    private void initializeTables() {
        // Create enterprise tables (equivalent to Node.js/Bun versions)
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS enterprise_devices (
                id VARCHAR(255) PRIMARY KEY,
                device_type VARCHAR(100),
                location VARCHAR(100),
                last_seen TIMESTAMP,
                status VARCHAR(50)
            )
        """);

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS enterprise_events (
                id VARCHAR(255) PRIMARY KEY,
                device_id VARCHAR(255),
                event_type VARCHAR(100),
                payload CLOB,
                processed_at TIMESTAMP,
                risk_score DOUBLE,
                FOREIGN KEY (device_id) REFERENCES enterprise_devices(id)
            )
        """);

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS enterprise_audit (
                id VARCHAR(255) PRIMARY KEY,
                event_id VARCHAR(255),
                validation_result VARCHAR(100),
                compliance_status VARCHAR(100),
                audit_timestamp TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES enterprise_events(id)
            )
        """);
    }

    private void createTempDirectory() {
        try {
            Files.createDirectories(tempDir);
        } catch (IOException e) {
            System.err.println("Failed to create temp directory: " + e.getMessage());
        }
    }

    /**
     * Enterprise processing workload - equivalent to Node.js/Bun versions
     * This workload is designed to showcase Java + Virtual Threads strengths:
     * 1. Multiple sequential database operations (where Virtual Threads excel)
     * 2. File I/O operations (blocking I/O that Virtual Threads handle well)
     * 3. Network I/O operations (handled well by all async runtimes)
     * 4. Complex business logic (where JVM optimizations shine)
     */
    public EnterpriseProcessingResult processEnterpriseWorkload(Map<String, Object> payload) throws Exception {
        String eventId = UUID.randomUUID().toString();
        String deviceId = extractOrGenerateDeviceId(payload);

        // Step 1: Device registration/update (Database I/O)
        upsertDevice(deviceId, payload);

        // Step 2: Event storage (Database I/O)
        double riskScore = storeEvent(eventId, deviceId, payload);

        // Step 3: File I/O operations (Blocking I/O - Virtual Threads excel here)
        String fileReport = generateFileReport(eventId, payload);

        // Step 4: External API validation (Network I/O - all async runtimes handle well)
        String validationResult = performExternalValidation(payload);

        // Step 5: Compliance check (Database I/O with complex queries)
        String complianceStatus = performComplianceCheck(deviceId, riskScore);

        // Step 6: Audit logging (Database I/O)
        auditTransaction(eventId, validationResult, complianceStatus);

        // Step 7: Cache warming (Database + memory operations)
        warmupDeviceCache(deviceId);

        return new EnterpriseProcessingResult(eventId, 7, validationResult, riskScore, complianceStatus);
    }

    private String extractOrGenerateDeviceId(Map<String, Object> payload) {
        Object deviceId = payload.get("device_id");
        return deviceId != null ? deviceId.toString() : "device_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private void upsertDevice(String deviceId, Map<String, Object> payload) {
        // Check if device exists
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM enterprise_devices WHERE id = ?", 
            Integer.class, 
            deviceId
        );

        if (count == 0) {
            // Insert new device
            jdbc.update("""
                INSERT INTO enterprise_devices (id, device_type, location, last_seen, status)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE')
            """, 
            deviceId,
            payload.getOrDefault("type", "SENSOR"),
            payload.getOrDefault("location", "UNKNOWN")
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

    private double storeEvent(String eventId, String deviceId, Map<String, Object> payload) throws Exception {
        double riskScore = calculateRiskScore(payload);

        jdbc.update("""
            INSERT INTO enterprise_events (id, device_id, event_type, payload, processed_at, risk_score)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        """, eventId, deviceId, "IOT_DATA", objectMapper.writeValueAsString(payload), riskScore);

        return riskScore;
    }

    private double calculateRiskScore(Map<String, Object> payload) {
        double score = 0;
        for (Object value : payload.values()) {
            if (value instanceof String) {
                String str = (String) value;
                score += str.chars().sum() % 100;
            }
        }
        return (score % 1000) / 10.0; // 0-100 range
    }

    /**
     * File I/O operations - this is where Virtual Threads should excel
     * Multiple blocking file operations that Virtual Threads can handle concurrently
     */
    private String generateFileReport(String eventId, Map<String, Object> payload) {
        try {
            Path reportFile = tempDir.resolve("report_" + eventId + ".txt");

            StringBuilder report = new StringBuilder();
            report.append("=== Enterprise IoT Event Report ===\n");
            report.append("Event ID: ").append(eventId).append("\n");
            report.append("Timestamp: ").append(new Date()).append("\n");
            report.append("Thread: ").append(Thread.currentThread().isVirtual() ? "Virtual Thread" : "Platform Thread").append("\n");
            report.append("Payload Fields: ").append(payload.size()).append("\n");

            // Add processing details
            for (Map.Entry<String, Object> entry : payload.entrySet()) {
                String valueStr = entry.getValue().toString();
                if (valueStr.length() > 50) {
                    valueStr = valueStr.substring(0, 50);
                }
                report.append("- ").append(entry.getKey()).append(": ").append(valueStr).append("\n");
            }

            // Write to file (blocking I/O operation)
            Files.write(reportFile, report.toString().getBytes());

            // Read back for validation (more I/O)
            String content = Files.readString(reportFile);

            // Cleanup
            try {
                Files.delete(reportFile);
            } catch (IOException e) {
                // Ignore cleanup errors
            }

            return "REPORT_GENERATED";

        } catch (Exception e) {
            return "REPORT_FAILED";
        }
    }

    /**
     * External API validation - all async runtimes handle network I/O well
     */
    private String performExternalValidation(Map<String, Object> payload) {
        try {
            Map<String, String> validationRequest = Map.of(
                "validation_request", payload.size() + "_fields"
            );

            // Try real HTTP request with timeout
            restTemplate.getForObject(
                "https://httpbin.org/delay/1", 
                String.class
            );

            return "VALIDATED";

        } catch (Exception e) {
            // Fallback simulation
            try {
                Thread.sleep(100); // Minimal delay to simulate network
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
            return "VALIDATION_TIMEOUT";
        }
    }

    private String performComplianceCheck(String deviceId, double riskScore) {
        // Complex database query with joins (like Node.js/Bun versions)
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.risk_score, e.processed_at, d.device_type 
            FROM enterprise_events e 
            JOIN enterprise_devices d ON e.device_id = d.id 
            WHERE e.device_id = ? 
            ORDER BY e.processed_at DESC 
            LIMIT 10
        """, deviceId);

        // Business logic for compliance
        if (rows.size() > 5 && riskScore > 50.0) {
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
        """, UUID.randomUUID().toString(), eventId, validationResult, complianceStatus);
    }

    private void warmupDeviceCache(String deviceId) {
        if (deviceCache.containsKey(deviceId)) {
            return;
        }

        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT * FROM enterprise_devices d 
            LEFT JOIN enterprise_events e ON d.id = e.device_id 
            WHERE d.id = ? 
            ORDER BY e.processed_at DESC 
            LIMIT 5
        """, deviceId);

        deviceCache.put(deviceId, rows);
    }
}