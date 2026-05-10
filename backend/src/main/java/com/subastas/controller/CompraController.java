package com.subastas.controller;

import com.subastas.dto.response.RegistroCompraDetalleResponse;
import com.subastas.dto.response.RegistroCompraResponse;
import com.subastas.exception.UnauthorizedException;
import com.subastas.security.JwtUtil;
import com.subastas.service.CompraService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class CompraController {

    private final CompraService compraService;
    private final JwtUtil jwtUtil;

    @GetMapping("/{usuarioId}/compras")
    public ResponseEntity<List<RegistroCompraResponse>> listarCompras(
            @PathVariable Long usuarioId,
            @RequestHeader("Authorization") String bearerToken) {
        verificarAcceso(usuarioId, bearerToken);
        log.info("GET /usuarios/{}/compras", usuarioId);
        return ResponseEntity.ok(compraService.listarCompras(usuarioId));
    }

    @GetMapping("/{usuarioId}/compras/{compraId}")
    public ResponseEntity<RegistroCompraDetalleResponse> obtenerDetalle(
            @PathVariable Long usuarioId,
            @PathVariable Long compraId,
            @RequestHeader("Authorization") String bearerToken) {
        verificarAcceso(usuarioId, bearerToken);
        log.info("GET /usuarios/{}/compras/{}", usuarioId, compraId);
        return ResponseEntity.ok(compraService.obtenerDetalle(usuarioId, compraId));
    }

    private void verificarAcceso(Long usuarioId, String bearerToken) {
        String token = bearerToken.substring(7);
        Long tokenUserId = jwtUtil.extractUserId(token);
        if (!tokenUserId.equals(usuarioId)) {
            throw new UnauthorizedException("No tiene permiso para acceder a los datos de este usuario");
        }
    }
}
