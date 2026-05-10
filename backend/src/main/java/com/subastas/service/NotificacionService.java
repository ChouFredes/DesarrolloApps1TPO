package com.subastas.service;

import com.subastas.dto.response.NotificacionResponse;
import com.subastas.entity.Notificacion;
import com.subastas.entity.enums.TipoNotificacion;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.NotificacionRepository;
import com.subastas.repository.PersonaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final PersonaRepository personaRepository;

    @Transactional(readOnly = true)
    public List<NotificacionResponse> listar(Long usuarioId, Boolean leida) {
        log.debug("Listando notificaciones para usuarioId={}, leida={}", usuarioId, leida);
        List<Notificacion> notifs;
        if (leida != null) {
            notifs = notificacionRepository.findByUsuarioIdAndLeidaOrderByFechaCreacionDesc(usuarioId, leida);
        } else {
            notifs = notificacionRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId);
        }
        return notifs.stream()
                .map(n -> new NotificacionResponse(
                        n.getId(),
                        n.getTipo().name(),
                        n.getTitulo(),
                        n.getCuerpo(),
                        n.isLeida(),
                        n.getFechaCreacion()
                ))
                .toList();
    }

    @Transactional
    public NotificacionResponse marcarLeida(Long usuarioId, Long notificacionId) {
        log.debug("Marcando como leída notificacionId={} para usuarioId={}", notificacionId, usuarioId);
        Notificacion notif = notificacionRepository
                .findByIdAndUsuarioId(notificacionId, usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada"));
        notif.setLeida(true);
        Notificacion saved = notificacionRepository.save(notif);
        return new NotificacionResponse(
                saved.getId(),
                saved.getTipo().name(),
                saved.getTitulo(),
                saved.getCuerpo(),
                saved.isLeida(),
                saved.getFechaCreacion()
        );
    }

    @Transactional
    public void crearNotificacion(Long usuarioId, TipoNotificacion tipo, String titulo, String cuerpo) {
        log.debug("Creando notificación tipo={} para usuarioId={}", tipo, usuarioId);
        Notificacion n = new Notificacion();
        n.setUsuario(personaRepository.getReferenceById(usuarioId));
        n.setTipo(tipo);
        n.setTitulo(titulo);
        n.setCuerpo(cuerpo);
        n.setLeida(false);
        n.setFechaCreacion(LocalDateTime.now());
        notificacionRepository.save(n);
    }
}
