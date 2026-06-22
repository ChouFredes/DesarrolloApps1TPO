package com.subastas.service;

import com.subastas.dto.request.ArmarSubastaRequest;
import com.subastas.dto.response.ArticuloUsuarioResponse;
import com.subastas.dto.response.ItemListoResponse;
import com.subastas.dto.response.LoteResponse;
import com.subastas.dto.response.MedioPagoResponse;
import com.subastas.dto.response.VendedorPendienteResponse;
import com.subastas.entity.Catalogo;
import com.subastas.entity.Lote;
import com.subastas.entity.Duenio;
import com.subastas.entity.Foto;
import com.subastas.entity.ItemCatalogo;
import com.subastas.entity.MedioPago;
import com.subastas.entity.Producto;
import com.subastas.entity.Subasta;
import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.CategoriaSubasta;
import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.EstadoPersona;
import com.subastas.entity.enums.EstadoSubasta;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.entity.Seguro;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.DuenioRepository;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.CatalogoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.LoteRepository;
import com.subastas.repository.MedioPagoRepository;
import com.subastas.repository.ProductoRepository;
import com.subastas.repository.SeguroRepository;
import com.subastas.repository.SubastaRepository;
import com.subastas.util.LoteEstadoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final ClienteRepository clienteRepository;
    private final DuenioRepository duenioRepository;
    private final MedioPagoRepository medioPagoRepository;
    private final ProductoRepository productoRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final SubastaRepository subastaRepository;
    private final FotoRepository fotoRepository;
    private final ExpoNotificationService expoNotificationService;
    private final SeguroRepository seguroRepository;
    private final LoteRepository loteRepository;
    private final CatalogoRepository catalogoRepository;

    // =====================================================================
    // Usuarios (postores)
    // =====================================================================

    @Transactional
    public void admitirUsuario(Long clienteId) {
        var cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", clienteId));
        cliente.setAdmitido("si");
        cliente.setEstado(EstadoPersona.activo);
        clienteRepository.save(cliente);
        log.info("Usuario admitido: clienteId={}", clienteId);
        if (cliente.getTokenNotificacion() != null && !cliente.getTokenNotificacion().isBlank()) {
            expoNotificationService.enviarNotificacion(
                    cliente.getTokenNotificacion(),
                    "¡Cuenta Validada!",
                    "Tu cuenta ha sido aprobada. Completá el registro para poder participar en subastas."
            );
        }
    }

    @Transactional
    public void rechazarUsuario(Long clienteId) {
        var cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", clienteId));
        cliente.setAdmitido("no");
        cliente.setEstado(EstadoPersona.inactivo);
        clienteRepository.save(cliente);
        log.info("Usuario rechazado: clienteId={}", clienteId);
    }

    @Transactional
    public void cambiarCategoriaUsuario(Long clienteId, String nuevaCategoria) {
        var cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", clienteId));
        cliente.setCategoria(CategoriaCliente.valueOf(nuevaCategoria));
        clienteRepository.save(cliente);
        log.info("Categoría cambiada para clienteId={}, nuevaCategoria={}", clienteId, nuevaCategoria);
    }

    @Transactional
    public void validarPorDni(String documento, String categoria) {
        var cliente = clienteRepository.findByDocumento(documento)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "documento", documento));
        cliente.setAdmitido("si");
        cliente.setEstado(EstadoPersona.activo);
        cliente.setCategoria(CategoriaCliente.valueOf(categoria.toLowerCase().trim()));
        clienteRepository.save(cliente);
        log.info("Usuario validado por DNI: documento={}, admitido=si, categoria={}", documento, categoria);
        if (cliente.getTokenNotificacion() != null && !cliente.getTokenNotificacion().isBlank()) {
            expoNotificationService.enviarNotificacion(
                    cliente.getTokenNotificacion(),
                    "¡Cuenta Validada!",
                    "Tu cuenta ha sido aprobada y ya podés participar en las subastas."
            );
        }
    }

    // =====================================================================
    // Vendedores (dueños)
    // =====================================================================

    @Transactional(readOnly = true)
    public List<VendedorPendienteResponse> listarVendedoresPendientes() {
        return duenioRepository.findByAdmitido("no").stream()
                .map(d -> new VendedorPendienteResponse(
                        d.getId(),
                        d.getNombre(),
                        d.getApellido(),
                        d.getDocumento(),
                        d.getDireccion(),
                        d.getPais() != null ? d.getPais().getNombre() : null,
                        d.getFotoAcreditacion() != null ? "/v1/fotos/" + d.getFotoAcreditacion().getId() : null
                ))
                .toList();
    }

    @Transactional
    public void aprobarVendedor(Long vendedorId, String categoria) {
        Duenio duenio = duenioRepository.findById(vendedorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendedor", "id", vendedorId));
        duenio.setAdmitido("si");
        duenio.setCategoria(CategoriaCliente.valueOf(categoria.toLowerCase().trim()));
        duenio.setVerificacionFinanciera("aprobado");
        duenio.setVerificacionJudicial("aprobado");
        duenio.setEstado(EstadoPersona.activo);
        duenioRepository.save(duenio);
        log.info("Vendedor aprobado: vendedorId={}, categoria={}", vendedorId, categoria);
    }

    @Transactional
    public void rechazarVendedor(Long vendedorId) {
        Duenio duenio = duenioRepository.findById(vendedorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendedor", "id", vendedorId));
        duenio.setAdmitido("rechazado");
        duenio.setEstado(EstadoPersona.inactivo);
        duenioRepository.save(duenio);
        log.info("Vendedor rechazado: vendedorId={}", vendedorId);
    }

    // =====================================================================
    // Medios de pago
    // =====================================================================

    @Transactional(readOnly = true)
    public List<MedioPagoResponse> listarMediosPagoPendientes() {
        return medioPagoRepository.findByEstado(EstadoMedioPago.PENDIENTE_VERIFICACION).stream()
                .map(mp -> new MedioPagoResponse(
                        mp.getId(),
                        mp.getTipo() != null ? mp.getTipo().name() : null,
                        buildDescripcionMedioPago(mp),
                        mp.getMoneda(),
                        mp.getEstado().name(),
                        mp.isEsBancaExterior(),
                        mp.getMontoCheque(),
                        mp.getNumeroCuenta(),
                        mp.getNumeroTarjeta()
                ))
                .toList();
    }

    @Transactional
    public void verificarMedioPago(Long medioPagoId) {
        MedioPago mp = medioPagoRepository.findById(medioPagoId)
                .orElseThrow(() -> new ResourceNotFoundException("MedioPago", "id", medioPagoId));
        mp.setEstado(EstadoMedioPago.VERIFICADO);
        medioPagoRepository.save(mp);
        log.info("Medio de pago verificado: medioPagoId={}", medioPagoId);
    }

    private String buildDescripcionMedioPago(MedioPago mp) {
        if (mp.getBanco() != null) return "Cuenta en " + mp.getBanco();
        if (mp.getNumeroTarjeta() != null) {
            String num = mp.getNumeroTarjeta();
            return "Tarjeta terminada en " + (num.length() >= 4 ? num.substring(num.length() - 4) : num);
        }
        if (mp.getMontoCheque() != null) return "Cheque por $" + mp.getMontoCheque();
        return mp.getTipo() != null ? mp.getTipo().name() : "Medio de pago";
    }

    // =====================================================================
    // Artículos — flujo de inspección
    // =====================================================================

    /**
     * Lista todos los artículos pendientes de inspección (estado = 'pendiente_inspeccion').
     */
    @Transactional(readOnly = true)
    public List<ArticuloUsuarioResponse> listarArticulosPendientes() {
        return productoRepository.findByDisponibleIn(List.of("pendiente_inspeccion", "inspeccion_aprobada")).stream()
                .map(this::toArticuloResponse)
                .toList();
    }

    /**
     * Lista las subastas (lotes) que tienen al menos un ítem por inspeccionar o a la espera
     * de propuesta de precio. La empresa entra a la subasta y opera ítem por ítem.
     */
    @Transactional(readOnly = true)
    public List<LoteResponse> listarLotesPendientes() {
        return loteRepository.findAllByOrderByFechaCreacionDesc().stream()
                .map(this::toLoteResponseConItems)
                .filter(par -> LoteEstadoUtil.tienePendientesParaEmpresa(par.items()))
                .map(LoteConProductos::response)
                .toList();
    }

    /**
     * Detalle de una subasta para la empresa (ve todos los ítems, sin filtrar por estado).
     */
    @Transactional(readOnly = true)
    public LoteResponse obtenerLote(Long loteId) {
        Lote lote = loteRepository.findById(loteId)
                .orElseThrow(() -> new ResourceNotFoundException("Subasta", "id", loteId));
        return toLoteResponseConItems(lote).response();
    }

    /** Tupla interna: el LoteResponse ya armado junto con los Productos crudos para filtrar. */
    private record LoteConProductos(LoteResponse response, List<Producto> items) {}

    private LoteConProductos toLoteResponseConItems(Lote lote) {
        List<Producto> productos = productoRepository.findByLoteId(lote.getId());
        List<ArticuloUsuarioResponse> items = productos.stream()
                .map(this::toArticuloResponse)
                .toList();

        String fotoPortadaUrl = lote.getFotoPortada() != null
                ? "/v1/fotos/" + lote.getFotoPortada().getId()
                : null;
        String duenioNombre = lote.getDuenio() != null
                ? lote.getDuenio().getNombre() + " " + lote.getDuenio().getApellido()
                : null;

        LoteResponse response = new LoteResponse(
                lote.getId(),
                lote.getTitulo(),
                fotoPortadaUrl,
                lote.getFechaCreacion(),
                LoteEstadoUtil.derivar(productos),
                items,
                lote.getCategoria() != null ? lote.getCategoria().name() : null,
                duenioNombre
        );
        return new LoteConProductos(response, productos);
    }

    /**
     * Admin acepta la inspección → pasa a 'inspeccion_aprobada' (ahora debe proponer precio).
     */
    @Transactional
    public void aceptarInspeccionArticulo(Long articuloId) {
        Producto producto = productoRepository.findById(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        producto.setDisponible("inspeccion_aprobada");
        productoRepository.save(producto);
        log.info("Inspección aceptada para articuloId={}", articuloId);
    }

    /**
     * Admin rechaza el artículo con un motivo visible para el usuario.
     */
    @Transactional
    public void rechazarArticulo(Long articuloId, String motivo) {
        Producto producto = productoRepository.findById(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        producto.setDisponible("rechazado");
        producto.setMotivoRechazo(motivo != null ? motivo : "Sin motivo especificado");
        productoRepository.save(producto);
        log.info("Artículo rechazado: articuloId={}, motivo={}", articuloId, motivo);
    }

    /**
     * Admin propone precio base y comisión → estado pasa a 'propuesta_enviada'.
     * El usuario verá la propuesta y podrá aceptarla o rechazarla.
     */
    @Transactional
    public void proponerPrecioBase(Long articuloId, BigDecimal precioBase, BigDecimal comision) {
        Producto producto = productoRepository.findById(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        // Guardar propuesta directamente en el Producto (no en ItemCatalogo todavía)
        producto.setPrecioBasePropuesto(precioBase);
        producto.setComisionPropuesta(comision);
        producto.setDisponible("propuesta_enviada");
        productoRepository.save(producto);
        log.info("Propuesta enviada para articuloId={}: precioBase={}, comision={}", articuloId, precioBase, comision);
    }

    @Transactional
    public void asignarDeposito(Long articuloId, String deposito) {
        Producto producto = productoRepository.findById(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        producto.setDeposito(deposito);
        productoRepository.save(producto);
        log.info("Depósito asignado para articuloId={}: {}", articuloId, deposito);
    }

    /** Lista los ítems aceptados por el vendedor y asegurados, listos para armar una subasta. */
    @Transactional(readOnly = true)
    public List<ItemListoResponse> listarItemsListos() {
        return productoRepository.findByDisponible("aceptado_por_usuario").stream()
                .filter(p -> p.getSeguro() != null)
                .map(p -> {
                    List<Foto> fotos = fotoRepository.findByProductoId(p.getId());
                    String imagenUrl = fotos.isEmpty() ? null : "/v1/fotos/" + fotos.get(0).getId();
                    return new ItemListoResponse(
                            p.getId(),
                            p.getDescripcionCatalogo(),
                            p.getCategoria() != null ? p.getCategoria().name() : null,
                            p.getPrecioBasePropuesto(),
                            p.getDuenio() != null ? p.getDuenio().getId() : null,
                            p.getDuenio() != null ? p.getDuenio().getNombre() + " " + p.getDuenio().getApellido() : null,
                            imagenUrl
                    );
                })
                .toList();
    }

    /**
     * La empresa arma la subasta seleccionando ítems listos (de uno o varios dueños) y le pone duración.
     * Crea la Subasta + Catalogo + ItemCatalogo; los compradores de esa categoría o superior la ven en /subastas/abiertas.
     */
    @Transactional
    public void armarSubasta(ArmarSubastaRequest req) {
        CategoriaSubasta categoria;
        try {
            categoria = CategoriaSubasta.valueOf(req.categoria().toLowerCase().trim());
        } catch (IllegalArgumentException e) {
            throw new com.subastas.exception.BusinessException("Categoría inválida: " + req.categoria());
        }

        CategoriaCliente nivel;
        try {
            nivel = CategoriaCliente.valueOf(req.nivel().toLowerCase().trim());
        } catch (IllegalArgumentException e) {
            throw new com.subastas.exception.BusinessException("Nivel inválido: " + req.nivel());
        }

        List<Producto> listos = productoRepository.findAllById(req.itemIds()).stream()
                .filter(p -> "aceptado_por_usuario".equals(p.getDisponible()) && p.getSeguro() != null)
                .toList();
        if (listos.isEmpty()) {
            throw new com.subastas.exception.BusinessException(
                    "Ninguno de los ítems seleccionados está listo (deben estar aceptados por el vendedor y asegurados)");
        }

        Subasta subasta = new Subasta();
        subasta.setTitulo(req.titulo() != null && !req.titulo().isBlank() ? req.titulo() : "Subasta " + categoria.name());
        subasta.setCategoria(categoria);
        subasta.setNivel(nivel);
        subasta.setEstado(EstadoSubasta.abierta);
        subasta.setFecha(java.time.LocalDate.now().plusDays(Math.max(1, req.dias())));
        subasta.setHora(java.time.LocalTime.now());
        if (req.fotoPortadaUrl() != null && !req.fotoPortadaUrl().isBlank()) {
            subasta.setFotoPortada(com.subastas.util.ImagenUtil.decodeFoto(req.fotoPortadaUrl()));
        }
        Subasta savedSubasta = subastaRepository.save(subasta);

        Catalogo catalogo = new Catalogo();
        catalogo.setSubasta(savedSubasta);
        Catalogo savedCatalogo = catalogoRepository.save(catalogo);

        for (Producto p : listos) {
            ItemCatalogo ic = new ItemCatalogo();
            ic.setCatalogo(savedCatalogo);
            ic.setProducto(p);
            ic.setPrecioBase(p.getPrecioBasePropuesto());
            ic.setComision(p.getComisionPropuesta());
            ic.setSubastado("no");
            itemCatalogoRepository.save(ic);

            p.setDisponible("incluido_en_subasta");
            productoRepository.save(p);
        }
        log.info("Subasta {} armada con {} ítems, dura {} días", savedSubasta.getId(), listos.size(), req.dias());
    }

    @Transactional
    public void contratarSeguro(Long articuloId) {
        Producto producto = productoRepository.findById(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        Seguro seguro = new Seguro();
        seguro.setNroPoliza("POL-" + articuloId + "-" + System.currentTimeMillis());
        seguro.setCompania("Aseguradora VIVO");
        seguro.setImporte(producto.getPrecioBasePropuesto() != null ? producto.getPrecioBasePropuesto() : BigDecimal.ZERO);
        seguro.setPolizaCombinada("no");
        // Usar la instancia gestionada que devuelve save(): con @Id String asignado, Spring Data
        // hace merge y la instancia original queda transitoria (referencia a unsaved transient instance).
        Seguro guardado = seguroRepository.save(seguro);
        producto.setSeguro(guardado);
        productoRepository.save(producto);
        log.info("Seguro contratado para articuloId={}", articuloId);
    }

    // =====================================================================
    // Items y Subastas
    // =====================================================================

    @Transactional
    public void cerrarItem(Long itemId) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));
        item.setSubastado("si");
        itemCatalogoRepository.save(item);
        // Marcar el producto como vendido
        if (item.getProducto() != null) {
            item.getProducto().setDisponible("vendido");
            productoRepository.save(item.getProducto());
        }
        log.info("Item cerrado: itemId={}", itemId);
    }

    @Transactional
    public void cerrarSubasta(Long subastaId) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new ResourceNotFoundException("Subasta", "id", subastaId));
        subasta.setEstado(EstadoSubasta.cerrada);
        subastaRepository.save(subasta);
        log.info("Subasta cerrada: subastaId={}", subastaId);
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private ArticuloUsuarioResponse toArticuloResponse(Producto producto) {
        List<Foto> fotos = fotoRepository.findByProductoId(producto.getId());
        List<String> fotosUrls = fotos.stream()
                .map(f -> "/v1/fotos/" + f.getId())
                .toList();
        String imagenUrl = fotosUrls.isEmpty() ? null : fotosUrls.get(0);

        String duenioNombre = producto.getDuenio() != null
                ? producto.getDuenio().getNombre() + " " + producto.getDuenio().getApellido()
                : null;

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
                fotosUrls,
                null // vista de empresa: la oferta actual no aplica acá
        );
    }
}
