package com.subastas.controller;

import com.subastas.dto.response.MultaResponse;
import com.subastas.security.JwtUtil;
import com.subastas.service.MultaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/multas")
@RequiredArgsConstructor
public class MultaController {

    private final MultaService multaService;
    private final JwtUtil jwtUtil;

    @GetMapping("/mis-multas")
    public ResponseEntity<List<MultaResponse>> listarMisMultas(
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /multas/mis-multas — clienteId={}", clienteId);
        return ResponseEntity.ok(multaService.listarMisMultas(clienteId));
    }

    @PostMapping("/{multaId}/pagar")
    public ResponseEntity<MultaResponse> pagarMulta(
            @PathVariable Long multaId,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("POST /multas/{}/pagar — clienteId={}", multaId, clienteId);
        return ResponseEntity.ok(multaService.pagar(multaId, clienteId));
    }
}
