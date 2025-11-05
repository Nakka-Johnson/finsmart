package com.finsmart.controller;

import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugDbController {

  private final JdbcTemplate jdbcTemplate;
  private final DataSource dataSource;

  @GetMapping("/db-ping")
  public ResponseEntity<Map<String, Object>> dbPing() {
    Map<String, Object> response = new HashMap<>();

    try {
      log.info("DB ping request received, executing SELECT 1...");
      Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);

      if (result != null && result == 1) {
        log.info("✅ DB ping successful");
        response.put("ok", true);

        return ResponseEntity.ok(response);
      } else {
        log.error("❌ DB ping failed: unexpected result {}", result);
        response.put("ok", false);
        response.put("error", "Unexpected result: " + result);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
      }
    } catch (Exception e) {
      log.error("❌ DB ping failed with exception", e);
      response.put("ok", false);
      response.put("error", e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
  }

  @GetMapping("/db-info")
  public ResponseEntity<Map<String, Object>> dbInfo() {
    Map<String, Object> response = new HashMap<>();

    try {
      log.info("DB info request received");

      // Get safe subset of DataSource info (no passwords)
      String jdbcUrl = dataSource.getConnection().getMetaData().getURL();
      String user = dataSource.getConnection().getMetaData().getUserName();
      String driverClass = dataSource.getConnection().getMetaData().getDriverName();

      response.put("jdbcUrl", jdbcUrl);
      response.put("user", user);
      response.put("driverClass", driverClass);

      log.info("✅ DB info retrieved successfully");
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("❌ DB info failed with exception", e);
      response.put("error", e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
  }
}
