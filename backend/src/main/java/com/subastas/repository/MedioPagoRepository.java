package com.subastas.repository;

import com.subastas.entity.MedioPago;
import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.TipoMedioPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedioPagoRepository extends JpaRepository<MedioPago, Long> {

    List<MedioPago> findByPersonaId(Long personaId);

    Optional<MedioPago> findByIdAndPersonaId(Long id, Long personaId);

    List<MedioPago> findByPersonaIdAndEstado(Long personaId, EstadoMedioPago estado);

    List<MedioPago> findByEstado(EstadoMedioPago estado);

    List<MedioPago> findByPersonaIdAndTipo(Long personaId, TipoMedioPago tipo);

    boolean existsByPersonaIdAndEstado(Long personaId, EstadoMedioPago estado);
}
