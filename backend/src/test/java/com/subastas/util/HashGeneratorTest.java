package com.subastas.util;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class HashGeneratorTest {

    @Test
    void verificarYGenerarHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashActual = "$2b$12$OVbnxO1VJWW5TRtnPdoD2umpoSZsAq3NZtUubWrDMysl3wWTGmY/y";
        String password = "Pokeball1!";

        boolean coincide = encoder.matches(password, hashActual);
        System.out.println(">>> Hash actual coincide con 'Pokeball1!': " + coincide);

        if (!coincide) {
            String nuevoHash = encoder.encode(password);
            System.out.println(">>> Nuevo hash correcto para data.sql: " + nuevoHash);
        }
    }
}
