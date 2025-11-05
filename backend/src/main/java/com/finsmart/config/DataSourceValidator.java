package com.finsmart.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DataSourceValidator {

  private final JdbcTemplate jdbcTemplate;

  public DataSourceValidator(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void validateDatabaseConnection() {
    try {
      Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
      if (result != null && result == 1) {
        System.out.println("✓ DB OK: basic SELECT 1 succeeded");
      }
    } catch (Exception e) {
      System.err.println("✗ DB VALIDATION FAILED: " + e.getMessage());
      throw new IllegalStateException("Database connection validation failed", e);
    }
  }
}
