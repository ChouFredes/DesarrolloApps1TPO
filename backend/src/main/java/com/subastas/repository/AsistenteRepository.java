package com.subastas.repository;

import com.subastas.entity.Asistente;
import com.subastas.entity.enums.EstadoSubasta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AsistenteRepository extends JpaRepository<Asistente, Long> {

    List<Asistente> findBySubastaId(Long subastaId);

    List<Asistente> findByClienteId(Long clienteId);

    Optional<Asistente> findByClienteIdAndSubastaId(Long clienteId, Long subastaId);

    boolean existsByClienteIdAndSubastaId(Long clienteId, Long subastaId);

    int countByClienteId(Long clienteId);

    boolean existsByClienteIdAndSubastaEstado(Long clienteId, EstadoSubasta estado);

    int countBySubastaId(Long subastaId);
}
