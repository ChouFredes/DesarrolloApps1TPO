package com.subastas.controller;

import com.subastas.dto.request.SolicitudArticuloRequest;
import com.subastas.dto.response.ArticuloUsuarioResponse;
import com.subastas.dto.response.PolizaSeguroResponse;
import com.subastas.dto.response.SolicitudArticuloResponse;
import com.subastas.dto.response.UbicacionArticuloResponse;
import com.subastas.exception.UnauthorizedException;
import com.subastas.security.JwtUtil;
import com.subastas.service.ArticuloService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ArticuloController {

    private final ArticuloService articuloService;
    private final JwtUtil jwtUtil;

    /**
     * POST /articulos/solicitar
     * Submits a new article (artículo) request. The user identity is taken from the JWT.
     */
    @PostMapping("/articulos/solicitar")
    public ResponseEntity<SolicitudArticuloResponse> solicitarArticulo(
            @RequestHeader("Authorization") String bearerToken,
            @Valid @RequestBody SolicitudArticuloRequest request) {

        Long clienteId = extractUserId(bearerToken);
        log.info("POST /articulos/solicitar — clienteId={}", clienteId);

        SolicitudArticuloResponse response = articuloService.solicitarArticulo(clienteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /usuarios/{usuarioId}/articulos
     * Lists all articles belonging to the authenticated user.
     */
    @GetMapping("/usuarios/{usuarioId}/articulos")
    public ResponseEntity<List<ArticuloUsuarioResponse>> listarArticulos(
            @PathVariable Long usuarioId,
            @RequestHeader("Authorization") String bearerToken) {

        verificarAcceso(usuarioId, bearerToken);
        log.info("GET /usuarios/{}/articulos", usuarioId);

        List<ArticuloUsuarioResponse> articulos = articuloService.listarArticulos(usuarioId);
        return ResponseEntity.ok(articulos);
    }

    /**
     * GET /usuarios/{usuarioId}/articulos/{articuloId}/poliza
     * Returns the insurance policy for the given article.
     */
    @GetMapping("/usuarios/{usuarioId}/articulos/{articuloId}/poliza")
    public ResponseEntity<PolizaSeguroResponse> obtenerPoliza(
            @PathVariable Long usuarioId,
            @PathVariable Long articuloId,
            @RequestHeader("Authorization") String bearerToken) {

        verificarAcceso(usuarioId, bearerToken);
        log.info("GET /usuarios/{}/articulos/{}/poliza", usuarioId, articuloId);

        PolizaSeguroResponse poliza = articuloService.obtenerPoliza(usuarioId, articuloId);
        return ResponseEntity.ok(poliza);
    }

    /**
     * GET /usuarios/{usuarioId}/articulos/{articuloId}/ubicacion
     * Returns the warehouse location where the article is stored.
     */
    @GetMapping("/usuarios/{usuarioId}/articulos/{articuloId}/ubicacion")
    public ResponseEntity<UbicacionArticuloResponse> obtenerUbicacion(
            @PathVariable Long usuarioId,
            @PathVariable Long articuloId,
            @RequestHeader("Authorization") String bearerToken) {

        verificarAcceso(usuarioId, bearerToken);
        log.info("GET /usuarios/{}/articulos/{}/ubicacion", usuarioId, articuloId);

        UbicacionArticuloResponse ubicacion = articuloService.obtenerUbicacion(usuarioId, articuloId);
        return ResponseEntity.ok(ubicacion);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Long extractUserId(String bearerToken) {
        String token = bearerToken.substring(7);
        return jwtUtil.extractUserId(token);
    }

    private void verificarAcceso(Long usuarioId, String bearerToken) {
        Long tokenUserId = extractUserId(bearerToken);
        if (!tokenUserId.equals(usuarioId)) {
            throw new UnauthorizedException("No tiene permiso para acceder a los datos de este usuario");
        }
    }
}
