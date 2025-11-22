package com.finsmart.util;

import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.enums.TransactionDirection;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.UUID;

/**
 * Utility class for computing SHA256 hashes of transactions for duplicate detection.
 *
 * <p>Hash is computed from: date + amount + direction + merchant + description + accountId
 */
public final class TransactionHashUtil {

  private TransactionHashUtil() {
    throw new UnsupportedOperationException("Utility class");
  }

  /**
   * Compute SHA256 hash for a transaction.
   *
   * @param postedAt transaction date
   * @param amount transaction amount
   * @param direction transaction direction (DEBIT/CREDIT)
   * @param merchant merchant name (nullable)
   * @param description transaction description (nullable)
   * @param accountId account ID
   * @return SHA256 hash as hex string (64 characters)
   */
  public static String computeHash(
      Instant postedAt,
      BigDecimal amount,
      TransactionDirection direction,
      String merchant,
      String description,
      UUID accountId) {

    String normalized =
        normalizeForHash(postedAt)
            + "|"
            + normalizeForHash(amount)
            + "|"
            + normalizeForHash(direction)
            + "|"
            + normalizeForHash(merchant)
            + "|"
            + normalizeForHash(description)
            + "|"
            + normalizeForHash(accountId);

    return sha256Hex(normalized);
  }

  /**
   * Compute SHA256 hash for an existing transaction entity.
   *
   * @param transaction transaction entity
   * @return SHA256 hash as hex string (64 characters)
   */
  public static String computeHash(Transaction transaction) {
    return computeHash(
        transaction.getPostedAt(),
        transaction.getAmount(),
        transaction.getDirection(),
        transaction.getMerchant(),
        transaction.getDescription(),
        transaction.getAccount().getId());
  }

  private static String normalizeForHash(Object value) {
    if (value == null) {
      return "";
    }
    if (value instanceof BigDecimal bd) {
      return bd.stripTrailingZeros().toPlainString();
    }
    if (value instanceof Instant instant) {
      return String.valueOf(instant.getEpochSecond());
    }
    return value.toString().trim().toLowerCase();
  }

  private static String sha256Hex(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
      return bytesToHex(hash);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 algorithm not available", e);
    }
  }

  private static String bytesToHex(byte[] bytes) {
    StringBuilder hexString = new StringBuilder(2 * bytes.length);
    for (byte b : bytes) {
      String hex = Integer.toHexString(0xff & b);
      if (hex.length() == 1) {
        hexString.append('0');
      }
      hexString.append(hex);
    }
    return hexString.toString();
  }
}
