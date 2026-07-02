package com.dealerpro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class DealerProApplication {
    public static void main(String[] args) {
        SpringApplication.run(DealerProApplication.class, args);
    }
}
