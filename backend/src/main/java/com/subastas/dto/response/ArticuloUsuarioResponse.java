package com.subastas.dto.response;

import java.math.BigDecimal;

public record ArticuloUsuarioResponse(
        Long id,
        String descripcion,
        String disponible,
        String estado,
        String motivoRechazo,
        Long subastaId,
        BigDecimal precioBase,
        BigDecimal comision,
        String polizaNro,
        String imagenUrl
) {}
