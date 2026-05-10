package com.subastas.repository;

import com.subastas.entity.TokenActivacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TokenActivacionRepository extends JpaRepository<TokenActivacion, Long> {

    Optional<TokenActivacion> findByToken(String token);

    Optional<TokenActivacion> findByTokenAndUsadoFalse(String token);

    void deleteByUsuarioId(Long usuarioId);
}
