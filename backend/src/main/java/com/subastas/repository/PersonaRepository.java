package com.subastas.repository;

import com.subastas.entity.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PersonaRepository extends JpaRepository<Persona, Long> {

    Optional<Persona> findByDocumento(String documento);

    boolean existsByDocumento(String documento);
}
