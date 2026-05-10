package com.subastas.service;

import com.subastas.dto.response.HistorialUsuarioResponse;
import com.subastas.dto.response.UsuarioResponse;
import com.subastas.entity.Cliente;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.AsistenteRepository;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.PujoRepository;
import com.subastas.repository.RegistroDeSubastaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final ClienteRepository clienteRepository;
    private final AsistenteRepository asistenteRepository;
    private final PujoRepository pujoRepository;
    private final RegistroDeSubastaRepository registroDeSubastaRepository;

    public UsuarioResponse obtenerPerfil(Long usuarioId) {
        Cliente cliente = clienteRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", usuarioId));

        return new UsuarioResponse(
                cliente.getId(),
                cliente.getNombre(),
                cliente.getApellido(),
                cliente.getDocumento(),
                cliente.getDireccion(),
                cliente.getEstado() != null ? cliente.getEstado().name() : null,
                cliente.getCategoria() != null ? cliente.getCategoria().name() : null,
                cliente.getAdmitido(),
                cliente.getPais() != null ? cliente.getPais().getNombre() : null
        );
    }

    public HistorialUsuarioResponse obtenerHistorial(Long usuarioId) {
        int totalSubastasAsistidas = asistenteRepository.countByClienteId(usuarioId);
        int totalPujasRealizadas = pujoRepository.countByAsistenteClienteId(usuarioId);
        int totalGanadas = pujoRepository.countByAsistenteClienteIdAndGanador(usuarioId, "si");

        BigDecimal importeTotalPagado = registroDeSubastaRepository
                .sumImporteByClienteId(usuarioId)
                .orElse(BigDecimal.ZERO);

        BigDecimal importeTotalOfertado = pujoRepository
                .sumImporteByAsistenteClienteId(usuarioId)
                .orElse(BigDecimal.ZERO);

        return new HistorialUsuarioResponse(
                totalSubastasAsistidas,
                totalGanadas,
                totalPujasRealizadas,
                importeTotalPagado,
                importeTotalOfertado
        );
    }
}
