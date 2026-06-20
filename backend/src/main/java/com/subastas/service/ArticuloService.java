package com.subastas.service;

import com.subastas.dto.request.LoteRequest;
import com.subastas.dto.request.ModificarArticuloRequest;
import com.subastas.dto.request.SolicitudArticuloRequest;
import com.subastas.dto.response.ArticuloUsuarioResponse;
import com.subastas.dto.response.LoteResponse;
import com.subastas.dto.response.PolizaSeguroResponse;
import com.subastas.dto.response.SolicitudArticuloResponse;
import com.subastas.dto.response.UbicacionArticuloResponse;
import com.subastas.entity.Duenio;
import com.subastas.entity.Foto;
import com.subastas.entity.ItemCatalogo;
import com.subastas.entity.Lote;
import com.subastas.entity.Producto;
import com.subastas.entity.Seguro;
import com.subastas.entity.Subasta;
import com.subastas.entity.enums.CategoriaSubasta;
import com.subastas.exception.BusinessException;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.DuenioRepository;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.LoteRepository;
import com.subastas.repository.ProductoRepository;
import com.subastas.util.CategoriaUtil;
import com.subastas.util.ImagenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final LoteRepository loteRepository;

    @Transactional
    public SolicitudArticuloResponse solicitarArticulo(Long clienteId, SolicitudArticuloRequest request) {
        log.info("Procesando solicitud de artículo para clienteId={}", clienteId);

        Duenio duenio = duenioRepository.findById(clienteId)
                .orElseThrow(() -> new BusinessException("Solo los vendedores registrados pueden cargar artículos"));

        if (!"si".equalsIgnoreCase(duenio.getAdmitido())) {
            throw new BusinessException("Tu cuenta de vendedor todavía no fue verificada por el administrador");
        }

        Producto savedProducto = crearProductoDesdeItem(request, duenio, null);

        return new SolicitudArticuloResponse(
                savedProducto.getId(),
                "PENDIENTE_INSPECCION",
                "Solicitud recibida. Te indicaremos la dirección de envío para inspección."
        );
    }

    /**
     * Un vendedor (Duenio) arma una subasta como "lote": una foto de portada general,
     * un título y varios ítems. Cada ítem se vuelve un Producto en estado
     * 'pendiente_inspeccion' agrupado bajo el Lote, conservando su flujo de auditoría individual.
     */
    @Transactional
    public LoteResponse solicitarLote(Long clienteId, LoteRequest request) {
        log.info("Procesando solicitud de lote para clienteId={}, items={}", clienteId,
                request.items() != null ? request.items().size() : 0);

        Duenio duenio = duenioRepository.findById(clienteId)
                .orElseThrow(() -> new BusinessException("Solo los vendedores registrados pueden cargar artículos"));

        if (!"si".equalsIgnoreCase(duenio.getAdmitido())) {
            throw new BusinessException("Tu cuenta de vendedor todavía no fue verificada por el administrador");
        }

        Foto fotoPortada = null;
        if (request.fotoPortadaUrl() != null && !request.fotoPortadaUrl().isBlank()) {
            fotoPortada = new Foto();
            fotoPortada.setFoto(ImagenUtil.decodeFoto(request.fotoPortadaUrl()));
            fotoPortada = fotoRepository.save(fotoPortada);
        }

        Lote lote = new Lote();
        lote.setTitulo(request.titulo());
        lote.setDuenio(duenio);
        lote.setFotoPortada(fotoPortada);
        lote.setFechaCreacion(LocalDateTime.now());
        lote.setEstado("pendiente_inspeccion");
        Lote savedLote = loteRepository.save(lote);
        log.info("Lote creado con id={}", savedLote.getId());

        List<ArticuloUsuarioResponse> items = new ArrayList<>();
        for (SolicitudArticuloRequest item : request.items()) {
            Producto savedProducto = crearProductoDesdeItem(item, duenio, savedLote);
            items.add(toItemResponse(savedProducto));
        }

        String fotoPortadaUrl = fotoPortada != null ? "/v1/fotos/" + fotoPortada.getId() : null;

        return new LoteResponse(
                savedLote.getId(),
                savedLote.getTitulo(),
                fotoPortadaUrl,
                savedLote.getFechaCreacion(),
                savedLote.getEstado(),
                items
        );
    }

    /**
     * Aplica las validaciones de un ítem y crea el Producto + sus Fotos.
     * Reutilizado por {@link #solicitarArticulo} (lote == null) y {@link #solicitarLote}.
     */
    private Producto crearProductoDesdeItem(SolicitudArticuloRequest request, Duenio duenio, Lote lote) {
        if (!Boolean.TRUE.equals(request.declaraPropiedad())) {
            throw new BusinessException("Debe declarar que el bien le pertenece");
        }

        if (request.fotosUrls() == null || request.fotosUrls().isEmpty()) {
            throw new BusinessException("Se requiere al menos 1 foto del artículo");
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
        producto.setLote(lote);

        Producto savedProducto = productoRepository.save(producto);
        log.info("Producto creado con id={}, categoria={}, loteId={}", savedProducto.getId(), categoria,
                lote != null ? lote.getId() : null);

        for (String url : request.fotosUrls()) {
            Foto foto = new Foto();
            foto.setProducto(savedProducto);
            foto.setFoto(ImagenUtil.decodeFoto(url));
            fotoRepository.save(foto);
        }
        log.info("Fotos guardadas para productoId={}", savedProducto.getId());

        return savedProducto;
    }

    /** Mapea un Producto recién creado (sin ItemCatalogo todavía) a ArticuloUsuarioResponse. */
    private ArticuloUsuarioResponse toItemResponse(Producto producto) {
        List<Foto> fotos = fotoRepository.findByProductoId(producto.getId());
        List<String> fotosUrls = fotos.stream()
                .map(f -> "/v1/fotos/" + f.getId())
                .toList();
        String imagenUrl = fotosUrls.isEmpty() ? null : fotosUrls.get(0);
        return new ArticuloUsuarioResponse(
                producto.getId(),
                producto.getDescripcionCatalogo(),
                producto.getDisponible(),
                producto.getDisponible(),
                producto.getMotivoRechazo(),
                null,
                producto.getPrecioBasePropuesto(),
                producto.getComisionPropuesta(),
                producto.getSeguro() != null ? producto.getSeguro().getNroPoliza() : null,
                imagenUrl,
                producto.getCategoria() != null ? producto.getCategoria().name() : null,
                producto.getDescripcionCompleta(),
                fotosUrls
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
        List<String> fotosUrls = fotos.stream()
                .map(f -> "/v1/fotos/" + f.getId())
                .toList();
        String imagenUrl = fotosUrls.isEmpty() ? null : fotosUrls.get(0);

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
                producto.getCategoria() != null ? producto.getCategoria().name() : null,
                producto.getDescripcionCompleta(),
                fotosUrls
        );
    }

    @Transactional
    public ArticuloUsuarioResponse actualizarArticulo(Long clienteId, Long articuloId, ModificarArticuloRequest request) {
        Producto producto = productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));

        // Solo se puede editar si está rechazado por el admin o por el usuario
        if (!"rechazado".equals(producto.getDisponible()) && !"rechazado_por_usuario".equals(producto.getDisponible())) {
            throw new BusinessException("Solo se pueden modificar artículos rechazados");
        }

        producto.setDescripcionCatalogo(request.descripcionCatalogo());
        producto.setDescripcionCompleta(request.descripcionCompleta());
        producto.setCategoria(com.subastas.entity.enums.CategoriaSubasta.valueOf(request.categoria()));
        
        // Al modificar, vuelve a estar en pendiente de inspección
        producto.setDisponible("pendiente_inspeccion");
        producto.setMotivoRechazo(null);
        producto.setPrecioBasePropuesto(null);
        producto.setComisionPropuesta(null);

        Producto saved = productoRepository.save(producto);
        log.info("Artículo actualizado y devuelto a pendiente_inspeccion: articuloId={}", articuloId);
        return toResponse(saved, false);
    }
}
