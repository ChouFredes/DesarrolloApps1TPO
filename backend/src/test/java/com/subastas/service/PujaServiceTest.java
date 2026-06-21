package com.subastas.service;

import com.subastas.dto.request.PujaRequest;
import com.subastas.entity.Asistente;
import com.subastas.entity.Catalogo;
import com.subastas.entity.Cliente;
import com.subastas.entity.ItemCatalogo;
import com.subastas.entity.MedioPago;
import com.subastas.entity.Pujo;
import com.subastas.entity.Subasta;
import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.EstadoPersona;
import com.subastas.entity.enums.TipoMedioPago;
import com.subastas.exception.BusinessException;
import com.subastas.exception.ForbiddenException;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.AsistenteRepository;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.MedioPagoRepository;
import com.subastas.repository.MultaRepository;
import com.subastas.repository.PujoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PujaServiceTest {

    @Mock
    private PujoRepository pujoRepository;

    @Mock
    private AsistenteRepository asistenteRepository;

    @Mock
    private ItemCatalogoRepository itemCatalogoRepository;

    @Mock
    private MedioPagoRepository medioPagoRepository;

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private MultaRepository multaRepository;

    @Mock
    private NotificacionService notificacionService;

    @Mock
    private SimpMessagingTemplate simpMessagingTemplate;

    @InjectMocks
    private PujaService pujaService;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Cliente buildCliente(Long id, EstadoPersona estado, CategoriaCliente categoria) {
        Cliente c = new Cliente();
        c.setId(id);
        c.setDocumento("DOC" + id);
        c.setNombre("Test");
        c.setApellido("User");
        c.setEstado(estado);
        c.setCategoria(categoria);
        c.setAdmitido("si");
        return c;
    }

    private Subasta buildSubasta(Long id) {
        Subasta s = new Subasta();
        s.setId(id);
        return s;
    }

    private Catalogo buildCatalogo(Subasta subasta) {
        Catalogo cat = new Catalogo();
        cat.setId(1L);
        cat.setSubasta(subasta);
        return cat;
    }

    private ItemCatalogo buildItem(Long id, Catalogo catalogo, BigDecimal precioBase) {
        ItemCatalogo item = new ItemCatalogo();
        item.setId(id);
        item.setCatalogo(catalogo);
        item.setPrecioBase(precioBase);
        item.setSubastado("no");
        return item;
    }

    private MedioPago buildMedioPago(Long id, Long clienteId, EstadoMedioPago estado) {
        MedioPago mp = new MedioPago();
        mp.setId(id);
        Cliente c = new Cliente();
        c.setId(clienteId);
        mp.setPersona(c);
        mp.setEstado(estado);
        mp.setTipo(TipoMedioPago.TARJETA_CREDITO);
        return mp;
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
    void realizarPuja_itemNoEncontrado_lanzaResourceNotFoundException() {
        when(itemCatalogoRepository.findById(99L)).thenReturn(Optional.empty());

        PujaRequest request = new PujaRequest(new BigDecimal("100.00"), 1L);

        assertThrows(ResourceNotFoundException.class,
                () -> pujaService.realizarPujaRest(99L, 1L, request));
    }

    @Test
    void realizarPuja_sinMediosPagoVerificados_lanzaBusinessException() {
        Subasta subasta = buildSubasta(10L);
        Catalogo catalogo = buildCatalogo(subasta);
        ItemCatalogo item = buildItem(1L, catalogo, new BigDecimal("100.00"));
        Cliente cliente = buildCliente(5L, EstadoPersona.activo, CategoriaCliente.comun);

        when(itemCatalogoRepository.findById(1L)).thenReturn(Optional.of(item));
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(cliente));
        when(multaRepository.existsByClienteIdAndEstado(5L, "PENDIENTE")).thenReturn(false);
        when(medioPagoRepository.findByPersonaIdAndEstado(5L, EstadoMedioPago.VERIFICADO))
                .thenReturn(Collections.emptyList());

        PujaRequest request = new PujaRequest(new BigDecimal("105.00"), 1L);

        assertThrows(BusinessException.class,
                () -> pujaService.realizarPujaRest(1L, 5L, request));
    }

    @Test
    void realizarPuja_montoMenorAlMinimo_lanzaBusinessException() {
        // Importe < precioBase * 1.01 → BusinessException
        BigDecimal precioBase = new BigDecimal("100.00");
        // No hay pujas previas → referencia = precioBase → mínimo = 101.00
        // Enviamos 100.50 → debe fallar
        BigDecimal importeInsuficiente = new BigDecimal("100.50");

        Subasta subasta = buildSubasta(10L);
        Catalogo catalogo = buildCatalogo(subasta);
        ItemCatalogo item = buildItem(1L, catalogo, precioBase);
        Cliente cliente = buildCliente(5L, EstadoPersona.activo, CategoriaCliente.comun);
        MedioPago medioPago = buildMedioPago(1L, 5L, EstadoMedioPago.VERIFICADO);
        Asistente asistente = buildAsistente(1L, cliente, subasta);

        when(itemCatalogoRepository.findById(1L)).thenReturn(Optional.of(item));
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(cliente));
        when(multaRepository.existsByClienteIdAndEstado(5L, "PENDIENTE")).thenReturn(false);
        when(medioPagoRepository.findByPersonaIdAndEstado(5L, EstadoMedioPago.VERIFICADO))
                .thenReturn(List.of(medioPago));
        when(medioPagoRepository.findByIdAndPersonaId(1L, 5L)).thenReturn(Optional.of(medioPago));
        when(asistenteRepository.findByClienteIdAndSubastaId(5L, 10L))
                .thenReturn(Optional.of(asistente));
        when(pujoRepository.existsBidInProgress(eq(1L), any(LocalDateTime.class)))
                .thenReturn(false);
        when(pujoRepository.findMayorImporteByItemId(1L)).thenReturn(Optional.empty());

        PujaRequest request = new PujaRequest(importeInsuficiente, 1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> pujaService.realizarPujaRest(1L, 5L, request));

        assertTrue(ex.getMessage().contains("mínima") || ex.getMessage().toLowerCase().contains("minima"));
    }

    @Test
    void realizarPuja_montoMayorAlMaximo_categoriaComun_lanzaBusinessException() {
        // Importe > precioBase * 1.20 para categoria COMUN → BusinessException
        BigDecimal precioBase = new BigDecimal("100.00");
        // Sin pujas previas → referencia = 100 → máximo = 120.00
        // Enviamos 125.00 → debe fallar
        BigDecimal importeExcesivo = new BigDecimal("125.00");

        Subasta subasta = buildSubasta(10L);
        Catalogo catalogo = buildCatalogo(subasta);
        ItemCatalogo item = buildItem(1L, catalogo, precioBase);
        Cliente cliente = buildCliente(5L, EstadoPersona.activo, CategoriaCliente.comun);
        MedioPago medioPago = buildMedioPago(1L, 5L, EstadoMedioPago.VERIFICADO);
        Asistente asistente = buildAsistente(1L, cliente, subasta);

        when(itemCatalogoRepository.findById(1L)).thenReturn(Optional.of(item));
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(cliente));
        when(multaRepository.existsByClienteIdAndEstado(5L, "PENDIENTE")).thenReturn(false);
        when(medioPagoRepository.findByPersonaIdAndEstado(5L, EstadoMedioPago.VERIFICADO))
                .thenReturn(List.of(medioPago));
        when(medioPagoRepository.findByIdAndPersonaId(1L, 5L)).thenReturn(Optional.of(medioPago));
        when(asistenteRepository.findByClienteIdAndSubastaId(5L, 10L))
                .thenReturn(Optional.of(asistente));
        when(pujoRepository.existsBidInProgress(eq(1L), any(LocalDateTime.class)))
                .thenReturn(false);
        when(pujoRepository.findMayorImporteByItemId(1L)).thenReturn(Optional.empty());

        PujaRequest request = new PujaRequest(importeExcesivo, 1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> pujaService.realizarPujaRest(1L, 5L, request));

        assertTrue(ex.getMessage().contains("máxima") || ex.getMessage().toLowerCase().contains("maxima"));
    }

    @Test
    void realizarPuja_categoriaOro_sinLimiteMaximo_exitoso() {
        // Categoría ORO NO tiene límite máximo del 20%, puede ofertar más de 120%
        BigDecimal precioBase = new BigDecimal("100.00");
        BigDecimal importeAlto = new BigDecimal("200.00"); // 200% del precio base

        Subasta subasta = buildSubasta(10L);
        Catalogo catalogo = buildCatalogo(subasta);
        ItemCatalogo item = buildItem(1L, catalogo, precioBase);
        Cliente cliente = buildCliente(5L, EstadoPersona.activo, CategoriaCliente.oro);
        MedioPago medioPago = buildMedioPago(1L, 5L, EstadoMedioPago.VERIFICADO);
        Asistente asistente = buildAsistente(1L, cliente, subasta);

        Pujo pujoGuardado = new Pujo();
        pujoGuardado.setId(1L);
        pujoGuardado.setImporte(importeAlto);
        pujoGuardado.setGanador("si");
        pujoGuardado.setTimestamp(LocalDateTime.now());
        pujoGuardado.setAsistente(asistente);
        pujoGuardado.setItem(item);

        when(itemCatalogoRepository.findById(1L)).thenReturn(Optional.of(item));
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(cliente));
        when(multaRepository.existsByClienteIdAndEstado(5L, "PENDIENTE")).thenReturn(false);
        when(medioPagoRepository.findByPersonaIdAndEstado(5L, EstadoMedioPago.VERIFICADO))
                .thenReturn(List.of(medioPago));
        when(medioPagoRepository.findByIdAndPersonaId(1L, 5L)).thenReturn(Optional.of(medioPago));
        when(asistenteRepository.findByClienteIdAndSubastaId(5L, 10L))
                .thenReturn(Optional.of(asistente));
        when(pujoRepository.existsBidInProgress(eq(1L), any(LocalDateTime.class)))
                .thenReturn(false);
        when(pujoRepository.findMayorImporteByItemId(1L)).thenReturn(Optional.empty());
        when(pujoRepository.findByItemIdOrderByTimestampDesc(1L)).thenReturn(Collections.emptyList());
        when(pujoRepository.save(any(Pujo.class))).thenReturn(pujoGuardado);
        doNothing().when(simpMessagingTemplate).convertAndSend(anyString(), any(Object.class));

        PujaRequest request = new PujaRequest(importeAlto, 1L);

        // Should NOT throw — oro category has no upper limit
        assertDoesNotThrow(() -> pujaService.realizarPujaRest(1L, 5L, request));

        verify(pujoRepository).save(any(Pujo.class));
    }
}
