package com.subastas.dto.response;

import java.math.BigDecimal;

public record PolizaSeguroResponse(
        String nroPoliza,
        String compania,
        String polizaCombinada,
        BigDecimal importe
) {}
