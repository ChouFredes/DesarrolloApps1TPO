package com.subastas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class ExpoNotificationService {

    private final RestTemplate restTemplate = new RestTemplate();

    public void enviarNotificacion(String expoPushToken, String titulo, String cuerpo) {
        if (expoPushToken == null || expoPushToken.isBlank()) {
            return;
        }

        log.info("Enviando notificación push a token={}: [{}] - {}", expoPushToken, titulo, cuerpo);

        try {
            String url = "https://exp.host/--/api/v2/push/send";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("to", expoPushToken);
            body.put("title", titulo);
            body.put("body", cuerpo);
            body.put("sound", "default");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForObject(url, request, String.class);
            
            log.info("Notificación push enviada con éxito");
        } catch (Exception e) {
            log.error("Error al enviar notificación push a Expo", e);
        }
    }
}
