package com.finsmart.web.controller;

import com.finsmart.service.AccountService;
import com.finsmart.web.dto.account.AccountRequest;
import com.finsmart.web.dto.account.AccountResponse;
import com.finsmart.web.mapper.AccountMapper;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

  private final AccountService accountService;
  private final AccountMapper accountMapper;
  private final AuthenticationHelper authHelper;

  @GetMapping
  public List<AccountResponse> listAccounts() {
    UUID userId = authHelper.getCurrentUserId();
    log.debug("Listing accounts for user: {}", userId);
    return accountService.listAccounts(userId).stream().map(accountMapper::toResponse).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public AccountResponse createAccount(@Valid @RequestBody AccountRequest request) {
    UUID userId = authHelper.getCurrentUserId();
    log.debug("Creating account for user: {}", userId);
    var account =
        accountService.createAccount(
            userId, request.name(), request.institution(), request.type(), request.currency());
    return accountMapper.toResponse(account);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAccount(@PathVariable UUID id) {
    UUID userId = authHelper.getCurrentUserId();
    log.debug("Deleting account {} for user: {}", id, userId);
    accountService.deleteAccount(userId, id);
  }
}
