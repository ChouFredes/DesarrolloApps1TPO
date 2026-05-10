package com.subastas.controller;

import com.subastas.dto.response.NotificacionResponse;
import com.subastas.exception.UnauthorizedException;
import com.subastas.security.JwtUtil;
import com.subastas.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final JwtUtil jwtUtil;

    @GetMapping("/{usuarioId}/notificaciones")
    public ResponseEntity<List<NotificacionResponse>> listarNotificaciones(
            @PathVariable Long usuarioId,
            @RequestParam(required = false) Boolean leida,
            @RequestHeader("Authorization") String bearerToken) {
        verificarAcceso(usuarioId, bearerToken);
        log.info("GET /usuarios/{}/notificaciones?leida={}", usuarioId, leida);
        return ResponseEntity.ok(notificacionService.listar(usuarioId, leida));
    }

    @PatchMapping("/{usuarioId}/notificaciones/{notificacionId}/leer")
    public ResponseEntity<NotificacionResponse> marcarLeida(
            @PathVariable Long usuarioId,
            @PathVariable Long notificacionId,
            @RequestHeader("Authorization") String bearerToken) {
        verificarAcceso(usuarioId, bearerToken);
        log.info("PATCH /usuarios/{}/notificaciones/{}/leer", usuarioId, notificacionId);
        return ResponseEntity.ok(notificacionService.marcarLeida(usuarioId, notificacionId));
    }

    private void verificarAcceso(Long usuarioId, String bearerToken) {
        String token = bearerToken.substring(7);
        Long tokenUserId = jwtUtil.extractUserId(token);
        if (!tokenUserId.equals(usuarioId)) {
            throw new UnauthorizedException("No tiene permiso para acceder a los datos de este usuario");
        }
    }
}
