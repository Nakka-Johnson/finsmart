package com.finsmart.web.controller;

import com.finsmart.domain.entity.User;
import com.finsmart.domain.repo.UserRepository;
import com.finsmart.security.JwtUtil;
import com.finsmart.web.dto.auth.AuthResponse;
import com.finsmart.web.dto.auth.LoginRequest;
import com.finsmart.web.dto.auth.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final AuthenticationManager authenticationManager;

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    // Check if email already exists
    if (userRepository.existsByEmail(request.email())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
    }

    // Create new user
    User user =
        User.builder()
            .email(request.email())
            .passwordHash(passwordEncoder.encode(request.password()))
            .fullName(request.fullName())
            .build();

    user = userRepository.save(user);

    // Generate JWT token
    String token = jwtUtil.createToken(user.getId(), user.getEmail());

    AuthResponse response =
        new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName());

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    try {
      // Authenticate user
      Authentication authentication =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(request.email(), request.password()));

      // Get user details
      User user =
          userRepository
              .findByEmail(request.email())
              .orElseThrow(
                  () ->
                      new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

      // Generate JWT token
      String token = jwtUtil.createToken(user.getId(), user.getEmail());

      AuthResponse response =
          new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName());

      return ResponseEntity.ok(response);

    } catch (BadCredentialsException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
  }

  @GetMapping("/me")
  public ResponseEntity<AuthResponse> getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null || !authentication.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }

    String email = authentication.getName();
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    // We don't include the token in /me response since user already has it
    AuthResponse response =
        new AuthResponse(null, user.getId(), user.getEmail(), user.getFullName());

    return ResponseEntity.ok(response);
  }
}
