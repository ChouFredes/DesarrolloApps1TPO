package com.subastas.dto.response;

import java.math.BigDecimal;

public record MedioPagoResponse(
        Long id,
        String tipo,
        String descripcion,
        String moneda,
        String estado,
        Boolean esBancaExterior,
        BigDecimal montoDisponible,
        String numeroCuenta,
        String numeroTarjeta
) {}
