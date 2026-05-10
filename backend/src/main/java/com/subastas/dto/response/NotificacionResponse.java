package com.subastas.dto.response;

import java.time.LocalDateTime;

public record NotificacionResponse(
        Long id,
        String tipo,
        String titulo,
        String cuerpo,
        Boolean leida,
        LocalDateTime fechaCreacion
) {}
