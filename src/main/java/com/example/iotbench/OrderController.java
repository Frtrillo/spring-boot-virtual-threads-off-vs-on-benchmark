package com.example.iotbench;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/process-order")
    public ResponseEntity<Map<String,Object>> processOrder(@RequestBody Map<String,Object> orderRequest) {
        long start = System.nanoTime();
        
        try {
            // Realistic enterprise order processing
            OrderResult result = orderService.processOrder(orderRequest);
            
            long elapsedNanos = System.nanoTime() - start;
            double elapsedMs = elapsedNanos / 1_000_000.0;
            
            Map<String,Object> response = new HashMap<>();
            response.put("orderId", result.getOrderId());
            response.put("customerId", result.getCustomerId());
            response.put("totalAmount", result.getTotalAmount());
            response.put("discountApplied", result.getDiscountApplied());
            response.put("taxAmount", result.getTaxAmount());
            response.put("finalAmount", result.getFinalAmount());
            response.put("processingTimeMs", Math.round(elapsedMs * 100.0) / 100.0);
            response.put("status", "SUCCESS");
            response.put("thread", Thread.currentThread().isVirtual() ? "Virtual" : "Platform");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            long elapsedNanos = System.nanoTime() - start;
            double elapsedMs = elapsedNanos / 1_000_000.0;
            
            Map<String,Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Order processing failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("processingTimeMs", Math.round(elapsedMs * 100.0) / 100.0);
            errorResponse.put("status", "ERROR");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String,Object>> health() {
        Runtime runtime = Runtime.getRuntime();
        
        Map<String,Object> health = new HashMap<>();
        health.put("status", "ok");
        health.put("timestamp", new Date());
        health.put("runtime", "Java Realistic Enterprise");
        health.put("virtualThreads", Thread.currentThread().isVirtual());
        health.put("availableProcessors", runtime.availableProcessors());
        health.put("totalMemory", runtime.totalMemory());
        health.put("freeMemory", runtime.freeMemory());
        
        return ResponseEntity.ok(health);
    }
}
