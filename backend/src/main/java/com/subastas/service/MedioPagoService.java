package com.subastas.service;

import com.subastas.dto.request.MedioPagoRequest;
import com.subastas.dto.response.MedioPagoResponse;
import com.subastas.entity.Cliente;
import com.subastas.entity.MedioPago;
import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.TipoMedioPago;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.MedioPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedioPagoService {

    private final MedioPagoRepository medioPagoRepository;
    private final ClienteRepository clienteRepository;

    public List<MedioPagoResponse> listar(Long clienteId) {
        return medioPagoRepository.findByClienteId(clienteId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MedioPagoResponse registrar(Long clienteId, MedioPagoRequest request) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", clienteId));

        MedioPago medio = new MedioPago();
        medio.setCliente(cliente);
        medio.setTipo(request.tipo());
        medio.setMoneda(request.moneda());
        medio.setEstado(EstadoMedioPago.VERIFICADO);
        medio.setEsBancaExterior(Boolean.TRUE.equals(request.esBancaExterior()));
        medio.setNumeroCuenta(request.numeroCuenta());
        medio.setBanco(request.banco());
        medio.setNumeroTarjeta(request.numeroTarjeta());
        medio.setVencimiento(request.vencimiento());
        medio.setMontoCheque(request.montoCheque());

        MedioPago saved = medioPagoRepository.save(medio);
        return toResponse(saved);
    }

    @Transactional
    public void eliminar(Long clienteId, Long medioId) {
        MedioPago medio = medioPagoRepository.findById(medioId)
                .filter(m -> m.getCliente().getId().equals(clienteId))
                .orElseThrow(() -> new ResourceNotFoundException("MedioPago", "id", medioId));

        medioPagoRepository.delete(medio);
    }

    private MedioPagoResponse toResponse(MedioPago medio) {
        String descripcion = buildDescripcion(medio);
        return new MedioPagoResponse(
                medio.getId(),
                medio.getTipo().name(),
                descripcion,
                medio.getMoneda(),
                medio.getEstado().name(),
                medio.isEsBancaExterior(),
                medio.getMontoCheque()
        );
    }

    private String buildDescripcion(MedioPago medio) {
        if (medio.getTipo() == TipoMedioPago.CUENTA_BANCARIA) {
            return "Cuenta en " + medio.getBanco();
        } else if (medio.getTipo() == TipoMedioPago.TARJETA_CREDITO) {
            String numero = medio.getNumeroTarjeta();
            String last4 = (numero != null && numero.length() >= 4)
                    ? numero.substring(numero.length() - 4)
                    : numero;
            return "Tarjeta terminada en " + last4;
        } else if (medio.getTipo() == TipoMedioPago.CHEQUE_CERTIFICADO) {
            return "Cheque certificado por $" + medio.getMontoCheque();
        }
        return medio.getTipo().name();
    }
}
