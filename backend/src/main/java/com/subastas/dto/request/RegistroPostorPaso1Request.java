package com.subastas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegistroPostorPaso1Request(
        @NotBlank String documento,
        @NotBlank String nombre,
        @NotBlank String apellido,
        @NotBlank String direccion,
        @NotNull Integer paisId,
        @NotBlank String fotoDniFrente,
        @NotBlank String fotoDniDorso,
        @NotBlank String password
) {}
