-- =============================================================
-- VIVO SUBASTAS — Setup inicial (ejecutar UNA SOLA VEZ)
-- MySQL 8+  |  usuario: root  |  password: root
--
-- Solo crea la base de datos.
-- Los datos se cargan automáticamente al arrancar el backend
-- a través de data.sql (spring.sql.init.mode=always).
-- =============================================================

CREATE DATABASE IF NOT EXISTS SubastasDB
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Comando para ejecutar desde terminal:
-- mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS SubastasDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
