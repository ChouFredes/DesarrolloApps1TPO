package com.subastas.service;

import com.subastas.dto.request.PujaRequest;
import com.subastas.dto.request.PujaWebSocketRequest;
import com.subastas.dto.response.PujaBroadcastMessage;
import com.subastas.dto.response.PujaResponse;
import com.subastas.entity.Asistente;
import com.subastas.entity.Cliente;
import com.subastas.entity.ItemCatalogo;
import com.subastas.entity.MedioPago;
import com.subastas.entity.Pujo;
import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.EstadoPersona;
import com.subastas.entity.enums.TipoMedioPago;
import com.subastas.entity.enums.TipoNotificacion;
import com.subastas.exception.BusinessException;
import com.subastas.exception.ConflictException;
import com.subastas.exception.ForbiddenException;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.AsistenteRepository;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.MedioPagoRepository;
import com.subastas.repository.PujoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PujaService {

    private final PujoRepository pujoRepository;
    private final AsistenteRepository asistenteRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final MedioPagoRepository medioPagoRepository;
    private final ClienteRepository clienteRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final NotificacionService notificacionService;

    @Transactional
    public PujaResponse realizarPujaRest(Long itemId, Long clienteId, PujaRequest request) {
        PujaSavedResult result = ejecutarPuja(itemId, clienteId, request.importe(), request.medioPagoId());

        PujaBroadcastMessage broadcast = new PujaBroadcastMessage(
                result.subastaId(), itemId, result.saved().getId(),
                result.asistente().getNumeroPostor(), result.saved().getImporte(),
                result.saved().getImporte(), result.saved().getTimestamp()
        );
        simpMessagingTemplate.convertAndSend("/topic/auctions/" + result.subastaId() + "/bids", broadcast);
        notificarSuperado(result.anteriorClienteId(), clienteId, result.saved().getImporte());

        return new PujaResponse(
                result.saved().getId(), result.asistente().getId(), itemId,
                result.saved().getImporte(), result.saved().getGanador(), result.saved().getTimestamp()
        );
    }

    @Transactional
    public PujaBroadcastMessage realizarPuja(Long subastaId, Long clienteId, PujaWebSocketRequest request) {
        PujaSavedResult result = ejecutarPuja(request.itemId(), clienteId, request.importe(), request.medioPagoId());

        PujaBroadcastMessage broadcast = new PujaBroadcastMessage(
                subastaId, request.itemId(), result.saved().getId(),
                result.asistente().getNumeroPostor(), result.saved().getImporte(),
                result.saved().getImporte(), result.saved().getTimestamp()
        );
        notificarSuperado(result.anteriorClienteId(), clienteId, result.saved().getImporte());
        return broadcast;
    }

    private void notificarSuperado(Long anteriorClienteId, Long nuevoClienteId, java.math.BigDecimal nuevoImporte) {
        if (anteriorClienteId == null || anteriorClienteId.equals(nuevoClienteId)) return;
        notificacionService.crearNotificacion(
                anteriorClienteId,
                TipoNotificacion.SUPERADO,
                "Fuiste superado en la puja",
                String.format("Tu oferta fue superada. Nueva oferta: $ %.2f", nuevoImporte)
        );
        simpMessagingTemplate.convertAndSendToUser(
                anteriorClienteId.toString(),
                "/queue/outbid",
                java.util.Map.of("mensaje", "Fuiste superado", "nuevoImporte", nuevoImporte)
        );
    }

    private PujaSavedResult ejecutarPuja(Long itemId, Long clienteId, BigDecimal importe, Long medioPagoId) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item no encontrado"));

        if ("si".equals(item.getSubastado())) {
            throw new BusinessException("Este ítem ya fue subastado");
        }

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        if (cliente.getEstado() != EstadoPersona.activo) {
            throw new ForbiddenException("USUARIO_SUSPENDIDO");
        }

        List<MedioPago> mediosVerificados = medioPagoRepository
                .findByClienteIdAndEstado(clienteId, EstadoMedioPago.VERIFICADO);
        if (mediosVerificados.isEmpty()) {
            throw new ForbiddenException("Sin medios de pago verificados");
        }

        MedioPago medioPago = medioPagoRepository
                .findByIdAndClienteId(medioPagoId, clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Medio de pago no encontrado"));
        if (medioPago.getEstado() != EstadoMedioPago.VERIFICADO) {
            throw new BusinessException("El medio de pago seleccionado no está verificado");
        }

        Long subastaId = item.getCatalogo().getSubasta().getId();
        Asistente asistente = asistenteRepository
                .findByClienteIdAndSubastaId(clienteId, subastaId)
                .orElseThrow(() -> new BusinessException("No está conectado a esta subasta"));

        LocalDateTime tenSecondsAgo = LocalDateTime.now().minusSeconds(10);
        if (pujoRepository.existsBidInProgress(asistente.getId(), tenSecondsAgo)) {
            throw new ConflictException("Hay una puja anterior siendo procesada. Esperá unos segundos.");
        }

        BigDecimal referencia = pujoRepository.findMayorImporteByItemId(itemId)
                .orElse(item.getPrecioBase());

        BigDecimal minimo = referencia.multiply(BigDecimal.valueOf(1.01));
        if (importe.compareTo(minimo) < 0) {
            throw new BusinessException(
                    String.format("La puja mínima es %.2f (1%% sobre la oferta actual)", minimo)
            );
        }

        CategoriaCliente cat = cliente.getCategoria();
        if (cat == CategoriaCliente.comun || cat == CategoriaCliente.especial || cat == CategoriaCliente.plata) {
            BigDecimal maximo = referencia.multiply(BigDecimal.valueOf(1.20));
            if (importe.compareTo(maximo) > 0) {
                throw new BusinessException(
                        String.format("La puja máxima es %.2f (20%% sobre la oferta actual)", maximo)
                );
            }
        }

        if (medioPago.getTipo() == TipoMedioPago.CHEQUE_CERTIFICADO) {
            BigDecimal yaGastado = pujoRepository.findByAsistenteClienteId(clienteId)
                    .stream()
                    .filter(p -> "si".equals(p.getGanador()))
                    .map(Pujo::getImporte)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal disponible = medioPago.getMontoCheque().subtract(yaGastado);
            if (importe.compareTo(disponible) > 0) {
                throw new BusinessException("Monto supera el disponible del cheque certificado");
            }
        }

        Long anteriorClienteId = pujoRepository.findByItemIdOrderByTimestampDesc(itemId).stream()
                .filter(p -> "si".equals(p.getGanador()))
                .findFirst()
                .map(p -> p.getAsistente().getCliente().getId())
                .orElse(null);

        pujoRepository.findByItemIdOrderByTimestampDesc(itemId).stream()
                .filter(p -> "si".equals(p.getGanador()))
                .forEach(p -> {
                    p.setGanador("no");
                    pujoRepository.save(p);
                });

        Pujo nuevaPuja = new Pujo();
        nuevaPuja.setAsistente(asistente);
        nuevaPuja.setItem(item);
        nuevaPuja.setImporte(importe);
        nuevaPuja.setGanador("si");
        nuevaPuja.setTimestamp(LocalDateTime.now());
        Pujo saved = pujoRepository.save(nuevaPuja);

        log.info("Puja registrada: cliente={}, item={}, importe={}", clienteId, itemId, saved.getImporte());

        return new PujaSavedResult(subastaId, asistente, saved, anteriorClienteId);
    }

    private record PujaSavedResult(Long subastaId, Asistente asistente, Pujo saved, Long anteriorClienteId) {}
}
