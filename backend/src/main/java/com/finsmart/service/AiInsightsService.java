package com.finsmart.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class AiInsightsService {
    private final RestTemplate restTemplate;
    private static final String AI_SERVICE_URL = "http://localhost:8001/analyze";

    public AiInsightsService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String getSummary(Map<String, Object> payload) {
        if (payload == null) {
            throw new IllegalArgumentException("Payload cannot be null");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(AI_SERVICE_URL, entity, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object summary = response.getBody().get("summary");
                return summary != null ? summary.toString() : "No summary available";
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI service unavailable");
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI service unavailable: " + e.getMessage());
        }
    }
}
