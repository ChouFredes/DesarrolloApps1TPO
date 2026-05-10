package com.subastas.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SubastaDetalleResponse(
        Long id,
        LocalDate fecha,
        String hora,
        String estado,
        String categoria,
        String ubicacion,
        String subastador,
        String matriculaSubastador,
        String tieneDeposito,
        String seguridadPropia,
        Integer capacidadAsistentes,
        ItemCatalogoResponse itemActual,
        BigDecimal mayorOfertaActual
) {}
