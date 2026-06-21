package com.subastas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ModificarArticuloRequest(
        @NotBlank(message = "La descripción de catálogo es obligatoria")
        String descripcionCatalogo,
        String descripcionCompleta,
        @NotNull(message = "La categoría es obligatoria")
        String categoria,
        /** Fotos del ítem como data URIs base64. Si viene no-nulo, reemplaza las fotos actuales. */
        List<String> fotosUrls
) {}
