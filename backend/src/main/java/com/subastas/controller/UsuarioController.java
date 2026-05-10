package com.subastas.controller;

import com.subastas.dto.request.MedioPagoRequest;
import com.subastas.dto.response.HistorialUsuarioResponse;
import com.subastas.dto.response.MedioPagoResponse;
import com.subastas.dto.response.UsuarioResponse;
import com.subastas.exception.UnauthorizedException;
import com.subastas.security.JwtUtil;
import com.subastas.service.MedioPagoService;
import com.subastas.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final MedioPagoService medioPagoService;
    private final JwtUtil jwtUtil;

    @GetMapping("/{usuarioId}")
    public ResponseEntity<UsuarioResponse> obtenerPerfil(
            @PathVariable Long usuarioId,
            @RequestHeader("Authorization") String bearerToken) {
        verificarAcceso(usuarioId, bearerToken);
        return ResponseEntity.ok(usuarioService.obtenerPerfil(usuarioId));
    }

    @GetMapping("/{usuarioId}/historial")
    public ResponseEntity<HistorialUsuarioResponse> obtenerHistorial(
            @PathVariable Long usuarioId,
            @RequestHeader("Authorization") String bearerToken) {
        verificarAcceso(usuarioId, bearerToken);
        return ResponseEntity.ok(usuarioService.obtenerHistorial(usuarioId));
    }

    @GetMapping("/{usuarioId}/medios-de-pago")
    public ResponseEntity<List<MedioPagoResponse>> listarMediosDePago(
            @PathVariable Long usuarioId,
            @RequestHeader("Authorization") String bearerToken) {
        verificarAcceso(usuarioId, bearerToken);
        return ResponseEntity.ok(medioPagoService.listar(usuarioId));
    }

    @PostMapping("/{usuarioId}/medios-de-pago")
    public ResponseEntity<MedioPagoResponse> registrarMedioDePago(
            @PathVariable Long usuarioId,
            @RequestHeader("Authorization") String bearerToken,
            @Valid @RequestBody MedioPagoRequest request) {
        verificarAcceso(usuarioId, bearerToken);
        MedioPagoResponse response = medioPagoService.registrar(usuarioId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{usuarioId}/medios-de-pago/{medioId}")
    public ResponseEntity<Void> eliminarMedioDePago(
            @PathVariable Long usuarioId,
            @PathVariable Long medioId,
            @RequestHeader("Authorization") String bearerToken) {
        verificarAcceso(usuarioId, bearerToken);
        medioPagoService.eliminar(usuarioId, medioId);
        return ResponseEntity.noContent().build();
    }

    private void verificarAcceso(Long usuarioId, String bearerToken) {
        String token = bearerToken.substring(7);
        Long tokenUserId = jwtUtil.extractUserId(token);
        if (!tokenUserId.equals(usuarioId)) {
            throw new UnauthorizedException("No tiene permiso para acceder a los datos de este usuario");
        }
    }
}
