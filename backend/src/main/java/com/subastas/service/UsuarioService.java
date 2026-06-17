package com.subastas.service;

import com.subastas.dto.request.ActualizarPerfilRequest;
import com.subastas.dto.response.HistorialUsuarioResponse;
import com.subastas.dto.response.UsuarioResponse;
import com.subastas.entity.Cliente;
import com.subastas.entity.Duenio;
import com.subastas.entity.Persona;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.AsistenteRepository;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.PersonaRepository;
import com.subastas.repository.PujoRepository;
import com.subastas.repository.RegistroDeSubastaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final ClienteRepository clienteRepository;
    private final PersonaRepository personaRepository;
    private final AsistenteRepository asistenteRepository;
    private final PujoRepository pujoRepository;
    private final RegistroDeSubastaRepository registroDeSubastaRepository;

    public UsuarioResponse obtenerPerfil(Long usuarioId) {
        Persona persona = personaRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Persona", "id", usuarioId));

        String categoria = null;
        String admitido = "si";
        String pais = null;

        if (persona.getDocumento() != null && persona.getDocumento().equals("1")) {
            categoria = "admin";
            if (persona instanceof Cliente cliente) {
                admitido = cliente.getAdmitido();
                pais = cliente.getPais() != null ? cliente.getPais().getNombre() : null;
            }
        } else if (persona instanceof Cliente cliente) {
            categoria = cliente.getCategoria() != null ? cliente.getCategoria().name() : null;
            admitido = cliente.getAdmitido();
            pais = cliente.getPais() != null ? cliente.getPais().getNombre() : null;
        } else if (persona instanceof Duenio) {
            categoria = "vendedor";
        }

        return new UsuarioResponse(
                persona.getId(),
                persona.getNombre(),
                persona.getApellido(),
                persona.getDocumento(),
                persona.getDireccion(),
                persona.getEstado() != null ? persona.getEstado().name() : null,
                categoria,
                admitido,
                pais,
                persona.getEmail(),
                persona.getTelefono()
        );
    }

    @Transactional
    public UsuarioResponse actualizarPerfil(Long usuarioId, ActualizarPerfilRequest request) {
        Persona persona = personaRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Persona", "id", usuarioId));

        persona.setNombre(request.nombre());
        persona.setApellido(request.apellido());
        persona.setTelefono(request.telefono());
        persona.setEmail(request.email());

        Persona saved = personaRepository.save(persona);

        String categoria = null;
        String admitido = "si";
        String pais = null;

        if (saved.getDocumento() != null && saved.getDocumento().equals("1")) {
            categoria = "admin";
            if (saved instanceof Cliente cliente) {
                admitido = cliente.getAdmitido();
                pais = cliente.getPais() != null ? cliente.getPais().getNombre() : null;
            }
        } else if (saved instanceof Cliente cliente) {
            categoria = cliente.getCategoria() != null ? cliente.getCategoria().name() : null;
            admitido = cliente.getAdmitido();
            pais = cliente.getPais() != null ? cliente.getPais().getNombre() : null;
        } else if (saved instanceof Duenio) {
            categoria = "vendedor";
        }

        return new UsuarioResponse(
                saved.getId(),
                saved.getNombre(),
                saved.getApellido(),
                saved.getDocumento(),
                saved.getDireccion(),
                saved.getEstado() != null ? saved.getEstado().name() : null,
                categoria,
                admitido,
                pais,
                saved.getEmail(),
                saved.getTelefono()
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

    @Transactional
    public void guardarTokenNotificacion(Long usuarioId, String token) {
        Persona persona = personaRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Persona", "id", usuarioId));
        if (persona instanceof Cliente cliente) {
            cliente.setTokenNotificacion(token);
            clienteRepository.save(cliente);
        }
    }
}
