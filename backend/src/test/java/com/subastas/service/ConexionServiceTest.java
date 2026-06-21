package com.subastas.service;

import com.subastas.dto.response.ConexionSubastaResponse;
import com.subastas.entity.Asistente;
import com.subastas.entity.Cliente;
import com.subastas.entity.Subasta;
import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.EstadoPersona;
import com.subastas.entity.enums.EstadoSubasta;
import com.subastas.exception.ForbiddenException;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.AsistenteRepository;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.MedioPagoRepository;
import com.subastas.repository.PujoRepository;
import com.subastas.repository.SubastaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConexionServiceTest {

    @Mock
    private AsistenteRepository asistenteRepository;

    @Mock
    private SubastaRepository subastaRepository;

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private MedioPagoRepository medioPagoRepository;

    @Mock
    private ItemCatalogoRepository itemCatalogoRepository;

    @Mock
    private PujoRepository pujoRepository;

    @Mock
    private FotoRepository fotoRepository;

    @InjectMocks
    private ConexionService conexionService;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Subasta buildSubasta(Long id, EstadoSubasta estado) {
        Subasta s = new Subasta();
        s.setId(id);
        s.setEstado(estado);
        return s;
    }

    private Cliente buildCliente(Long id) {
        Cliente c = new Cliente();
        c.setId(id);
        c.setNombre("Ana");
        c.setApellido("Lopez");
        c.setDocumento("DOC" + id);
        c.setEstado(EstadoPersona.activo);
        c.setAdmitido("si");
        return c;
    }

    private Asistente buildAsistente(Long id, Cliente cliente, Subasta subasta) {
        Asistente a = new Asistente();
        a.setId(id);
        a.setCliente(cliente);
        a.setSubasta(subasta);
        a.setNumeroPostor(1);
        return a;
    }

    // -----------------------------------------------------------------------
    // Test cases
    // -----------------------------------------------------------------------

    @Test
    void conectar_subastaNoEncontrada_lanzaResourceNotFoundException() {
        when(subastaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> conexionService.conectar(99L, 1L));
    }

    @Test
    void conectar_subastaCerrada_lanzaResourceNotFoundException() {
        Subasta subastaCerrada = buildSubasta(1L, EstadoSubasta.cerrada);
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subastaCerrada));

        // The service throws ResourceNotFoundException when state != abierta
        assertThrows(ResourceNotFoundException.class,
                () -> conexionService.conectar(1L, 5L));
    }

    @Test
    void conectar_sinMediosPagoVerificados_retornaPuedeOfertarFalse() {
        Subasta subasta = buildSubasta(1L, EstadoSubasta.abierta);
        Cliente cliente = buildCliente(5L);
        Asistente asistente = buildAsistente(10L, cliente, subasta);

        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(cliente));
        when(medioPagoRepository.existsByPersonaIdAndEstado(5L, EstadoMedioPago.VERIFICADO))
                .thenReturn(false);
        when(asistenteRepository.findByClienteIdAndSubastaId(5L, 1L))
                .thenReturn(Optional.empty());
        when(asistenteRepository.countBySubastaId(1L)).thenReturn(0);
        when(asistenteRepository.save(any(Asistente.class))).thenReturn(asistente);
        when(itemCatalogoRepository.findFirstByCatalogoSubastaIdAndSubastado(1L, "no"))
                .thenReturn(Optional.empty());

        ConexionSubastaResponse response = conexionService.conectar(1L, 5L);

        assertNotNull(response);
        assertFalse(response.puedeOfertar());
    }

    @Test
    void conectar_exitoso_creaAsistenteYRetornaResponse() {
        Subasta subasta = buildSubasta(1L, EstadoSubasta.abierta);
        Cliente cliente = buildCliente(5L);
        Asistente asistente = buildAsistente(10L, cliente, subasta);

        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(cliente));
        when(medioPagoRepository.existsByPersonaIdAndEstado(5L, EstadoMedioPago.VERIFICADO))
                .thenReturn(true);
        // No existing asistente for this subasta → will create one
        when(asistenteRepository.findByClienteIdAndSubastaId(5L, 1L))
                .thenReturn(Optional.empty());
        when(asistenteRepository.countBySubastaId(1L)).thenReturn(0);
        when(asistenteRepository.save(any(Asistente.class))).thenReturn(asistente);
        // No current item being auctioned
        when(itemCatalogoRepository.findFirstByCatalogoSubastaIdAndSubastado(1L, "no"))
                .thenReturn(Optional.empty());

        ConexionSubastaResponse response = conexionService.conectar(1L, 5L);

        assertNotNull(response);
        assertEquals(1L, response.subastaId());
        assertEquals(10L, response.asistenteId());
        assertEquals(1, response.numeroPostor());
        assertTrue(response.puedeOfertar());
        assertNull(response.itemActual());
        verify(asistenteRepository).save(any(Asistente.class));
    }
}
