package com.subastas.repository;

import com.subastas.entity.Multa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MultaRepository extends JpaRepository<Multa, Long> {
    List<Multa> findByClienteId(Long clienteId);
    boolean existsByClienteIdAndEstado(Long clienteId, String estado);
}
