package com.subastas.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record ItemDetalleResponse(
        Long id,
        Long productoId,
        String descripcionCatalogo,
        String descripcionCompleta,
        BigDecimal precioBase,
        BigDecimal comision,
        String subastado,
        String disponible,
        Integer cantidadElementos,
        Long duenioId,
        List<String> fotosUrls,
        BigDecimal mayorOfertaActual
) {}
