package com.subastas.websocket;

import com.subastas.dto.request.PujaWebSocketRequest;
import com.subastas.dto.response.PujaBroadcastMessage;
import com.subastas.exception.BusinessException;
import com.subastas.service.PujaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class PujaWebSocketHandler {

    private final PujaService pujaService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/auctions/{subastaId}/bid")
    public void handleBid(
            @DestinationVariable Long subastaId,
            @Payload PujaWebSocketRequest request,
            Principal principal) {

        Long clienteId = Long.parseLong(principal.getName());
        log.debug("Puja recibida: subastaId={}, clienteId={}, itemId={}, importe={}",
                subastaId, clienteId, request.itemId(), request.importe());

        try {
            PujaBroadcastMessage broadcast = pujaService.realizarPuja(subastaId, clienteId, request);

            messagingTemplate.convertAndSend(
                    "/topic/auctions/" + subastaId + "/bids",
                    broadcast
            );

            log.info("Puja procesada y difundida: subastaId={}, itemId={}, pujaId={}, numeroPostor={}",
                    subastaId, request.itemId(), broadcast.pujaId(), broadcast.numeroPostor());

        } catch (BusinessException ex) {
            log.warn("Puja rechazada para clienteId={}: {}", clienteId, ex.getMessage());
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    ex.getMessage()
            );
        }
    }
}
