package com.finsmart.controller;

import com.finsmart.domain.repo.AccountRepository;
import com.finsmart.domain.repo.CategoryRepository;
import com.finsmart.domain.repo.TransactionRepository;
import com.finsmart.domain.repo.UserRepository;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@Profile("local")
public class DebugSeedSanityController {

  private final UserRepository userRepository;
  private final CategoryRepository categoryRepository;
  private final AccountRepository accountRepository;
  private final TransactionRepository transactionRepository;

  @GetMapping("/seed-sanity")
  public ResponseEntity<Map<String, Object>> seedSanity() {
    log.info("Seed sanity check requested");

    Map<String, Object> counts = new HashMap<>();

    try {
      long userCount = userRepository.count();
      long categoryCount = categoryRepository.count();
      long accountCount = accountRepository.count();
      long transactionCount = transactionRepository.count();

      counts.put("users", userCount);
      counts.put("categories", categoryCount);
      counts.put("accounts", accountCount);
      counts.put("transactions", transactionCount);
      counts.put("ok", true);

      log.info(
          "✅ Seed sanity check: users={}, categories={}, accounts={}, transactions={}",
          userCount,
          categoryCount,
          accountCount,
          transactionCount);

      return ResponseEntity.ok(counts);
    } catch (Exception e) {
      log.error("❌ Seed sanity check failed", e);
      counts.put("ok", false);
      counts.put("error", e.getMessage());
      return ResponseEntity.status(500).body(counts);
    }
  }
}
