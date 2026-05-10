package com.subastas.repository;

import com.subastas.entity.RegistroDeSubasta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroDeSubastaRepository extends JpaRepository<RegistroDeSubasta, Long> {

    List<RegistroDeSubasta> findBySubastaId(Long subastaId);

    List<RegistroDeSubasta> findByClienteId(Long clienteId);

    List<RegistroDeSubasta> findByDuenioId(Long duenioId);

    @Query("SELECT COALESCE(SUM(r.importe), 0) FROM RegistroDeSubasta r WHERE r.cliente.id = :clienteId")
    Optional<BigDecimal> sumImporteByClienteId(@Param("clienteId") Long clienteId);

    Optional<RegistroDeSubasta> findByIdAndClienteId(Long id, Long clienteId);
}
