package com.subastas.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PujaBroadcastMessage(
        Long subastaId,
        Long itemId,
        Long pujaId,
        Integer numeroPostor,
        BigDecimal importe,
        BigDecimal mayorOfertaActual,
        LocalDateTime timestamp
) {}
