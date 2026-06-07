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
                .map(foto -> {
                    byte[] data = foto.getFoto();
                    MediaType contentType = MediaType.IMAGE_JPEG; // default
                    if (data != null && data.length > 4) {
                        if (data[0] == (byte) 0x89 && data[1] == (byte) 0x50 && 
                            data[2] == (byte) 0x4E && data[3] == (byte) 0x47) {
                            contentType = MediaType.IMAGE_PNG;
                        } else if (data[0] == (byte) 0x47 && data[1] == (byte) 0x49 && 
                                   data[2] == (byte) 0x46 && data[3] == (byte) 0x38) {
                            contentType = MediaType.IMAGE_GIF;
                        }
                    }
                    return ResponseEntity.ok()
                            .contentType(contentType)
                            .body(data);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
