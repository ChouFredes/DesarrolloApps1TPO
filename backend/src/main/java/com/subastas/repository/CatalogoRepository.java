package com.subastas.repository;

import com.subastas.entity.Catalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CatalogoRepository extends JpaRepository<Catalogo, Long> {

    Optional<Catalogo> findBySubastaId(Long subastaId);
}
