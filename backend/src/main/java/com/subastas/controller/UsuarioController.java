package com.subastas.controller;

import com.subastas.dto.request.MedioPagoRequest;
import com.subastas.dto.response.HistorialUsuarioResponse;
import com.subastas.dto.response.MedioPagoResponse;
import com.subastas.dto.response.UsuarioResponse;
import com.subastas.security.JwtUtil;
import com.subastas.service.MedioPagoService;
import com.subastas.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final MedioPagoService medioPagoService;
    private final JwtUtil jwtUtil;

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> obtenerPerfil(
            @RequestHeader("Authorization") String bearerToken) {
        Long userId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /usuarios/me — userId={}", userId);
        return ResponseEntity.ok(usuarioService.obtenerPerfil(userId));
    }

    @GetMapping("/me/historial")
    public ResponseEntity<HistorialUsuarioResponse> obtenerHistorial(
            @RequestHeader("Authorization") String bearerToken) {
        Long userId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /usuarios/me/historial — userId={}", userId);
        return ResponseEntity.ok(usuarioService.obtenerHistorial(userId));
    }

    @GetMapping("/me/medios-de-pago")
    public ResponseEntity<List<MedioPagoResponse>> listarMediosDePago(
            @RequestHeader("Authorization") String bearerToken) {
        Long userId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /usuarios/me/medios-de-pago — userId={}", userId);
        return ResponseEntity.ok(medioPagoService.listar(userId));
    }

    @PostMapping("/me/medios-de-pago")
    public ResponseEntity<MedioPagoResponse> registrarMedioDePago(
            @RequestHeader("Authorization") String bearerToken,
            @Valid @RequestBody MedioPagoRequest request) {
        Long userId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("POST /usuarios/me/medios-de-pago — userId={}", userId);
        MedioPagoResponse response = medioPagoService.registrar(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/me/medios-de-pago/{medioId}")
    public ResponseEntity<Void> eliminarMedioDePago(
            @PathVariable Long medioId,
            @RequestHeader("Authorization") String bearerToken) {
        Long userId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("DELETE /usuarios/me/medios-de-pago/{} — userId={}", medioId, userId);
        medioPagoService.eliminar(userId, medioId);
        return ResponseEntity.noContent().build();
    }
}
