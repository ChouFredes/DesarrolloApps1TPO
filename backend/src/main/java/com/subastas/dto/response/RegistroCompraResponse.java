package com.subastas.dto.response;

import java.math.BigDecimal;

public record RegistroCompraResponse(
        Long id,
        Long subastaId,
        Long productoId,
        String descripcionProducto,
        BigDecimal importe,
        BigDecimal comision
) {}
