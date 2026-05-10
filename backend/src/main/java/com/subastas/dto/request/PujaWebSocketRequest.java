package com.subastas.dto.request;

import java.math.BigDecimal;

public record PujaWebSocketRequest(
        Long itemId,
        BigDecimal importe,
        Long medioPagoId
) {}
