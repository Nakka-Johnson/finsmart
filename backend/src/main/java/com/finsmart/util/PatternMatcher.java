package com.finsmart.util;

import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/** Utility class for matching transaction fields against rule patterns. */
public final class PatternMatcher {

  private PatternMatcher() {
    throw new UnsupportedOperationException("Utility class");
  }

  /**
   * Check if a text matches a pattern.
   *
   * <p>Pattern matching supports: - Case-insensitive substring match (default) - Regex match if
   * pattern starts with "regex:"
   *
   * @param text text to match against
   * @param pattern pattern to match
   * @return true if text matches pattern
   */
  public static boolean matches(String text, String pattern) {
    if (text == null || pattern == null) {
      return false;
    }

    String normalizedText = text.toLowerCase().trim();
    String normalizedPattern = pattern.toLowerCase().trim();

    // Check for regex pattern
    if (normalizedPattern.startsWith("regex:")) {
      String regexPattern = normalizedPattern.substring(6).trim();
      return matchesRegex(normalizedText, regexPattern);
    }

    // Default: case-insensitive substring match
    return normalizedText.contains(normalizedPattern);
  }

  /**
   * Check if text matches a regex pattern.
   *
   * @param text text to match
   * @param regexPattern regex pattern
   * @return true if text matches regex
   */
  private static boolean matchesRegex(String text, String regexPattern) {
    try {
      Pattern pattern = Pattern.compile(regexPattern, Pattern.CASE_INSENSITIVE);
      return pattern.matcher(text).find();
    } catch (PatternSyntaxException e) {
      // Invalid regex - fall back to substring match
      return text.contains(regexPattern);
    }
  }

  /**
   * Check if text matches pattern in a specific field context.
   *
   * @param merchant merchant field value
   * @param description description field value
   * @param pattern pattern to match
   * @param field field to match against ("merchant", "description", "both")
   * @return true if pattern matches in the specified field
   */
  public static boolean matchesField(
      String merchant, String description, String pattern, String field) {

    return switch (field.toLowerCase()) {
      case "merchant" -> matches(merchant, pattern);
      case "description" -> matches(description, pattern);
      case "both" -> matches(merchant, pattern) || matches(description, pattern);
      default -> false;
    };
  }
}
