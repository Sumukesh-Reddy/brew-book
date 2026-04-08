package com.example.cafe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CafeApplication - Main Spring Boot Application Class
 * 
 * Annotations explained:
 * @SpringBootApplication - Convenience annotation that combines:
 *   - @Configuration: Marks class as Spring configuration class
 *   - @EnableAutoConfiguration: Enables Spring Boot's auto-configuration
 *   - @ComponentScan: Enables component scanning for Spring components
 * 
 * This is the entry point of our Spring Boot application
 * Spring Boot will automatically:
 * 1. Configure the application based on dependencies
 * 2. Scan for components in this package and sub-packages
 * 3. Set up embedded Tomcat server
 * 4. Configure database connections
 * 5. Set up security filters
 */
@SpringBootApplication
public class CafeApplication {

    /**
     * Main method - Entry point of the application
     * 
     * @param args - Command line arguments
     * 
     * What SpringApplication.run() does:
     * 1. Creates Spring application context
     * 2. Performs auto-configuration
     * 3. Starts embedded web server (Tomcat)
     * 4. Initializes all components
     * 5. Makes application ready to handle requests
     */
    public static void main(String[] args) {
        SpringApplication.run(CafeApplication.class, args);
    }
}