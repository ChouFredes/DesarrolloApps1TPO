package com.subastas.repository;

import com.subastas.entity.Foto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FotoRepository extends JpaRepository<Foto, Long> {

    List<Foto> findByProductoId(Long productoId);
}
