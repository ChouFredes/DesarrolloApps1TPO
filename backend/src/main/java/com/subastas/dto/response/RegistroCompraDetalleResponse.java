package com.subastas.dto.response;

import java.math.BigDecimal;

public record RegistroCompraDetalleResponse(
        Long id,
        Long subastaId,
        Long productoId,
        String descripcionProducto,
        Long duenioId,
        BigDecimal importe,
        BigDecimal comision,
        BigDecimal costoEnvio,
        BigDecimal totalAPagar,
        Boolean retiroPersonal
) {}
