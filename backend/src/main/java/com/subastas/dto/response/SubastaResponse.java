package com.subastas.dto.response;

public record SubastaResponse(
        Long id,
        String titulo,
        String categoria,
        String ubicacion,
        String fechaFin,
        int cantidadItems,
        String imagenPortadaUrl
) {}
