package com.subastas.service;

import com.subastas.dto.response.ArticuloUsuarioResponse;
import com.subastas.dto.response.MedioPagoResponse;
import com.subastas.dto.response.VendedorPendienteResponse;
import com.subastas.entity.Duenio;
import com.subastas.entity.Foto;
import com.subastas.entity.ItemCatalogo;
import com.subastas.entity.MedioPago;
import com.subastas.entity.Producto;
import com.subastas.entity.Subasta;
import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.EstadoPersona;
import com.subastas.entity.enums.EstadoSubasta;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.DuenioRepository;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.MedioPagoRepository;
import com.subastas.repository.ProductoRepository;
import com.subastas.repository.SubastaRepository;
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
                        mp.getMontoCheque()
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
        return productoRepository.findByDisponible("pendiente_inspeccion").stream()
                .map(this::toArticuloResponse)
                .toList();
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
        productoRepository.findById(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        log.info("Depósito asignado para articuloId={}: {}", articuloId, deposito);
    }

    @Transactional
    public void contratarSeguro(Long articuloId) {
        productoRepository.findById(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
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
        String imagenUrl = fotos.isEmpty() ? null : "/v1/fotos/" + fotos.get(0).getId();

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
                null,
                imagenUrl,
                producto.getCategoria() != null ? producto.getCategoria().name() : null
        );
    }
}
