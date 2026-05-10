package com.subastas.dto.response;

import java.math.BigDecimal;

public record HistorialUsuarioResponse(
        Integer totalSubastasAsistidas,
        Integer totalGanadas,
        Integer totalPujasRealizadas,
        BigDecimal importeTotalPagado,
        BigDecimal importeTotalOfertado
) {}
