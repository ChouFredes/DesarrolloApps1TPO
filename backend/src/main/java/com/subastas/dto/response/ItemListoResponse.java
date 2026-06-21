package com.subastas.dto.response;

import java.math.BigDecimal;

/** Ítem aceptado por el vendedor y asegurado, listo para que la empresa lo arme en una subasta. */
public record ItemListoResponse(
        Long id,
        String descripcion,
        String categoria,
        BigDecimal precioBase,
        Long duenioId,
        String duenioNombre,
        String imagenUrl
) {}
