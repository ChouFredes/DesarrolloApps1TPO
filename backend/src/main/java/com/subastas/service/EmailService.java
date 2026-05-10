package com.subastas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    // ---------------------------------------------------------------
    // Métodos públicos — uno por tipo de email transaccional
    // ---------------------------------------------------------------

    /**
     * Enviada al completar el paso 1 del registro.
     * Informa que la solicitud está en revisión.
     */
    @Async("emailTaskExecutor")
    public void enviarConfirmacionRegistro(String destinatario, String nombrePersona) {
        String subject = "Solicitud de registro recibida - Sistema de Subastas";
        String body = String.format(
                "Estimado/a %s,%n%n" +
                "Hemos recibido tu solicitud de registro en el Sistema de Subastas.%n%n" +
                "Nuestro equipo revisará tu información en un plazo de 24 a 48 horas hábiles.%n" +
                "Una vez aprobada tu cuenta, recibirás un correo con el código de activación " +
                "para completar tu registro.%n%n" +
                "Si tenés alguna consulta, no dudes en contactarnos.%n%n" +
                "Gracias por tu interés.%n%n" +
                "Saludos,%n" +
                "El equipo de Subastas",
                nombrePersona
        );
        enviar(destinatario, subject, body);
    }

    /**
     * Enviada cuando un administrador aprueba la cuenta (paso 2).
     * Incluye el token de activación para que el usuario cree su contraseña.
     */
    @Async("emailTaskExecutor")
    public void enviarActivacionCuenta(String destinatario, String nombrePersona, String tokenActivacion) {
        String subject = "Tu cuenta fue aprobada - Activá tu acceso";
        String body = String.format(
                "Estimado/a %s,%n%n" +
                "¡Buenas noticias! Tu cuenta en el Sistema de Subastas ha sido aprobada.%n%n" +
                "Para completar tu registro y crear tu contraseña, utilizá el siguiente " +
                "código de activación en la aplicación:%n%n" +
                "    Código de activación: %s%n%n" +
                "Instrucciones:%n" +
                "  1. Abrí la aplicación de Subastas.%n" +
                "  2. Seleccioná la opción 'Activar cuenta'.%n" +
                "  3. Ingresá el código de activación que figura arriba.%n" +
                "  4. Creá tu contraseña de acceso.%n%n" +
                "Este código tiene una validez de 24 horas. Si expira, contactate con " +
                "nuestro equipo para solicitar uno nuevo.%n%n" +
                "Saludos,%n" +
                "El equipo de Subastas",
                nombrePersona, tokenActivacion
        );
        enviar(destinatario, subject, body);
    }

    /**
     * Enviada al finalizar una subasta, tanto al ganador como al resto de participantes.
     *
     * @param gano {@code true} si el destinatario ganó la subasta.
     */
    @Async("emailTaskExecutor")
    public void enviarResultadoSubasta(String destinatario, String nombrePersona,
                                       String descripcionItem, BigDecimal importe, boolean gano) {
        String subject;
        String body;

        if (gano) {
            subject = "¡Felicitaciones! Ganaste la subasta";
            body = String.format(
                    "Estimado/a %s,%n%n" +
                    "¡Felicitaciones! Eres el ganador de la subasta del siguiente artículo:%n%n" +
                    "    Artículo : %s%n" +
                    "    Importe  : $%s%n%n" +
                    "En breve nos comunicaremos con vos para coordinar el pago y la entrega " +
                    "del artículo.%n%n" +
                    "Gracias por participar en nuestra subasta.%n%n" +
                    "Saludos,%n" +
                    "El equipo de Subastas",
                    nombrePersona, descripcionItem, importe.toPlainString()
            );
        } else {
            subject = "Resultado de la subasta - Sistema de Subastas";
            body = String.format(
                    "Estimado/a %s,%n%n" +
                    "La subasta del siguiente artículo ha finalizado:%n%n" +
                    "    Artículo        : %s%n" +
                    "    Oferta más alta : $%s%n%n" +
                    "En esta oportunidad tu oferta no resultó ganadora. " +
                    "Te invitamos a seguir participando en nuestras próximas subastas.%n%n" +
                    "Gracias por tu participación.%n%n" +
                    "Saludos,%n" +
                    "El equipo de Subastas",
                    nombrePersona, descripcionItem, importe.toPlainString()
            );
        }

        enviar(destinatario, subject, body);
    }

    /**
     * Enviada al vendedor cuando su artículo es aceptado para subasta.
     */
    @Async("emailTaskExecutor")
    public void enviarArticuloAceptado(String destinatario, String nombrePersona,
                                       String descripcionArticulo, BigDecimal precioBase) {
        String subject = "Tu artículo fue aceptado para subasta";
        String body = String.format(
                "Estimado/a %s,%n%n" +
                "Nos complace informarte que tu artículo ha sido aceptado para participar " +
                "en nuestra subasta.%n%n" +
                "    Artículo   : %s%n" +
                "    Precio base: $%s%n%n" +
                "Tu artículo será publicado próximamente. Te notificaremos cuando la " +
                "subasta esté activa y al finalizar con el resultado.%n%n" +
                "Gracias por confiar en el Sistema de Subastas.%n%n" +
                "Saludos,%n" +
                "El equipo de Subastas",
                nombrePersona, descripcionArticulo, precioBase.toPlainString()
        );
        enviar(destinatario, subject, body);
    }

    /**
     * Enviada al vendedor cuando su artículo es rechazado, con el motivo.
     */
    @Async("emailTaskExecutor")
    public void enviarArticuloRechazado(String destinatario, String nombrePersona,
                                        String descripcionArticulo, String motivo) {
        String subject = "Tu artículo no pudo ser aceptado";
        String body = String.format(
                "Estimado/a %s,%n%n" +
                "Luego de revisar tu artículo, lamentablemente no podemos incluirlo " +
                "en nuestra subasta en este momento.%n%n" +
                "    Artículo: %s%n" +
                "    Motivo  : %s%n%n" +
                "Si considerás que hubo un error o querés más información, no dudes en " +
                "comunicarte con nuestro equipo.%n%n" +
                "Gracias por tu comprensión.%n%n" +
                "Saludos,%n" +
                "El equipo de Subastas",
                nombrePersona, descripcionArticulo, motivo
        );
        enviar(destinatario, subject, body);
    }

    // ---------------------------------------------------------------
    // Helper privado — nunca lanza excepciones al caller
    // ---------------------------------------------------------------

    private void enviar(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email enviado a {} - Asunto: {}", to, subject);
        } catch (Exception e) {
            // Los fallos de email no deben interrumpir el flujo principal
            log.error("Error enviando email a {} (asunto: '{}'): {}", to, subject, e.getMessage());
        }
    }
}
