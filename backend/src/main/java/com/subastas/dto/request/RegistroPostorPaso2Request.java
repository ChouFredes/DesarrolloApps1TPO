package com.subastas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroPostorPaso2Request(
        @NotBlank String tokenActivacion,
        @NotBlank @Size(min = 8) String password
) {}
