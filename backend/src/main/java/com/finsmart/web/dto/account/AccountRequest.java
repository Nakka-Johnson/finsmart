package com.finsmart.web.dto.account;

import com.finsmart.domain.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AccountRequest(
    @NotBlank(message = "Account name is required")
        @Size(min = 2, max = 100, message = "Account name must be between 2 and 100 characters")
        String name,
    @Size(max = 100, message = "Institution name must not exceed 100 characters")
        String institution,
    @NotNull(message = "Account type is required") AccountType type,
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter code") String currency) {}
