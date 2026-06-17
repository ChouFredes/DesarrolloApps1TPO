package com.subastas.service;

import com.subastas.dto.request.SolicitudArticuloRequest;
import com.subastas.dto.response.ArticuloUsuarioResponse;
import com.subastas.dto.response.PolizaSeguroResponse;
import com.subastas.dto.response.SolicitudArticuloResponse;
import com.subastas.dto.response.UbicacionArticuloResponse;
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
        producto.setDisponible("no");
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

        return productos.stream()
                .map(producto -> {
                    Optional<ItemCatalogo> itemOpt = itemCatalogoRepository.findFirstByProductoId(producto.getId());

                    String estado;
                    Long subastaId = null;
                    BigDecimal precioBase = null;
                    BigDecimal comision = null;

                    if (itemOpt.isEmpty()) {
                        estado = "PENDIENTE_INSPECCION";
                    } else {
                        ItemCatalogo item = itemOpt.get();
                        precioBase = item.getPrecioBase();
                        comision = item.getComision();
                        if ("si".equalsIgnoreCase(item.getSubastado())) {
                            estado = "VENDIDO";
                        } else {
                            estado = "ACEPTADO";
                        }
                        if (item.getCatalogo() != null && item.getCatalogo().getSubasta() != null) {
                            subastaId = item.getCatalogo().getSubasta().getId();
                        }
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
                            estado,
                            null,
                            subastaId,
                            precioBase,
                            comision,
                            polizaNro,
                            imagenUrl,
                            producto.getCategoria() != null ? producto.getCategoria().name() : null
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ArticuloUsuarioResponse obtenerArticulo(Long clienteId, Long articuloId) {
        log.info("Obteniendo artículo por id={} para clienteId={}", articuloId, clienteId);

        Producto producto = productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));

        Optional<ItemCatalogo> itemOpt = itemCatalogoRepository.findFirstByProductoId(producto.getId());

        String estado;
        Long subastaId = null;
        BigDecimal precioBase = null;
        BigDecimal comision = null;

        if (itemOpt.isEmpty()) {
            estado = "PENDIENTE_INSPECCION";
        } else {
            ItemCatalogo item = itemOpt.get();
            precioBase = item.getPrecioBase();
            comision = item.getComision();
            if ("si".equalsIgnoreCase(item.getSubastado())) {
                estado = "VENDIDO";
            } else {
                estado = "ACEPTADO";
            }
            if (item.getCatalogo() != null && item.getCatalogo().getSubasta() != null) {
                subastaId = item.getCatalogo().getSubasta().getId();
            }
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
                estado,
                null,
                subastaId,
                precioBase,
                comision,
                polizaNro,
                imagenUrl,
                producto.getCategoria() != null ? producto.getCategoria().name() : null
        );
    }

    @Transactional(readOnly = true)
    public PolizaSeguroResponse obtenerPoliza(Long clienteId, Long articuloId) {
        log.info("Obteniendo póliza para clienteId={}, articuloId={}", clienteId, articuloId);

        Producto producto = productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Artículo", "id", articuloId));

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

    @Transactional
    public void aceptarPrecio(Long articuloId, Long clienteId) {
        Producto producto = productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        producto.setDisponible("precio_aceptado");
        productoRepository.save(producto);
        log.info("Precio aceptado para articuloId={}, clienteId={}", articuloId, clienteId);
    }

    @Transactional
    public void rechazarPrecio(Long articuloId, Long clienteId) {
        Producto producto = productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        producto.setDisponible("precio_rechazado");
        productoRepository.save(producto);
        log.info("Precio rechazado para articuloId={}, clienteId={}", articuloId, clienteId);
    }

    @Transactional(readOnly = true)
    public UbicacionArticuloResponse obtenerUbicacion(Long clienteId, Long articuloId) {
        log.info("Obteniendo ubicación para clienteId={}, articuloId={}", clienteId, articuloId);

        productoRepository.findByIdAndDuenioId(articuloId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Artículo", "id", articuloId));

        ItemCatalogo item = itemCatalogoRepository.findFirstByProductoId(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Artículo aún no recibido en depósito", "id", articuloId));

        Subasta subasta = null;
        if (item.getCatalogo() != null) {
            subasta = item.getCatalogo().getSubasta();
        }

        String ubicacion = subasta != null ? subasta.getUbicacion() : null;

        return new UbicacionArticuloResponse(
                ubicacion,
                ubicacion,
                null
        );
    }
}
