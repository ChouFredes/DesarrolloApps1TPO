package com.subastas.controller;

import com.subastas.dto.request.PagarCompraRequest;
import com.subastas.dto.response.RegistroCompraDetalleResponse;
import com.subastas.dto.response.RegistroCompraResponse;
import com.subastas.security.JwtUtil;
import com.subastas.service.CompraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/compras")
@RequiredArgsConstructor
public class CompraController {

    private final CompraService compraService;
    private final JwtUtil jwtUtil;

    @GetMapping("/mis-compras")
    public ResponseEntity<List<RegistroCompraResponse>> listarCompras(
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /compras/mis-compras — clienteId={}", clienteId);
        return ResponseEntity.ok(compraService.listarCompras(clienteId));
    }

    @GetMapping("/{compraId}")
    public ResponseEntity<RegistroCompraDetalleResponse> obtenerDetalle(
            @PathVariable Long compraId,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /compras/{} — clienteId={}", compraId, clienteId);
        return ResponseEntity.ok(compraService.obtenerDetalle(clienteId, compraId));
    }

    @PostMapping("/{compraId}/pagar")
    public ResponseEntity<Void> pagar(
            @PathVariable Long compraId,
            @Valid @RequestBody PagarCompraRequest request,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("POST /compras/{}/pagar — clienteId={}", compraId, clienteId);
        compraService.pagar(clienteId, compraId, request);
        return ResponseEntity.ok().build();
    }
}
