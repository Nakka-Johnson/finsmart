package com.finsmart.service;

import com.finsmart.domain.entity.Account;
import com.finsmart.domain.entity.User;
import com.finsmart.domain.enums.AccountType;
import com.finsmart.domain.repo.AccountRepository;
import com.finsmart.domain.repo.UserRepository;
import com.finsmart.web.error.DuplicateResourceException;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

  private final AccountRepository accountRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public List<Account> listAccounts(UUID userId) {
    return accountRepository.findByUserId(userId, Sort.by(Sort.Direction.ASC, "name"));
  }

  @Transactional(readOnly = true)
  public Account getById(UUID userId, UUID accountId) {
    Account account =
        accountRepository
            .findById(accountId)
            .orElseThrow(
                () -> new EntityNotFoundException("Account not found with id: " + accountId));

    // Verify ownership
    if (!account.getUser().getId().equals(userId)) {
      throw new EntityNotFoundException("Account not found with id: " + accountId);
    }

    return account;
  }

  @Transactional
  public Account createAccount(
      UUID userId, String name, String institution, AccountType type, String currency) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

    // Check for duplicate name per user
    if (accountRepository.existsByUserIdAndName(userId, name)) {
      throw new DuplicateResourceException("Account with name '" + name + "' already exists");
    }

    Account account = new Account();
    account.setUser(user);
    account.setName(name);
    account.setInstitution(institution);
    account.setType(type);
    account.setCurrency(currency != null ? currency : "GBP");
    account.setBalance(BigDecimal.ZERO);

    Account saved = accountRepository.save(account);
    log.info(
        "Created account: {} for user {} (id: {})",
        saved.getName(),
        user.getEmail(),
        saved.getId());
    return saved;
  }

  @Transactional
  public void deleteAccount(UUID userId, UUID accountId) {
    Account account = getById(userId, accountId); // Verifies ownership
    accountRepository.delete(account);
    log.info("Deleted account: {} (id: {})", account.getName(), accountId);
  }
}
