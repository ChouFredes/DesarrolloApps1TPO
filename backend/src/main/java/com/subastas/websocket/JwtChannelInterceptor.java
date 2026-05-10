package com.subastas.websocket;

import com.subastas.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WebSocket CONNECT sin token JWT");
            throw new MessageDeliveryException("Token JWT requerido");
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.isTokenValid(token)) {
            log.warn("WebSocket CONNECT con token JWT inválido");
            throw new MessageDeliveryException("Token JWT inválido o expirado");
        }

        Long userId = jwtUtil.extractUserId(token);
        log.debug("WebSocket CONNECT autenticado para userId={}", userId);

        accessor.setUser(new Principal() {
            @Override
            public String getName() {
                return userId.toString();
            }
        });

        return message;
    }
}
