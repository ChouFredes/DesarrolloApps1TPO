package com.subastas.dto.response;

public record VendedorPendienteResponse(
        Long id,
        String nombre,
        String apellido,
        String documento,
        String direccion,
        String pais,
        String fotoAcreditacionUrl
) {}
