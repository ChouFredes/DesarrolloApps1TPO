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

    List<MedioPago> findByClienteId(Long clienteId);

    Optional<MedioPago> findByIdAndClienteId(Long id, Long clienteId);

    List<MedioPago> findByClienteIdAndEstado(Long clienteId, EstadoMedioPago estado);

    List<MedioPago> findByEstado(EstadoMedioPago estado);

    List<MedioPago> findByClienteIdAndTipo(Long clienteId, TipoMedioPago tipo);

    boolean existsByClienteIdAndEstado(Long clienteId, EstadoMedioPago estado);
}
