package com.finsmart.web.controller;

import com.finsmart.domain.entity.User;
import com.finsmart.domain.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationHelper {

  private final UserRepository userRepository;

  public UUID getCurrentUserId() {
    return getCurrentUser().getId();
  }

  public User getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new EntityNotFoundException("User not authenticated");
    }

    String email = authentication.getName();
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
  }
}
