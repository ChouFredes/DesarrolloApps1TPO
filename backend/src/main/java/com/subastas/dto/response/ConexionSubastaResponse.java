package com.subastas.dto.response;

import java.math.BigDecimal;

public record ConexionSubastaResponse(
        Long subastaId,
        Long asistenteId,
        Integer numeroPostor,
        ItemCatalogoResponse itemActual,
        BigDecimal mayorOfertaActual,
        Boolean puedeOfertar
) {}
