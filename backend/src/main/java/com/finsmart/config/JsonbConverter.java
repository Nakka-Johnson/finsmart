package com.finsmart.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.io.IOException;
import java.util.Map;

@Converter
public class JsonbConverter implements AttributeConverter<Object, String> {

  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  @Override
  public String convertToDatabaseColumn(Object attribute) {
    if (attribute == null) {
      return null;
    }
    try {
      return OBJECT_MAPPER.writeValueAsString(attribute);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Error converting Map to JSON", e);
    }
  }

  @Override
  public Object convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isEmpty()) {
      return null;
    }
    try {
      return OBJECT_MAPPER.readValue(dbData, Map.class);
    } catch (IOException e) {
      throw new IllegalArgumentException("Error converting JSON to Map", e);
    }
  }
}
