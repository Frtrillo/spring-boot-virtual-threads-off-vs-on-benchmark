package com.example.iotbench;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/ingest")
public class IngestController {

    private final IngestService service;

    public IngestController(IngestService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Map<String,Object>> ingest(@RequestBody Map<String,Object> payload) {
        long start = System.nanoTime();
        String id = service.process(payload);
        long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        Map<String,Object> resp = Map.of("id", id, "t_ms", elapsedMs);
        return ResponseEntity.ok(resp);
    }
}
