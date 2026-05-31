package com.subastas.controller;

import com.subastas.dto.request.GenerarMultaRequest;
import com.subastas.dto.response.MultaResponse;
import com.subastas.service.AdminService;
import com.subastas.service.MultaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final MultaService multaService;

    @PostMapping("/usuarios/{id}/admitir")
    public ResponseEntity<Map<String, String>> admitirUsuario(@PathVariable Long id) {
        log.info("POST /admin/usuarios/{}/admitir", id);
        adminService.admitirUsuario(id);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario admitido"));
    }

    @PostMapping("/usuarios/{id}/rechazar")
    public ResponseEntity<Map<String, String>> rechazarUsuario(@PathVariable Long id) {
        log.info("POST /admin/usuarios/{}/rechazar", id);
        adminService.rechazarUsuario(id);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario rechazado"));
    }

    @PutMapping("/usuarios/{id}/categoria")
    public ResponseEntity<Map<String, String>> cambiarCategoria(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String categoria = body.get("categoria");
        log.info("PUT /admin/usuarios/{}/categoria — {}", id, categoria);
        adminService.cambiarCategoriaUsuario(id, categoria);
        return ResponseEntity.ok(Map.of("mensaje", "Categoría actualizada"));
    }

    @PostMapping("/mediosPago/{id}/verificar")
    public ResponseEntity<Map<String, String>> verificarMedioPago(@PathVariable Long id) {
        log.info("POST /admin/mediosPago/{}/verificar", id);
        adminService.verificarMedioPago(id);
        return ResponseEntity.ok(Map.of("mensaje", "Medio de pago verificado"));
    }

    @PostMapping("/articulos/{id}/aceptar")
    public ResponseEntity<Map<String, String>> aceptarArticulo(@PathVariable Long id) {
        log.info("POST /admin/articulos/{}/aceptar", id);
        adminService.aceptarArticulo(id);
        return ResponseEntity.ok(Map.of("mensaje", "Artículo aceptado"));
    }

    @PostMapping("/articulos/{id}/rechazar")
    public ResponseEntity<Map<String, String>> rechazarArticulo(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String motivo = body.getOrDefault("motivo", "Sin motivo especificado");
        log.info("POST /admin/articulos/{}/rechazar — motivo={}", id, motivo);
        adminService.rechazarArticulo(id, motivo);
        return ResponseEntity.ok(Map.of("mensaje", "Artículo rechazado"));
    }

    @PostMapping("/articulos/{id}/precio-base")
    public ResponseEntity<Map<String, String>> proponerPrecioBase(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        BigDecimal precioBase = new BigDecimal(body.get("precioBase").toString());
        BigDecimal comision = new BigDecimal(body.get("comision").toString());
        log.info("POST /admin/articulos/{}/precio-base — precioBase={}, comision={}", id, precioBase, comision);
        adminService.proponerPrecioBase(id, precioBase, comision);
        return ResponseEntity.ok(Map.of("mensaje", "Precio base propuesto"));
    }

    @PutMapping("/articulos/{id}/deposito")
    public ResponseEntity<Map<String, String>> asignarDeposito(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String deposito = body.get("deposito");
        log.info("PUT /admin/articulos/{}/deposito — {}", id, deposito);
        adminService.asignarDeposito(id, deposito);
        return ResponseEntity.ok(Map.of("mensaje", "Depósito asignado"));
    }

    @PostMapping("/articulos/{id}/seguro")
    public ResponseEntity<Map<String, String>> contratarSeguro(@PathVariable Long id) {
        log.info("POST /admin/articulos/{}/seguro", id);
        adminService.contratarSeguro(id);
        return ResponseEntity.ok(Map.of("mensaje", "Seguro contratado"));
    }

    @PostMapping("/items/{itemId}/cerrar")
    public ResponseEntity<Map<String, String>> cerrarItem(@PathVariable Long itemId) {
        log.info("POST /admin/items/{}/cerrar", itemId);
        adminService.cerrarItem(itemId);
        return ResponseEntity.ok(Map.of("mensaje", "Item cerrado"));
    }

    @PostMapping("/subastas/{id}/cerrar")
    public ResponseEntity<Map<String, String>> cerrarSubasta(@PathVariable Long id) {
        log.info("POST /admin/subastas/{}/cerrar", id);
        adminService.cerrarSubasta(id);
        return ResponseEntity.ok(Map.of("mensaje", "Subasta cerrada"));
    }

    @PostMapping("/ventas")
    public ResponseEntity<Map<String, String>> registrarVenta(@RequestBody Map<String, Object> body) {
        log.info("POST /admin/ventas");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("mensaje", "Venta registrada"));
    }

    @PostMapping("/multas")
    public ResponseEntity<MultaResponse> generarMulta(@Valid @RequestBody GenerarMultaRequest request) {
        log.info("POST /admin/multas — clienteId={}", request.clienteId());
        MultaResponse multa = multaService.generarMulta(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(multa);
    }
}
