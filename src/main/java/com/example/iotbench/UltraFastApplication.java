package com.example.iotbench;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackageClasses = {UltraFastController.class})
public class UltraFastApplication {
    public static void main(String[] args) {
        // Disable banner and reduce startup overhead
        SpringApplication app = new SpringApplication(UltraFastApplication.class);
        app.setBannerMode(org.springframework.boot.Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
