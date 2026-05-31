package com.subastas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PagarCompraRequest(
        @NotNull Long medioPagoId,
        @NotBlank String modalidadEntrega,
        Boolean confirmaLossDeSeguros
) {}
