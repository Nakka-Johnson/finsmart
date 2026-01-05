package com.finsmart.web.dto.category;

import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(UUID id, String name, String color, Instant createdAt) {}
