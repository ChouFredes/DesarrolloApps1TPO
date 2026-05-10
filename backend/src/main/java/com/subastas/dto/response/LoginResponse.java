package com.subastas.dto.response;

public record LoginResponse(String token, String refreshToken, Long usuarioId, String categoria) {}
