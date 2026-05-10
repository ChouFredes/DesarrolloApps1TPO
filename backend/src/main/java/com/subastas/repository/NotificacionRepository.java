package com.subastas.repository;

import com.subastas.entity.Notificacion;
import com.subastas.entity.enums.TipoNotificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByUsuarioIdOrderByFechaCreacionDesc(Long usuarioId);

    List<Notificacion> findByUsuarioIdAndLeidaOrderByFechaCreacionDesc(Long usuarioId, boolean leida);

    long countByUsuarioIdAndLeida(Long usuarioId, boolean leida);

    @Modifying
    @Query("UPDATE Notificacion n SET n.leida = true WHERE n.usuario.id = :usuarioId AND n.leida = false")
    int marcarTodasComoLeidas(@Param("usuarioId") Long usuarioId);

    List<Notificacion> findByUsuarioIdAndTipo(Long usuarioId, TipoNotificacion tipo);

    Optional<Notificacion> findByIdAndUsuarioId(Long id, Long usuarioId);
}
