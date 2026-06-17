package com.subastas.controller;

import com.subastas.dto.response.VendedorPerfilResponse;
import com.subastas.entity.Duenio;
import com.subastas.entity.enums.CategoriaSubasta;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.DuenioRepository;
import com.subastas.security.JwtUtil;
import com.subastas.util.CategoriaUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/vendedores")
@RequiredArgsConstructor
public class VendedorController {

    private final DuenioRepository duenioRepository;
    private final JwtUtil jwtUtil;

    /**
     * Perfil del vendedor autenticado: estado de verificación, categoría asignada
     * y categorías en las que puede publicar (de la suya a inferior).
     */
    @GetMapping("/me")
    public ResponseEntity<VendedorPerfilResponse> miPerfil(
            @RequestHeader("Authorization") String bearerToken) {
        Long vendedorId = jwtUtil.extractUserId(bearerToken.replace("Bearer ", ""));
        log.info("GET /vendedores/me — vendedorId={}", vendedorId);

        Duenio duenio = duenioRepository.findById(vendedorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendedor", "id", vendedorId));

        List<String> categoriasPermitidas = duenio.getCategoria() == null
                ? List.of()
                : CategoriaUtil.categoriasPermitidas(duenio.getCategoria()).stream()
                        .map(CategoriaSubasta::name)
                        .toList();

        return ResponseEntity.ok(new VendedorPerfilResponse(
                duenio.getId(),
                duenio.getNombre(),
                duenio.getApellido(),
                duenio.getAdmitido() != null ? duenio.getAdmitido() : "no",
                duenio.getCategoria() != null ? duenio.getCategoria().name() : null,
                categoriasPermitidas,
                duenio.getFotoAcreditacion() != null ? "/v1/fotos/" + duenio.getFotoAcreditacion().getId() : null
        ));
    }
}
