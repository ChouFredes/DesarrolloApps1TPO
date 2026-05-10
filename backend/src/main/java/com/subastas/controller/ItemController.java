package com.subastas.controller;

import com.subastas.dto.response.ItemDetalleResponse;
import com.subastas.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping("/{itemId}")
    public ResponseEntity<ItemDetalleResponse> obtenerDetalle(@PathVariable Long itemId) {
        return ResponseEntity.ok(itemService.obtenerDetalle(itemId));
    }

    @GetMapping("/{itemId}/fotos")
    public ResponseEntity<List<String>> obtenerFotos(@PathVariable Long itemId) {
        return ResponseEntity.ok(itemService.obtenerFotosUrls(itemId));
    }
}
