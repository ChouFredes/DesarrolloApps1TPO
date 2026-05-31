package com.subastas.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MultaResponse(
        Long id,
        BigDecimal importe,
        String motivo,
        String estado,
        LocalDateTime fechaGeneracion,
        LocalDateTime plazoVencimiento,
        LocalDateTime fechaPago
) {}
