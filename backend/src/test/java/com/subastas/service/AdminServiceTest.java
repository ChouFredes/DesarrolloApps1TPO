package com.subastas.service;

import com.subastas.dto.response.ArticuloUsuarioResponse;
import com.subastas.entity.Producto;
import com.subastas.entity.Seguro;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.DuenioRepository;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.MedioPagoRepository;
import com.subastas.repository.ProductoRepository;
import com.subastas.repository.SeguroRepository;
import com.subastas.repository.SubastaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private DuenioRepository duenioRepository;

    @Mock
    private MedioPagoRepository medioPagoRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private ItemCatalogoRepository itemCatalogoRepository;

    @Mock
    private SubastaRepository subastaRepository;

    @Mock
    private FotoRepository fotoRepository;

    @Mock
    private ExpoNotificationService expoNotificationService;

    @Mock
    private SeguroRepository seguroRepository;

    @InjectMocks
    private AdminService adminService;

    // -----------------------------------------------------------------------
    // asignarDeposito
    // -----------------------------------------------------------------------

    @Test
    void asignarDeposito_persisteDeposito() {
        Producto producto = new Producto();
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.asignarDeposito(1L, "Deposito Central");

        ArgumentCaptor<Producto> captor = ArgumentCaptor.forClass(Producto.class);
        verify(productoRepository).save(captor.capture());
        assertEquals("Deposito Central", captor.getValue().getDeposito());
    }

    @Test
    void asignarDeposito_articuloInexistente_lanzaResourceNotFoundException() {
        when(productoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> adminService.asignarDeposito(99L, "Deposito X"));

        verify(productoRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------
    // contratarSeguro
    // -----------------------------------------------------------------------

    @Test
    void contratarSeguro_creaYVinculaSeguro() {
        Producto producto = new Producto();
        producto.setPrecioBasePropuesto(new BigDecimal("1000"));

        when(productoRepository.findById(2L)).thenReturn(Optional.of(producto));
        when(seguroRepository.save(any(Seguro.class))).thenAnswer(inv -> inv.getArgument(0));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.contratarSeguro(2L);

        // Verify seguro was saved with correct values
        ArgumentCaptor<Seguro> seguroCaptor = ArgumentCaptor.forClass(Seguro.class);
        verify(seguroRepository).save(seguroCaptor.capture());
        Seguro savedSeguro = seguroCaptor.getValue();
        assertNotNull(savedSeguro.getNroPoliza());
        assertEquals(new BigDecimal("1000"), savedSeguro.getImporte());
        assertEquals("Aseguradora VIVO", savedSeguro.getCompania());

        // Verify producto was saved with the seguro linked
        ArgumentCaptor<Producto> productoCaptor = ArgumentCaptor.forClass(Producto.class);
        verify(productoRepository).save(productoCaptor.capture());
        assertNotNull(productoCaptor.getValue().getSeguro());
    }

    @Test
    void contratarSeguro_articuloInexistente_lanzaResourceNotFoundException() {
        when(productoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> adminService.contratarSeguro(99L));

        verify(seguroRepository, never()).save(any());
        verify(productoRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------
    // toArticuloResponse (tested indirectly via listarArticulosPendientes)
    // -----------------------------------------------------------------------

    @Test
    void listarArticulosPendientes_incluyePolizaNroYDescripcion() {
        Seguro seguro = new Seguro();
        seguro.setNroPoliza("POL-123");

        Producto producto = new Producto();
        producto.setDescripcionCatalogo("Reloj antiguo");
        producto.setDisponible("pendiente_inspeccion");
        producto.setSeguro(seguro);

        when(productoRepository.findByDisponibleIn(anyList()))
                .thenReturn(List.of(producto));
        when(fotoRepository.findByProductoId(producto.getId()))
                .thenReturn(Collections.emptyList());

        List<ArticuloUsuarioResponse> result = adminService.listarArticulosPendientes();

        assertNotNull(result);
        assertEquals(1, result.size());
        ArticuloUsuarioResponse response = result.get(0);
        assertEquals("POL-123", response.polizaNro());
        assertEquals("Reloj antiguo", response.descripcion());
    }
}
