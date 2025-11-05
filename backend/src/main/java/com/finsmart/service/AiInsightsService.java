package com.finsmart.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AiInsightsService {
    private final RestTemplate rest = new RestTemplate();
    private final String aiUrl = "http://localhost:8001/analyze";

    public String getSummary(Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        ResponseEntity<Map> resp = rest.postForEntity(aiUrl, entity, Map.class);
        return resp.getBody().get("summary").toString();
    }
}
