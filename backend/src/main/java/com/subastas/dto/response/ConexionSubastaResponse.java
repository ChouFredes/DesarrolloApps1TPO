package com.subastas.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record ConexionSubastaResponse(
        Long subastaId,
        Long asistenteId,
        Integer numeroPostor,
        ItemCatalogoResponse itemActual,
        BigDecimal mayorOfertaActual,
        Boolean puedeOfertar,
        BigDecimal pujaMinima,
        BigDecimal pujaMaxima,
        Integer tiempoRestante,
        List<PujaEnHistorialResponse> historialPujas,
        MedioPagoResponse medioPagoSeleccionado
) {}
