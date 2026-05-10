package com.subastas.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PujaResponse(
        Long pujaId,
        Long asistenteId,
        Long itemId,
        BigDecimal importe,
        String ganador,
        LocalDateTime timestamp
) {}
