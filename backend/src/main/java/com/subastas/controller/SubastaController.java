package com.subastas.controller;

import com.subastas.dto.response.ItemCatalogoResponse;
import com.subastas.dto.response.PujaHistorialResponse;
import com.subastas.dto.response.SubastaDetalleResponse;
import com.subastas.dto.response.SubastaResponse;
import com.subastas.security.JwtUtil;
import com.subastas.service.SubastaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subastas")
@RequiredArgsConstructor
public class SubastaController {

    private final SubastaService subastaService;
    private final JwtUtil jwtUtil;

    @GetMapping("/abiertas")
    public ResponseEntity<List<SubastaResponse>> obtenerAbiertas(
            @RequestParam(required = false, defaultValue = "false") boolean todas,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        return ResponseEntity.ok(subastaService.obtenerAbiertasParaCliente(clienteId, todas));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubastaDetalleResponse> obtenerDetalle(
            @PathVariable Long id,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        return ResponseEntity.ok(subastaService.obtenerDetalle(id, clienteId));
    }

    @GetMapping("/{id}/portada")
    public ResponseEntity<byte[]> obtenerPortada(@PathVariable Long id) {
        return subastaService.obtenerPortada(id);
    }

    @GetMapping("/{id}/catalogo")
    public ResponseEntity<List<ItemCatalogoResponse>> obtenerCatalogo(
            @PathVariable Long id,
            @RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(subastaService.obtenerCatalogo(id));
    }

    @GetMapping("/{id}/pujas")
    public ResponseEntity<List<PujaHistorialResponse>> obtenerPujas(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemId,
            @RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(subastaService.obtenerPujas(id, itemId));
    }

    @GetMapping("/mis-participaciones")
    public ResponseEntity<List<SubastaResponse>> obtenerMisParticipaciones(
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        return ResponseEntity.ok(subastaService.obtenerParticipaciones(clienteId));
    }
}
