package com.finsmart.util;

import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

/** Utility class for parsing CSV files. */
public final class CsvParserUtil {

  private CsvParserUtil() {
    throw new UnsupportedOperationException("Utility class");
  }

  /**
   * Parse CSV file with automatic header detection.
   *
   * @param reader CSV file reader
   * @return list of rows as maps (header -> value)
   * @throws IOException if parsing fails
   */
  public static List<Map<String, String>> parse(Reader reader) throws IOException {
    return parse(reader, true);
  }

  /**
   * Parse CSV file.
   *
   * @param reader CSV file reader
   * @param hasHeader whether CSV has header row
   * @return list of rows as maps
   * @throws IOException if parsing fails
   */
  public static List<Map<String, String>> parse(Reader reader, boolean hasHeader)
      throws IOException {

    CSVFormat format =
        CSVFormat.DEFAULT
            .builder()
            .setHeader()
            .setSkipHeaderRecord(hasHeader)
            .setIgnoreEmptyLines(true)
            .setTrim(true)
            .build();

    try (CSVParser parser = new CSVParser(reader, format)) {
      List<Map<String, String>> rows = new ArrayList<>();

      for (CSVRecord record : parser) {
        Map<String, String> row = new HashMap<>();
        record.toMap().forEach(row::put);
        rows.add(row);
      }

      return rows;
    }
  }

  /**
   * Parse CSV with custom header mapping.
   *
   * @param reader CSV file reader
   * @param headerMapping map of CSV header to field name
   * @return list of normalized rows
   * @throws IOException if parsing fails
   */
  public static List<Map<String, String>> parseWithMapping(
      Reader reader, Map<String, String> headerMapping) throws IOException {

    List<Map<String, String>> rawRows = parse(reader, true);
    List<Map<String, String>> normalizedRows = new ArrayList<>();

    for (Map<String, String> rawRow : rawRows) {
      Map<String, String> normalizedRow = new HashMap<>();

      for (Map.Entry<String, String> entry : rawRow.entrySet()) {
        String csvHeader = entry.getKey();
        String value = entry.getValue();

        // Apply mapping if exists, otherwise use original header
        String fieldName = headerMapping.getOrDefault(csvHeader, csvHeader);
        normalizedRow.put(fieldName, value);
      }

      normalizedRows.add(normalizedRow);
    }

    return normalizedRows;
  }

  /**
   * Validate CSV has required headers.
   *
   * @param reader CSV file reader
   * @param requiredHeaders required header names
   * @return true if all required headers present
   * @throws IOException if reading fails
   */
  public static boolean validateHeaders(Reader reader, List<String> requiredHeaders)
      throws IOException {

    CSVFormat format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build();

    try (CSVParser parser = new CSVParser(reader, format)) {
      Map<String, Integer> headers = parser.getHeaderMap();

      for (String required : requiredHeaders) {
        if (!headers.containsKey(required)) {
          return false;
        }
      }

      return true;
    }
  }
}
