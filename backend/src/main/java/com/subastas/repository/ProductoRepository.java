package com.subastas.repository;

import com.subastas.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByDuenioId(Long duenioId);

    Optional<Producto> findByIdAndDuenioId(Long id, Long duenioId);

    List<Producto> findByDisponible(String disponible);
}
