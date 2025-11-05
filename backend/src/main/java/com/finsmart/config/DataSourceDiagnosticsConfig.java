package com.finsmart.config;

import java.sql.SQLException;
import javax.sql.DataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
@Configuration
public class DataSourceDiagnosticsConfig {

  @Bean
  public CommandLineRunner validateDatabaseConnection(DataSource dataSource) {
    return args -> {
      log.info("========================================");
      log.info("DATABASE CONNECTION VALIDATION");
      log.info("========================================");

      try {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        // Test basic connectivity
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);

        if (result != null && result == 1) {
          log.info("✅ SUCCESS: Database connection validated");

          // Get database metadata
          String version = jdbcTemplate.queryForObject("SELECT version()", String.class);
          String database = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
          String user = jdbcTemplate.queryForObject("SELECT current_user", String.class);

          log.info("✅ Database: {}", database);
          log.info("✅ User: {}", user);
          log.info(
              "✅ Version: {}",
              version != null ? version.substring(0, Math.min(80, version.length())) : "Unknown");
        } else {
          log.error("❌ FAILED: SELECT 1 returned unexpected value: {}", result);
        }

      } catch (Exception e) {
        log.error("========================================");
        log.error("❌ DATABASE CONNECTION FAILED");
        log.error("========================================");
        log.error("Error Type: {}", e.getClass().getSimpleName());
        log.error("Error Message: {}", e.getMessage());

        // Get datasource info safely
        try {
          String url = dataSource.getConnection().getMetaData().getURL();
          String username = dataSource.getConnection().getMetaData().getUserName();
          log.error("JDBC URL: {}", url);
          log.error("Username: {}", username);
        } catch (SQLException se) {
          log.error("Could not retrieve datasource metadata");
        }

        // Provide helpful diagnostics
        String errorMsg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";

        if (errorMsg.contains("password authentication failed") || errorMsg.contains("28p01")) {
          log.error("");
          log.error("💡 DIAGNOSIS: Password authentication failed (SQLSTATE 28P01)");
          log.error(
              "   → Check that POSTGRES_PASSWORD in docker-compose.yml matches spring.datasource.password");
          log.error("   → Verify pg_hba.conf authentication method (trust/md5/scram-sha-256)");
          log.error(
              "   → Ensure password was set correctly: docker exec <container> psql -U finsmart -c \"ALTER USER finsmart PASSWORD 'finsmartpwd';\"");
        } else if (errorMsg.contains("connection refused") || errorMsg.contains("connect")) {
          log.error("");
          log.error("💡 DIAGNOSIS: Cannot reach localhost:5432");
          log.error("   → Check if PostgreSQL Docker container is running: docker ps");
          log.error(
              "   → Verify port is published: docker-compose.yml should have 'ports: - 5432:5432'");
          log.error(
              "   → Test connectivity: Test-NetConnection -ComputerName localhost -Port 5432");
        } else if (errorMsg.contains("ssl") || errorMsg.contains("encryption")) {
          log.error("");
          log.error("💡 DIAGNOSIS: SSL negotiation error");
          log.error("   → Try adding '?sslmode=disable' to JDBC URL in application.yml");
          log.error("   → Example: jdbc:postgresql://localhost:5432/finsmartdb?sslmode=disable");
        } else if (errorMsg.contains("database") && errorMsg.contains("does not exist")) {
          log.error("");
          log.error("💡 DIAGNOSIS: Database does not exist");
          log.error("   → Check POSTGRES_DB in docker-compose.yml");
          log.error(
              "   → Verify database was created: docker exec <container> psql -U postgres -c '\\l'");
        }

        log.error("========================================");

        // Log root cause if available
        Throwable cause = e.getCause();
        if (cause != null) {
          log.error("Root Cause: {} - {}", cause.getClass().getSimpleName(), cause.getMessage());
        }
      }

      log.info("========================================");
    };
  }
}
