package com.subastas.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PujaRequest(
        @NotNull BigDecimal importe,
        @NotNull Long medioPagoId
) {}
