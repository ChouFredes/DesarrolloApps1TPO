package com.subastas.service;

import com.subastas.dto.request.GenerarMultaRequest;
import com.subastas.dto.response.MultaResponse;
import com.subastas.entity.Cliente;
import com.subastas.entity.Multa;
import com.subastas.exception.BusinessException;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.MultaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MultaService {

    private final MultaRepository multaRepository;
    private final ClienteRepository clienteRepository;

    @Transactional(readOnly = true)
    public List<MultaResponse> listarMisMultas(Long clienteId) {
        return multaRepository.findByClienteId(clienteId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MultaResponse pagar(Long multaId, Long clienteId) {
        Multa multa = multaRepository.findById(multaId)
                .orElseThrow(() -> new ResourceNotFoundException("Multa", "id", multaId));
        if (!multa.getCliente().getId().equals(clienteId)) {
            throw new BusinessException("Esta multa no pertenece al usuario");
        }
        if ("PAGADA".equals(multa.getEstado())) {
            throw new BusinessException("Esta multa ya fue pagada");
        }
        multa.setEstado("PAGADA");
        multa.setFechaPago(LocalDateTime.now());
        return toResponse(multaRepository.save(multa));
    }

    @Transactional
    public MultaResponse generarMulta(GenerarMultaRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", request.clienteId()));

        BigDecimal importeMulta = request.importeOfertado()
                .multiply(BigDecimal.valueOf(0.10));

        Multa multa = new Multa();
        multa.setCliente(cliente);
        multa.setImporte(importeMulta);
        multa.setMotivo(request.motivo() != null ? request.motivo() : "Incumplimiento de pago en subasta");
        multa.setEstado("PENDIENTE");
        multa.setFechaGeneracion(LocalDateTime.now());
        multa.setPlazoVencimiento(LocalDateTime.now().plusHours(72));

        log.info("Multa generada para clienteId={}, importe={}", request.clienteId(), importeMulta);
        return toResponse(multaRepository.save(multa));
    }

    private MultaResponse toResponse(Multa m) {
        return new MultaResponse(
                m.getId(), m.getImporte(), m.getMotivo(), m.getEstado(),
                m.getFechaGeneracion(), m.getPlazoVencimiento(), m.getFechaPago()
        );
    }
}
