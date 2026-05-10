package com.subastas.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String documento,
        @NotBlank String password
) {}
