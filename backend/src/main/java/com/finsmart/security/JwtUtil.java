package com.finsmart.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JwtUtil {

  @Value("${app.jwt.secret}")
  private String jwtSecret;

  @Value("${app.jwt.issuer}")
  private String jwtIssuer;

  @Value("${app.jwt.expires-minutes}")
  private int expiresMinutes;

  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
  }

  public String createToken(UUID userId, String email) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + (expiresMinutes * 60 * 1000L));

    return Jwts.builder()
        .subject(email)
        .claim("userId", userId.toString())
        .issuer(jwtIssuer)
        .issuedAt(now)
        .expiration(expiry)
        .signWith(getSigningKey())
        .compact();
  }

  public Claims parseToken(String token) {
    return Jwts.parser()
        .verifyWith(getSigningKey())
        .requireIssuer(jwtIssuer)
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  public boolean validateToken(String token) {
    try {
      parseToken(token);
      return true;
    } catch (Exception e) {
      log.debug("JWT validation failed: {}", e.getMessage());
      return false;
    }
  }

  public String getEmailFromToken(String token) {
    return parseToken(token).getSubject();
  }

  public UUID getUserIdFromToken(String token) {
    String userIdStr = parseToken(token).get("userId", String.class);
    return UUID.fromString(userIdStr);
  }
}
