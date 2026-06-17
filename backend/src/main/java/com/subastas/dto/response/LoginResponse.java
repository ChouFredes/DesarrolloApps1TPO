package com.subastas.dto.response;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        Long usuarioId,
        String nombre,
        String apellido,
        String categoria,
        String admitido,
        /** Para vendedores: categoría/nivel asignado por el admin (comun..platino). Null si aún no fue verificado. */
        String nivel
) {}
