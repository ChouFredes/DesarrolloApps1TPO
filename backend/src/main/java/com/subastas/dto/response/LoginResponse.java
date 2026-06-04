package com.subastas.dto.response;

public record LoginResponse(String accessToken, String refreshToken, Long usuarioId, String nombre, String apellido, String categoria) {}
