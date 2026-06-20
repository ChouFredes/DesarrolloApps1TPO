package com.subastas.dto.response;

import java.math.BigDecimal;
import java.util.List;

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
        String imagenUrl,
        String categoria,
        String descripcionCompleta,
        List<String> fotosUrls
) {}
