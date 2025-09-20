package com.example.iotbench;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableAsync
@EnableCaching
@EnableTransactionManagement
public class EnterpriseApplication {
    public static void main(String[] args) {
        // Enable Virtual Threads for I/O intensive operations
        System.setProperty("spring.threads.virtual.enabled", "true");
        SpringApplication.run(EnterpriseApplication.class, args);
    }
}

