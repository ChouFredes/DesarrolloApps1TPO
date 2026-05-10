package com.subastas.controller;

import com.subastas.dto.response.ConexionSubastaResponse;
import com.subastas.security.JwtUtil;
import com.subastas.service.ConexionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/subastas")
@RequiredArgsConstructor
public class ConexionController {

    private final ConexionService conexionService;
    private final JwtUtil jwtUtil;

    @PostMapping("/{id}/conectar")
    public ResponseEntity<ConexionSubastaResponse> conectar(
            @PathVariable Long id,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        ConexionSubastaResponse response = conexionService.conectar(id, clienteId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/desconectar")
    public ResponseEntity<Void> desconectar(
            @PathVariable Long id,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        conexionService.desconectar(id, clienteId);
        return ResponseEntity.noContent().build();
    }
}
