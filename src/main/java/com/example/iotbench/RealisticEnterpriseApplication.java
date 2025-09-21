package com.example.iotbench;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackageClasses = {RealisticEnterpriseApplication.class})
public class RealisticEnterpriseApplication {
    public static void main(String[] args) {
        SpringApplication.run(RealisticEnterpriseApplication.class, args);
    }
}
