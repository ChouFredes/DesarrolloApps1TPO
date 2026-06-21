package com.subastas.controller;

import com.subastas.dto.request.LoteRequest;
import com.subastas.dto.request.ModificarArticuloRequest;
import com.subastas.dto.request.SolicitudArticuloRequest;
import com.subastas.dto.response.ArticuloUsuarioResponse;
import com.subastas.dto.response.LoteResponse;
import com.subastas.dto.response.PolizaSeguroResponse;
import com.subastas.dto.response.SolicitudArticuloResponse;
import com.subastas.dto.response.UbicacionArticuloResponse;
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

    @PostMapping("/articulos/solicitar")
    public ResponseEntity<SolicitudArticuloResponse> solicitarArticulo(
            @RequestHeader("Authorization") String bearerToken,
            @Valid @RequestBody SolicitudArticuloRequest request) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("POST /articulos/solicitar — clienteId={}", clienteId);
        return ResponseEntity.status(HttpStatus.CREATED).body(articuloService.solicitarArticulo(clienteId, request));
    }

    @PostMapping("/articulos/lote")
    public ResponseEntity<LoteResponse> solicitarLote(
            @RequestHeader("Authorization") String bearerToken,
            @Valid @RequestBody LoteRequest request) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("POST /articulos/lote — clienteId={}", clienteId);
        return ResponseEntity.status(HttpStatus.CREATED).body(articuloService.solicitarLote(clienteId, request));
    }

    @GetMapping("/articulos/lotes")
    public ResponseEntity<List<LoteResponse>> listarLotes(
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /articulos/lotes — clienteId={}", clienteId);
        return ResponseEntity.ok(articuloService.listarLotes(clienteId));
    }

    @GetMapping("/articulos/lotes/{loteId}")
    public ResponseEntity<LoteResponse> obtenerLote(
            @PathVariable Long loteId,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /articulos/lotes/{} — clienteId={}", loteId, clienteId);
        return ResponseEntity.ok(articuloService.obtenerLote(clienteId, loteId));
    }

    @GetMapping("/articulos/mis-articulos")
    public ResponseEntity<List<ArticuloUsuarioResponse>> listarArticulos(
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /articulos/mis-articulos — clienteId={}", clienteId);
        return ResponseEntity.ok(articuloService.listarArticulos(clienteId));
    }

    @GetMapping("/articulos/{articuloId}")
    public ResponseEntity<ArticuloUsuarioResponse> obtenerArticulo(
            @PathVariable Long articuloId,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /articulos/{} — clienteId={}", articuloId, clienteId);
        return ResponseEntity.ok(articuloService.obtenerArticulo(clienteId, articuloId));
    }

    @GetMapping("/articulos/{articuloId}/poliza")
    public ResponseEntity<PolizaSeguroResponse> obtenerPoliza(
            @PathVariable Long articuloId,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /articulos/{}/poliza — clienteId={}", articuloId, clienteId);
        return ResponseEntity.ok(articuloService.obtenerPoliza(clienteId, articuloId));
    }

    @GetMapping("/articulos/{articuloId}/ubicacion")
    public ResponseEntity<UbicacionArticuloResponse> obtenerUbicacion(
            @PathVariable Long articuloId,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /articulos/{}/ubicacion — clienteId={}", articuloId, clienteId);
        return ResponseEntity.ok(articuloService.obtenerUbicacion(clienteId, articuloId));
    }

    @PostMapping("/articulos/{articuloId}/aceptar-precio")
    public ResponseEntity<Void> aceptarPrecio(
            @PathVariable Long articuloId,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("POST /articulos/{}/aceptar-precio — clienteId={}", articuloId, clienteId);
        articuloService.aceptarPrecio(articuloId, clienteId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/articulos/{articuloId}/rechazar-precio")
    public ResponseEntity<Void> rechazarPrecio(
            @PathVariable Long articuloId,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("POST /articulos/{}/rechazar-precio — clienteId={}", articuloId, clienteId);
        articuloService.rechazarPrecio(articuloId, clienteId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/articulos/{articuloId}")
    public ResponseEntity<ArticuloUsuarioResponse> actualizarArticulo(
            @PathVariable Long articuloId,
            @RequestHeader("Authorization") String bearerToken,
            @Valid @RequestBody ModificarArticuloRequest request) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("PUT /articulos/{} — clienteId={}", articuloId, clienteId);
        return ResponseEntity.ok(articuloService.actualizarArticulo(clienteId, articuloId, request));
    }
}
