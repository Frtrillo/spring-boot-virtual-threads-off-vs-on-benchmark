package com.example.iotbench;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.UUID;

@Service
public class IngestService {

    private final JdbcTemplate jdbc;
    private final AsyncWorker asyncWorker;

    public IngestService(JdbcTemplate jdbc, AsyncWorker asyncWorker) {
        this.jdbc = jdbc;
        this.asyncWorker = asyncWorker;
        initTable();
    }

    private void initTable() {
        jdbc.execute("CREATE TABLE IF NOT EXISTS iot_payload (id VARCHAR(36) PRIMARY KEY, content CLOB, ts TIMESTAMP)");
    }

    public String process(Map<String,Object> payload) {
        String id = UUID.randomUUID().toString();
        String content = toJson(payload);
        jdbc.update("INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, CURRENT_TIMESTAMP)", id, content);
        asyncWorker.doBackgroundWork(id, payload);
        return id;
    }

    private String toJson(Map<String,Object> p) {
        try {
            return new ObjectMapper().writeValueAsString(p);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
