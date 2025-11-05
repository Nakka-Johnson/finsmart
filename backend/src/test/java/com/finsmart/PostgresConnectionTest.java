package com.finsmart;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class PostgresConnectionTest {
  public static void main(String[] args) {
    String[] urls = {
      "jdbc:postgresql://127.0.0.1:5433/finsmartdb",
      "jdbc:postgresql://localhost:5433/finsmartdb",
      "jdbc:postgresql://host.docker.internal:5433/finsmartdb"
    };

    for (String url : urls) {
      System.out.println("\n========================================");
      System.out.println("Testing: " + url);
      System.out.println("========================================");

      try (Connection conn = DriverManager.getConnection(url, "finsmart", "finsmartpwd")) {

        System.out.println("✅ CONNECTION SUCCESSFUL!");
        System.out.println("   Connected to: " + conn.getMetaData().getURL());
        System.out.println("   User: " + conn.getMetaData().getUserName());
        System.out.println("   Database: " + conn.getCatalog());

        try (Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT 1")) {
          if (rs.next()) {
            System.out.println("   Query result: " + rs.getInt(1));
          }
        }

        // If we got here, connection works!
        break;

      } catch (Exception e) {
        System.out.println("❌ CONNECTION FAILED");
        System.out.println("   Error: " + e.getClass().getSimpleName());
        System.out.println("   Message: " + e.getMessage());
        if (e.getCause() != null) {
          System.out.println("   Cause: " + e.getCause().getMessage());
        }
      }
    }
  }
}
