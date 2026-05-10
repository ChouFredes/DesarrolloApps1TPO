package com.subastas.repository;

import com.subastas.entity.Subasta;
import com.subastas.entity.enums.CategoriaSubasta;
import com.subastas.entity.enums.EstadoSubasta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SubastaRepository extends JpaRepository<Subasta, Long> {

    List<Subasta> findByEstado(EstadoSubasta estado);

    List<Subasta> findByFechaGreaterThanEqual(LocalDate fecha);

    List<Subasta> findBySubastadorId(Long subastadorId);

    @Query("SELECT s FROM Subasta s WHERE s.estado = 'abierta' AND s.categoria IN :categorias")
    List<Subasta> findAbiertasConCategoriasPermitidas(@Param("categorias") List<CategoriaSubasta> categorias);
}
