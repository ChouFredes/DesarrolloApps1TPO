package com.subastas.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Utilidades para convertir fotos recibidas como string (data URI base64,
 * base64 plano o URL) a bytes para persistir en la tabla fotos.
 */
public class ImagenUtil {

    private ImagenUtil() {
    }

    public static byte[] decodeFoto(String valor) {
        if (valor == null) {
            return new byte[0];
        }
        String contenido = valor.trim();

        // data URI: "data:image/jpeg;base64,...."
        if (contenido.startsWith("data:")) {
            int coma = contenido.indexOf(',');
            if (coma >= 0) {
                contenido = contenido.substring(coma + 1);
            }
            try {
                return Base64.getDecoder().decode(contenido);
            } catch (IllegalArgumentException e) {
                return contenido.getBytes(StandardCharsets.UTF_8);
            }
        }

        // base64 plano (heurística: largo y sin esquema de URL)
        if (contenido.length() > 200 && !contenido.contains("://")) {
            try {
                return Base64.getDecoder().decode(contenido);
            } catch (IllegalArgumentException ignored) {
                // no era base64, cae al caso URL
            }
        }

        // URL u otro texto: se guarda tal cual (compatibilidad con flujo previo)
        return contenido.getBytes(StandardCharsets.UTF_8);
    }
}
