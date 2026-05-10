package com.subastas.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PujaHistorialResponse(
        Long pujaId,
        Long asistenteId,
        Integer numeroPostor,
        BigDecimal importe,
        String ganador,
        LocalDateTime timestamp
) {}
