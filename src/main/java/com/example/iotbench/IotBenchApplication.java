package com.example.iotbench;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableAsync
@ComponentScan(basePackageClasses = {IotBenchApplication.class, UltraFastController.class})
public class IotBenchApplication {
    public static void main(String[] args) {
        SpringApplication.run(IotBenchApplication.class, args);
    }
}
