package com.subastas.service;

import com.subastas.dto.response.VendedorPendienteResponse;
import com.subastas.entity.Duenio;
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
    private final ExpoNotificationService expoNotificationService;

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
                    "Tu cuenta ha sido aprobada y ya podés participar en las subastas."
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

    @Transactional
    public void verificarMedioPago(Long medioPagoId) {
        MedioPago mp = medioPagoRepository.findById(medioPagoId)
                .orElseThrow(() -> new ResourceNotFoundException("MedioPago", "id", medioPagoId));
        mp.setEstado(EstadoMedioPago.VERIFICADO);
        medioPagoRepository.save(mp);
        log.info("Medio de pago verificado: medioPagoId={}", medioPagoId);
    }

    @Transactional
    public void aceptarArticulo(Long articuloId) {
        Producto producto = productoRepository.findById(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        producto.setDisponible("aceptado");
        productoRepository.save(producto);
        log.info("Artículo aceptado: articuloId={}", articuloId);
    }

    @Transactional
    public void rechazarArticulo(Long articuloId, String motivo) {
        Producto producto = productoRepository.findById(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("Artículo", "id", articuloId));
        producto.setDisponible("rechazado");
        productoRepository.save(producto);
        log.info("Artículo rechazado: articuloId={}, motivo={}", articuloId, motivo);
    }

    @Transactional
    public void proponerPrecioBase(Long articuloId, BigDecimal precioBase, BigDecimal comision) {
        ItemCatalogo item = itemCatalogoRepository.findFirstByProductoId(articuloId)
                .orElseThrow(() -> new ResourceNotFoundException("ItemCatalogo para artículo", "id", articuloId));
        item.setPrecioBase(precioBase);
        item.setComision(comision);
        itemCatalogoRepository.save(item);
        log.info("Precio base propuesto para articuloId={}: precioBase={}, comision={}", articuloId, precioBase, comision);
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

    @Transactional
    public void cerrarItem(Long itemId) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));
        item.setSubastado("si");
        itemCatalogoRepository.save(item);
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
}
