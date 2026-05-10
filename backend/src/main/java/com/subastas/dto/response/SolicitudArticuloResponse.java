package com.subastas.dto.response;

public record SolicitudArticuloResponse(
        Long solicitudId,
        String estado,
        String mensaje
) {}
