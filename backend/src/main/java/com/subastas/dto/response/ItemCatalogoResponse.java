package com.subastas.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record ItemCatalogoResponse(
        Long id,
        Long productoId,
        String descripcionCatalogo,
        BigDecimal precioBase,
        BigDecimal comision,
        String subastado,
        List<String> fotosUrls
) {}
