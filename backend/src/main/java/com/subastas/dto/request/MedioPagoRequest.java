package com.subastas.dto.request;

import com.subastas.entity.enums.TipoMedioPago;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MedioPagoRequest(
        @NotNull TipoMedioPago tipo,
        @NotBlank String moneda,
        Boolean esBancaExterior,
        String numeroCuenta,
        String banco,
        String numeroTarjeta,
        String vencimiento,
        BigDecimal montoCheque
) {}
