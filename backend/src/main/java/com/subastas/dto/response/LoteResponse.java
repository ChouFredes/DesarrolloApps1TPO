package com.subastas.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record LoteResponse(
        Long id,
        String titulo,
        String fotoPortadaUrl,
        LocalDateTime fechaCreacion,
        String estado,
        List<ArticuloUsuarioResponse> items
) {}
