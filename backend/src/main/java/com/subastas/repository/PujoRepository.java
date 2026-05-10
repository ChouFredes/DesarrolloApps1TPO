package com.subastas.repository;

import com.subastas.entity.Pujo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PujoRepository extends JpaRepository<Pujo, Long> {

    List<Pujo> findByItemIdOrderByImporteDesc(Long itemId);

    List<Pujo> findByAsistenteId(Long asistenteId);

    Optional<Pujo> findByItemIdAndGanador(Long itemId, String ganador);

    List<Pujo> findByItemIdAndGanadorOrderByTimestampDesc(Long itemId, String ganador);

    int countByAsistenteClienteId(Long clienteId);

    int countByAsistenteClienteIdAndGanador(Long clienteId, String ganador);

    @Query("SELECT COALESCE(SUM(p.importe), 0) FROM Pujo p WHERE p.asistente.cliente.id = :clienteId")
    Optional<BigDecimal> sumImporteByAsistenteClienteId(@Param("clienteId") Long clienteId);

    List<Pujo> findByItemIdOrderByTimestampDesc(Long itemId);

    List<Pujo> findByAsistenteSubastaIdAndItemIdOrderByTimestampDesc(Long subastaId, Long itemId);

    @Query("SELECT MAX(p.importe) FROM Pujo p WHERE p.item.id = :itemId")
    Optional<BigDecimal> findMayorImporteByItemId(@Param("itemId") Long itemId);

    @Query("SELECT COUNT(p) > 0 FROM Pujo p WHERE p.asistente.id = :asistenteId AND p.timestamp > :since")
    boolean existsBidInProgress(@Param("asistenteId") Long asistenteId, @Param("since") LocalDateTime since);

    List<Pujo> findByAsistenteClienteId(Long clienteId);
}
