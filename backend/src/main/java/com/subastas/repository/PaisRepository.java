package com.subastas.repository;

import com.subastas.entity.Pais;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaisRepository extends JpaRepository<Pais, Long> {

    Optional<Pais> findByNombre(String nombre);
}
