package com.subastas.controller;

import com.subastas.dto.request.PujaRequest;
import com.subastas.dto.response.PujaResponse;
import com.subastas.security.JwtUtil;
import com.subastas.service.PujaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
public class PujaController {

    private final PujaService pujaService;
    private final JwtUtil jwtUtil;

    @PostMapping("/{itemId}/pujar")
    public ResponseEntity<PujaResponse> pujar(
            @PathVariable Long itemId,
            @Valid @RequestBody PujaRequest request,
            @RequestHeader("Authorization") String bearerToken) {
        Long clienteId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        PujaResponse response = pujaService.realizarPujaRest(itemId, clienteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
