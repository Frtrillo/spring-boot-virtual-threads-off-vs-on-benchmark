package com.example.iotbench;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class AsyncWorker {

    @Async
    public CompletableFuture<Void> doBackgroundWork(String id, Map<String,Object> payload) {
        // Realistic IoT processing: data validation, enrichment, and calculations
        try {
            // 1. Data validation and enrichment
            validateAndEnrichPayload(payload);
            
            // 2. Calculate device metrics
            calculateDeviceMetrics(payload);
            
            // 3. Risk assessment computation
            double riskScore = calculateRiskScore(payload);
            
            // 4. Log processing result (simulates real logging/monitoring)
            logProcessingResult(id, riskScore);
            
        } catch (Exception e) {
            // Handle errors gracefully
            System.err.println("Error processing payload " + id + ": " + e.getMessage());
        }
        return CompletableFuture.completedFuture(null);
    }
    
    private void validateAndEnrichPayload(Map<String,Object> payload) {
        // Simulate realistic data validation and enrichment
        for (Map.Entry<String, Object> entry : payload.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            
            // Data type validation
            if (value instanceof String) {
                String strValue = (String) value;
                if (strValue.length() > 100) {
                    throw new IllegalArgumentException("Field " + key + " too long");
                }
            }
        }
        
        // Add enrichment fields
        payload.put("processed_at", System.currentTimeMillis());
        payload.put("processor_id", Thread.currentThread().getName());
    }
    
    private void calculateDeviceMetrics(Map<String,Object> payload) {
        // Simulate realistic metric calculations
        double sum = 0;
        int count = 0;
        
        for (Object value : payload.values()) {
            if (value instanceof String) {
                sum += value.toString().hashCode();
                count++;
            }
        }
        
        if (count > 0) {
            payload.put("avg_hash", sum / count);
            payload.put("field_count", count);
        }
    }
    
    private double calculateRiskScore(Map<String,Object> payload) {
        // Monte Carlo style risk calculation (CPU intensive like your benchmark)
        double risk = 0.0;
        int iterations = 1000; // Realistic computation load
        
        for (int i = 0; i < iterations; i++) {
            double x = Math.random();
            double y = Math.random();
            
            // Environmental stress calculation
            double temp = 20 + (x * 40); // 20-60°C range
            double humidity = y * 100;   // 0-100% range
            
            // Risk formula (similar to your benchmark)
            double stress = Math.sin(temp * Math.PI / 180) * Math.cos(humidity * Math.PI / 180);
            risk += Math.exp(-stress * stress);
        }
        
        return risk / iterations;
    }
    
    private void logProcessingResult(String id, double riskScore) {
        // Simulate realistic logging (minimal I/O)
        if (riskScore > 0.5) {
            System.out.println("HIGH RISK detected for device " + id + ": " + riskScore);
        }
    }
}
