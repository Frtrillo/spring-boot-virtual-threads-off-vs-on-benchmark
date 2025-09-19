package com.example.iotbench;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class IotBenchApplication {
    public static void main(String[] args) {
        SpringApplication.run(IotBenchApplication.class, args);
    }
}
