package com.finsmart.controller;

import com.finsmart.service.AiInsightsService;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/insights")
public class InsightsController {
  private final AiInsightsService ai;

  public InsightsController(AiInsightsService ai) {
    this.ai = ai;
  }

  @PostMapping("/analyze")
  public Map<String, String> analyze(@RequestBody Map<String, Object> body) {
    String summary = ai.getSummary(body);
    return Map.of("summary", summary);
  }
}
