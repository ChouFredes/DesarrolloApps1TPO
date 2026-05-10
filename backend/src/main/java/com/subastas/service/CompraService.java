package com.subastas.service;

import com.subastas.dto.response.RegistroCompraDetalleResponse;
import com.subastas.dto.response.RegistroCompraResponse;
import com.subastas.entity.RegistroDeSubasta;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.RegistroDeSubastaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompraService {

    private final RegistroDeSubastaRepository registroDeSubastaRepository;

    @Transactional(readOnly = true)
    public List<RegistroCompraResponse> listarCompras(Long clienteId) {
        log.debug("Listando compras para clienteId={}", clienteId);
        return registroDeSubastaRepository.findByClienteId(clienteId).stream()
                .map(r -> new RegistroCompraResponse(
                        r.getId(),
                        r.getSubasta().getId(),
                        r.getProducto().getId(),
                        r.getProducto().getDescripcionCatalogo(),
                        r.getImporte(),
                        r.getComision()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public RegistroCompraDetalleResponse obtenerDetalle(Long clienteId, Long compraId) {
        log.debug("Obteniendo detalle de compra compraId={} para clienteId={}", compraId, clienteId);
        RegistroDeSubasta r = registroDeSubastaRepository
                .findByIdAndClienteId(compraId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada"));

        BigDecimal costoEnvio = r.getCostoEnvio() != null ? r.getCostoEnvio() : BigDecimal.ZERO;
        BigDecimal totalAPagar = r.getImporte()
                .add(r.getComision() != null ? r.getComision() : BigDecimal.ZERO)
                .add(costoEnvio);

        return new RegistroCompraDetalleResponse(
                r.getId(),
                r.getSubasta().getId(),
                r.getProducto().getId(),
                r.getProducto().getDescripcionCatalogo(),
                r.getDuenio() != null ? r.getDuenio().getId() : null,
                r.getImporte(),
                r.getComision(),
                costoEnvio,
                totalAPagar,
                r.isRetiroPersonal()
        );
    }
}
