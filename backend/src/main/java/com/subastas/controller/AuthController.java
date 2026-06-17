package com.subastas.controller;

import com.subastas.dto.request.LoginRequest;
import com.subastas.dto.request.RegistroPostorPaso1Request;
import com.subastas.dto.request.RegistroPostorPaso2Request;
import com.subastas.dto.request.RegistroVendedorRequest;
import com.subastas.dto.response.ActivacionResponse;
import com.subastas.dto.response.LoginResponse;
import com.subastas.dto.response.LogoutResponse;
import com.subastas.dto.response.RegistroResponse;
import com.subastas.security.JwtUtil;
import com.subastas.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/registro/paso1")
    public ResponseEntity<RegistroResponse> registroPaso1(
            @Valid @RequestBody RegistroPostorPaso1Request request) {
        RegistroResponse response = authService.registrarPaso1(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/registro/vendedor")
    public ResponseEntity<RegistroResponse> registroVendedor(
            @Valid @RequestBody RegistroVendedorRequest request) {
        log.info("POST /auth/registro/vendedor — documento={}", request.documento());
        RegistroResponse response = authService.registrarVendedor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/registro/paso2")
    public ResponseEntity<ActivacionResponse> registroPaso2(
            @Valid @RequestBody RegistroPostorPaso2Request request) {
        ActivacionResponse response = authService.registrarPaso2(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(
            @RequestHeader("Authorization") String bearerToken) {
        String token = bearerToken.substring(7);
        Long usuarioId = jwtUtil.extractUserId(token);
        authService.logout(usuarioId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(new LogoutResponse("Sesión cerrada correctamente"));
    }
}
