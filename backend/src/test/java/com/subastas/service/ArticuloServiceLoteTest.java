package com.subastas.service;

import com.subastas.dto.request.LoteRequest;
import com.subastas.dto.request.SolicitudArticuloRequest;
import com.subastas.dto.response.LoteResponse;
import com.subastas.entity.Duenio;
import com.subastas.entity.Foto;
import com.subastas.entity.Lote;
import com.subastas.entity.Producto;
import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.exception.BusinessException;
import com.subastas.repository.DuenioRepository;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.LoteRepository;
import com.subastas.repository.ProductoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArticuloServiceLoteTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private FotoRepository fotoRepository;

    @Mock
    private ItemCatalogoRepository itemCatalogoRepository;

    @Mock
    private DuenioRepository duenioRepository;

    @Mock
    private LoteRepository loteRepository;

    @InjectMocks
    private ArticuloService articuloService;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Duenio buildDuenio(Long id, String admitido, CategoriaCliente categoria) {
        Duenio d = new Duenio();
        d.setId(id);
        d.setNombre("Vendedor");
        d.setApellido("Test");
        d.setDocumento("DOC" + id);
        d.setAdmitido(admitido);
        d.setCategoria(categoria);
        return d;
    }

    private List<String> seisFotos() {
        List<String> fotos = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            fotos.add("data:image/jpeg;base64,Zm90bw==");
        }
        return fotos;
    }

    private SolicitudArticuloRequest buildItem(String descripcion, int cantidadFotos, String categoria) {
        List<String> fotos = new ArrayList<>();
        for (int i = 0; i < cantidadFotos; i++) {
            fotos.add("data:image/jpeg;base64,Zm90bw==");
        }
        return new SolicitudArticuloRequest(
                descripcion, "completa", fotos, "historico", "artista",
                Boolean.TRUE, null, categoria);
    }

    // -----------------------------------------------------------------------
    // Test cases
    // -----------------------------------------------------------------------

    @Test
    void solicitarLote_vendedorNoAdmitido_lanzaBusinessExceptionYNoGuardaNada() {
        Duenio duenio = buildDuenio(1L, "no", CategoriaCliente.platino);
        when(duenioRepository.findById(1L)).thenReturn(Optional.of(duenio));

        LoteRequest request = new LoteRequest(
                "Mi lote", null, null,
                List.of(buildItem("Item 1", 6, "joyas")));

        assertThrows(BusinessException.class,
                () -> articuloService.solicitarLote(1L, request));

        verify(loteRepository, never()).save(any());
        verify(productoRepository, never()).save(any());
        verify(fotoRepository, never()).save(any());
    }

    @Test
    void solicitarLote_itemSinFotos_lanzaBusinessException() {
        Duenio duenio = buildDuenio(1L, "si", CategoriaCliente.platino);
        when(duenioRepository.findById(1L)).thenReturn(Optional.of(duenio));
        when(loteRepository.save(any(Lote.class))).thenAnswer(inv -> {
            Lote l = inv.getArgument(0);
            l.setId(100L);
            return l;
        });

        LoteRequest request = new LoteRequest(
                "Mi lote", null, null,
                List.of(buildItem("Item con pocas fotos", 0, "joyas")));

        assertThrows(BusinessException.class,
                () -> articuloService.solicitarLote(1L, request));

        verify(productoRepository, never()).save(any());
    }

    @Test
    void solicitarLote_happyPath_creaLoteYProductos() {
        Duenio duenio = buildDuenio(1L, "si", CategoriaCliente.platino);
        when(duenioRepository.findById(1L)).thenReturn(Optional.of(duenio));

        AtomicLong fotoSeq = new AtomicLong(1);
        when(fotoRepository.save(any(Foto.class))).thenAnswer(inv -> {
            Foto f = inv.getArgument(0);
            if (f.getId() == null) {
                f.setId(fotoSeq.getAndIncrement());
            }
            return f;
        });
        when(loteRepository.save(any(Lote.class))).thenAnswer(inv -> {
            Lote l = inv.getArgument(0);
            l.setId(100L);
            return l;
        });
        AtomicLong prodSeq = new AtomicLong(1);
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> {
            Producto p = inv.getArgument(0);
            p.setId(prodSeq.getAndIncrement());
            return p;
        });
        // toItemResponse re-fetches fotos for the product
        when(fotoRepository.findByProductoId(any())).thenReturn(List.of());

        LoteRequest request = new LoteRequest(
                "Lote de joyas",
                "data:image/jpeg;base64,cG9ydGFkYQ==",
                null,
                List.of(
                        buildItem("Anillo", 6, "joyas"),
                        buildItem("Collar", 6, "arte")));

        LoteResponse response = articuloService.solicitarLote(1L, request);

        // Lote saved exactly once
        verify(loteRepository, times(1)).save(any(Lote.class));

        // Two products saved, each with lote set and estado pendiente_inspeccion
        ArgumentCaptor<Producto> productoCaptor = ArgumentCaptor.forClass(Producto.class);
        verify(productoRepository, times(2)).save(productoCaptor.capture());
        List<Producto> productosGuardados = productoCaptor.getAllValues();
        assertEquals(2, productosGuardados.size());
        for (Producto p : productosGuardados) {
            assertNotNull(p.getLote(), "El producto debe tener lote asignado");
            assertEquals(100L, p.getLote().getId());
            assertEquals("pendiente_inspeccion", p.getDisponible());
        }

        // Response shape
        assertNotNull(response);
        assertEquals(2, response.items().size());
        assertNotNull(response.fotoPortadaUrl());
        assertTrue(response.fotoPortadaUrl().startsWith("/v1/fotos/"));
        assertEquals("pendiente_inspeccion", response.estado());
        assertEquals(100L, response.id());
    }

    @Test
    void actualizarArticulo_articuloRechazado_exito() {
        Producto producto = new Producto();
        producto.setId(10L);
        producto.setDisponible("rechazado");
        producto.setMotivoRechazo("Mal estado");

        com.subastas.dto.request.ModificarArticuloRequest request = new com.subastas.dto.request.ModificarArticuloRequest(
                "Anillo Modificado", "Nueva desc completa", "joyas"
        );

        when(productoRepository.findByIdAndDuenioId(10L, 1L)).thenReturn(Optional.of(producto));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fotoRepository.findByProductoId(10L)).thenReturn(List.of());

        var response = articuloService.actualizarArticulo(1L, 10L, request);

        assertNotNull(response);
        assertEquals("Anillo Modificado", response.descripcion());
        assertEquals("pendiente_inspeccion", response.estado());
        assertNull(response.motivoRechazo());
        verify(productoRepository, times(1)).save(producto);
    }

    @Test
    void actualizarArticulo_articuloNoRechazado_lanzaBusinessException() {
        Producto producto = new Producto();
        producto.setId(10L);
        producto.setDisponible("pendiente_inspeccion");

        com.subastas.dto.request.ModificarArticuloRequest request = new com.subastas.dto.request.ModificarArticuloRequest(
                "Anillo Modificado", "Nueva desc completa", "joyas"
        );

        when(productoRepository.findByIdAndDuenioId(10L, 1L)).thenReturn(Optional.of(producto));

        assertThrows(BusinessException.class, () -> {
            articuloService.actualizarArticulo(1L, 10L, request);
        });

        verify(productoRepository, never()).save(any());
    }
}
