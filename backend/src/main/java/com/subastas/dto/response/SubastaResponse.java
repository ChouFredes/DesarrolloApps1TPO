package com.subastas.dto.response;

import java.time.LocalDate;

public record SubastaResponse(
        Long id,
        LocalDate fecha,
        String hora,
        String estado,
        String categoria,
        String moneda,
        String ubicacion
) {}
