package com.subastas.service;

import com.subastas.dto.response.ConexionSubastaResponse;
import com.subastas.dto.response.ItemCatalogoResponse;
import com.subastas.entity.Asistente;
import com.subastas.entity.Cliente;
import com.subastas.entity.Foto;
import com.subastas.entity.ItemCatalogo;
import com.subastas.entity.Subasta;
import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.EstadoSubasta;
import com.subastas.exception.BusinessException;
import com.subastas.exception.ForbiddenException;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.AsistenteRepository;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.MedioPagoRepository;
import com.subastas.repository.PujoRepository;
import com.subastas.repository.SubastaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConexionService {

    private final AsistenteRepository asistenteRepository;
    private final SubastaRepository subastaRepository;
    private final ClienteRepository clienteRepository;
    private final MedioPagoRepository medioPagoRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final PujoRepository pujoRepository;
    private final FotoRepository fotoRepository;

    @Transactional
    public ConexionSubastaResponse conectar(Long subastaId, Long clienteId) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new ResourceNotFoundException("Subasta", "id", subastaId));

        if (subasta.getEstado() != EstadoSubasta.abierta) {
            throw new ResourceNotFoundException("Subasta abierta", "id", subastaId);
        }

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", clienteId));

        if (!medioPagoRepository.existsByClienteIdAndEstado(clienteId, EstadoMedioPago.VERIFICADO)) {
            throw new ForbiddenException("Sin medios de pago verificados");
        }

        if (asistenteRepository.existsByClienteIdAndSubastaEstado(clienteId, EstadoSubasta.abierta)
                && asistenteRepository.findByClienteIdAndSubastaId(clienteId, subastaId).isEmpty()) {
            throw new BusinessException("Ya está conectado a otra subasta");
        }

        Asistente asistente = asistenteRepository.findByClienteIdAndSubastaId(clienteId, subastaId)
                .orElseGet(() -> {
                    Asistente nuevo = new Asistente();
                    nuevo.setCliente(cliente);
                    nuevo.setSubasta(subasta);
                    int count = asistenteRepository.countBySubastaId(subastaId);
                    nuevo.setNumeroPostor(count + 1);
                    Asistente guardado = asistenteRepository.save(nuevo);
                    log.info("Nuevo asistente registrado: clienteId={}, subastaId={}, numeroPostor={}",
                            clienteId, subastaId, guardado.getNumeroPostor());
                    return guardado;
                });

        Optional<ItemCatalogo> itemActualOpt = itemCatalogoRepository
                .findFirstByCatalogoSubastaIdAndSubastado(subastaId, "no");

        ItemCatalogoResponse itemActualResponse = null;
        BigDecimal mayorOfertaActual = null;

        if (itemActualOpt.isPresent()) {
            ItemCatalogo item = itemActualOpt.get();
            List<String> fotosUrls = buildFotosUrls(item.getProducto().getId());
            itemActualResponse = new ItemCatalogoResponse(
                    item.getId(),
                    item.getProducto().getId(),
                    item.getProducto().getDescripcionCatalogo(),
                    item.getPrecioBase(),
                    item.getComision(),
                    item.getSubastado(),
                    fotosUrls
            );
            mayorOfertaActual = pujoRepository.findMayorImporteByItemId(item.getId()).orElse(null);
        }

        return new ConexionSubastaResponse(
                subastaId,
                asistente.getId(),
                asistente.getNumeroPostor(),
                itemActualResponse,
                mayorOfertaActual,
                true
        );
    }

    @Transactional
    public void desconectar(Long subastaId, Long clienteId) {
        Asistente asistente = asistenteRepository.findByClienteIdAndSubastaId(clienteId, subastaId)
                .orElseThrow(() -> new ResourceNotFoundException("Asistente", "clienteId+subastaId",
                        clienteId + "+" + subastaId));

        log.info("Desconexión de subasta: asistenteId={}, clienteId={}, subastaId={}",
                asistente.getId(), clienteId, subastaId);
    }

    private List<String> buildFotosUrls(Long productoId) {
        List<Foto> fotos = fotoRepository.findByProductoId(productoId);
        return fotos.stream()
                .map(f -> "/v1/fotos/" + f.getId())
                .toList();
    }
}
