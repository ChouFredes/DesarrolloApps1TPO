package com.subastas.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record LoteRequest(
        String titulo,
        /** Foto de portada general del lote como data URI base64; puede ser null. */
        String fotoPortadaUrl,
        Long cuentaDestinoId,
        String categoria,
        @NotNull @Size(min = 1, max = 10) List<@Valid SolicitudArticuloRequest> items
) {}
