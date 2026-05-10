package com.subastas.controller;

import com.subastas.entity.Foto;
import com.subastas.repository.FotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/fotos")
@RequiredArgsConstructor
public class FotoController {

    private final FotoRepository fotoRepository;

    @GetMapping("/{fotoId}")
    public ResponseEntity<byte[]> obtenerFoto(@PathVariable Long fotoId) {
        return fotoRepository.findById(fotoId)
                .map(foto -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(foto.getFoto()))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
