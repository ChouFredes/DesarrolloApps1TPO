package com.subastas.repository;

import com.subastas.entity.Subastador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubastadorRepository extends JpaRepository<Subastador, Long> {

    Optional<Subastador> findByDocumento(String documento);

    Optional<Subastador> findByMatricula(String matricula);
}
