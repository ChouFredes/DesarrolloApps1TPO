package com.subastas.repository;

import com.subastas.entity.Duenio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DuenioRepository extends JpaRepository<Duenio, Long> {

    Optional<Duenio> findByDocumento(String documento);
}
