package com.subastas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ModificarArticuloRequest(
        @NotBlank(message = "La descripción de catálogo es obligatoria")
        String descripcionCatalogo,
        String descripcionCompleta,
        @NotNull(message = "La categoría es obligatoria")
        String categoria
) {}
