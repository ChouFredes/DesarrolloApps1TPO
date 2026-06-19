package com.subastas.service;

import com.subastas.dto.request.SolicitudArticuloRequest;
import com.subastas.dto.response.ArticuloUsuarioResponse;
import com.subastas.dto.response.PolizaSeguroResponse;
import com.subastas.dto.response.SolicitudArticuloResponse;
import com.subastas.dto.response.UbicacionArticuloResponse;
import com.subastas.entity.Catalogo;
import com.subastas.entity.Duenio;
import com.subastas.entity.Foto;
import com.subastas.entity.ItemCatalogo;
import com.subastas.entity.Producto;
import com.subastas.entity.Seguro;
import com.subastas.entity.Subasta;
import com.subastas.entity.enums.CategoriaSubasta;
import com.subastas.exception.BusinessException;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.DuenioRepository;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.ProductoRepository;
import com.subastas.util.CategoriaUtil;
import com.subastas.util.ImagenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArticuloService {

    private final ProductoRepository productoRepository;
    private final FotoRepository fotoRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final DuenioRepository duenioRepository;

    @Transactional
    public SolicitudArticuloResponse solicitarArticulo(Long clienteId, SolicitudArticuloRequest request) {
        log.info("Procesando solicitud de artículo para clienteId={}", clienteId);

        if (!Boolean.TRUE.equals(request.declaraPropiedad())) {
            throw new BusinessException("Debe declarar que el bien le pertenece");
        }

        if (request.fotosUrls() == null || request.fotosUrls().size() < 6) {
            throw new BusinessException("Se requieren al menos 6 fotos del artículo");
        }

        Duenio duenio = duenioRepository.findById(clienteId)
                .orElseThrow(() -> new BusinessException("Solo los vendedores registrados pueden cargar artículos"));

        if (!"si".equalsIgnoreCase(duenio.getAdmitido())) {
            throw new BusinessException("Tu cuenta de vendedor todavía no fue verificada por el administrador");
        }

        CategoriaSubasta categoria;
        try {
            categoria = CategoriaSubasta.valueOf(request.categoria().toLowerCase().trim());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Categoría inválida: " + request.categoria());
        }

        if (!CategoriaUtil.puedeAcceder(duenio.getCategoria(), categoria)) {
            throw new BusinessException(
                    "Tu nivel de vendedor (" + (duenio.getCategoria() != null ? duenio.getCategoria().name() : "sin asignar")
                            + ") no te permite publicar en la categoría " + categoria.name());
        }

        Producto producto = new Producto();
        producto.setDescripcionCatalogo(request.descripcion());
        producto.setDescripcionCompleta(request.descripcionCompleta());
        // Estado inicial: pendiente de inspección por la empresa
        producto.setDisponible("pendiente_inspeccion");
        producto.setCategoria(categoria);
        producto.setDuenio(duenio);

        Producto savedProducto = productoRepository.save(producto);
        log.info("Producto creado con id={}, categoria={}", savedProducto.getId(), categoria);

        for (String url : request.fotosUrls()) {
            Foto foto = new Foto();
            foto.setProducto(savedProducto);
            foto.setFoto(ImagenUtil.decodeFoto(url));
            fotoRepository.save(foto);
        }
        log.info("Fotos guardadas para productoId={}", savedProducto.getId());

        return new SolicitudArticuloResponse(
                savedProducto.getId(),
                "PENDIENTE_INSPECCION",
                "Solicitud recibida. Te indicaremos la dirección de envío para inspección."
        );
    }

    @Transactional(readOnly = true)
    public List<ArticuloUsuarioResponse> listarArticulos(Long clienteId) {
        log.info("Listando artículos para clienteId={}", clienteId);
        List<Producto> productos = productoRepository.findByDuenioId(clienteId);
        return productos.stream().map(p -> toResponse(p, true)).toList();
    }

    @Transactional(readOnly = true)
    public ArticuloUsuarioResponse obtenerArticulo(Long clienteId, Long articuloId) {
        log.info("Obteniendo artículo por id={} para clienteId={}", articuloId, clienteId);
        Producto producto = productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        return toResponse(producto, true);
    }

    @Transactional(readOnly = true)
    public PolizaSeguroResponse obtenerPoliza(Long clienteId, Long articuloId) {
        log.info("Obteniendo póliza para clienteId={}, articuloId={}", clienteId, articuloId);
        Producto producto = productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));

        Seguro seguro = producto.getSeguro();
        if (seguro == null) {
            throw new ResourceNotFoundException("Póliza de seguro para artículo", "id", articuloId);
        }

        return new PolizaSeguroResponse(
                seguro.getNroPoliza(),
                seguro.getCompania(),
                seguro.getPolizaCombinada(),
                seguro.getImporte()
        );
    }

    /**
     * El usuario acepta la propuesta de precio y comisión enviada por la empresa.
     * Estado → 'aceptado_por_usuario'. La empresa luego procede con el seguro y el depósito.
     */
    @Transactional
    public void aceptarPrecio(Long articuloId, Long clienteId) {
        Producto producto = productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));

        if (!"propuesta_enviada".equals(producto.getDisponible())) {
            throw new BusinessException("El artículo no tiene una propuesta pendiente de aceptación");
        }

        producto.setDisponible("aceptado_por_usuario");
        productoRepository.save(producto);
        log.info("Propuesta aceptada por el usuario: articuloId={}, clienteId={}", articuloId, clienteId);
    }

    /**
     * El usuario rechaza la propuesta. El artículo será devuelto con cargo.
     * Estado → 'rechazado_por_usuario'.
     */
    @Transactional
    public void rechazarPrecio(Long articuloId, Long clienteId) {
        Producto producto = productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));

        if (!"propuesta_enviada".equals(producto.getDisponible())) {
            throw new BusinessException("El artículo no tiene una propuesta pendiente de aceptación");
        }

        producto.setDisponible("rechazado_por_usuario");
        productoRepository.save(producto);
        log.info("Propuesta rechazada por el usuario: articuloId={}, clienteId={}", articuloId, clienteId);
    }

    @Transactional(readOnly = true)
    public UbicacionArticuloResponse obtenerUbicacion(Long clienteId, Long articuloId) {
        log.info("Obteniendo ubicación para clienteId={}, articuloId={}", clienteId, articuloId);

        productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));

        ItemCatalogo item = itemCatalogoRepository.findFirstByProductoId(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo aún no recibido en depósito", "id", articuloId));

        Subasta subasta = null;
        if (item.getCatalogo() != null) {
            subasta = item.getCatalogo().getSubasta();
        }

        String ubicacion = subasta != null ? subasta.getUbicacion() : null;

        return new UbicacionArticuloResponse(ubicacion, ubicacion, null);
    }

    // =====================================================================
    // Helper
    // =====================================================================

    private ArticuloUsuarioResponse toResponse(Producto producto, boolean incluirItemCatalogo) {
        Optional<ItemCatalogo> itemOpt = incluirItemCatalogo
                ? itemCatalogoRepository.findFirstByProductoId(producto.getId())
                : Optional.empty();

        Long subastaId = null;
        BigDecimal precioBase = null;
        BigDecimal comision = null;

        // El precio base y comisión pueden venir de la propuesta del Producto o del ItemCatalogo (si ya fue incluido)
        if (itemOpt.isPresent()) {
            ItemCatalogo item = itemOpt.get();
            precioBase = item.getPrecioBase();
            comision = item.getComision();
            if (item.getCatalogo() != null && item.getCatalogo().getSubasta() != null) {
                subastaId = item.getCatalogo().getSubasta().getId();
            }
        } else {
            // Propuesta aún no concretada en ItemCatalogo
            precioBase = producto.getPrecioBasePropuesto();
            comision = producto.getComisionPropuesta();
        }

        String polizaNro = null;
        if (producto.getSeguro() != null) {
            polizaNro = producto.getSeguro().getNroPoliza();
        }

        List<Foto> fotos = fotoRepository.findByProductoId(producto.getId());
        String imagenUrl = fotos.isEmpty() ? null : "/v1/fotos/" + fotos.get(0).getId();

        return new ArticuloUsuarioResponse(
                producto.getId(),
                producto.getDescripcionCatalogo(),
                producto.getDisponible(),
                producto.getDisponible(),  // estado = disponible en este modelo
                producto.getMotivoRechazo(),
                subastaId,
                precioBase,
                comision,
                polizaNro,
                imagenUrl,
                producto.getCategoria() != null ? producto.getCategoria().name() : null
        );
    }
}
