package com.subastas.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PujaEnHistorialResponse(
        Integer numeroPostor,
        BigDecimal importe,
        LocalDateTime timestamp
) {}
