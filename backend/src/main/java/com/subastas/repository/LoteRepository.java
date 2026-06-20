package com.subastas.repository;

import com.subastas.entity.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoteRepository extends JpaRepository<Lote, Long> {

    List<Lote> findByDuenioId(Long duenioId);
}
