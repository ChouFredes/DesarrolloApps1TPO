package com.subastas.security;

import com.subastas.entity.Cliente;
import com.subastas.entity.Persona;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration}")
    private long accessExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshExpiration;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateAccessToken(Persona persona) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("documento", persona.getDocumento());
        if (persona instanceof Cliente cliente) {
            claims.put("categoria", cliente.getCategoria().name());
        }
        return Jwts.builder()
                .claims(claims)
                .subject(persona.getId().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpiration))
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    public String generateRefreshToken(Long usuarioId) {
        return Jwts.builder()
                .subject(usuarioId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    public Long extractUserId(String token) {
        String subject = parseClaims(token).getSubject();
        return Long.parseLong(subject);
    }

    public String extractDocumento(String token) {
        return parseClaims(token).get("documento", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
