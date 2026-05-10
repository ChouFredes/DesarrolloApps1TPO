package com.subastas.repository;

import com.subastas.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByTokenAndInvalidadoFalse(String token);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.invalidado = true WHERE rt.usuario.id = :usuarioId")
    int invalidarTodosDelUsuario(@Param("usuarioId") Long usuarioId);
}
