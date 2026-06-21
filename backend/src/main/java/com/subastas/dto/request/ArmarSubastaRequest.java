package com.subastas.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** La empresa arma una subasta seleccionando ítems listos (de uno o varios dueños). */
public record ArmarSubastaRequest(
        String titulo,
        @NotNull String categoria,
        @Min(1) int dias,
        /** Foto de portada de la subasta (data URI base64). La empresa la elige; no hay stock. */
        String fotoPortadaUrl,
        @NotEmpty List<Long> itemIds
) {}
