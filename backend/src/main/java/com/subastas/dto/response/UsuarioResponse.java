package com.subastas.dto.response;

public record UsuarioResponse(
        Long id,
        String nombre,
        String apellido,
        String documento,
        String direccion,
        String estado,
        String categoria,
        String admitido,
        String pais
) {}
