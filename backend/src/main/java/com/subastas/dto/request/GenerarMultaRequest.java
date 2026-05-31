package com.subastas.dto.request;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record GenerarMultaRequest(
        @NotNull Long clienteId,
        @NotNull BigDecimal importeOfertado,
        String motivo
) {}
