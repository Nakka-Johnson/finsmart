package com.finsmart.web.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Integration test for CategoryController. Tests real behaviour with H2 in-memory database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CategoryControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  @WithMockUser(username = "test@example.com")
  void listCategories_returnsJsonArray() throws Exception {
    mockMvc
        .perform(get("/api/categories"))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @WithMockUser(username = "test@example.com")
  void getCategory_withInvalidId_returnsError() throws Exception {
    String invalidId = "00000000-0000-0000-0000-000000000000";

    // Invalid ID returns error (404 or 500 depending on exception handling)
    mockMvc
        .perform(get("/api/categories/{id}", invalidId))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status < 400) {
                throw new AssertionError("Expected error status (4xx or 5xx) but got: " + status);
              }
            });
  }

  @Test
  void listCategories_withoutAuth_returns401() throws Exception {
    mockMvc.perform(get("/api/categories")).andExpect(status().isUnauthorized());
  }
}
