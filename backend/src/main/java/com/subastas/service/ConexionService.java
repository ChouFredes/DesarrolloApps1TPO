package com.subastas.service;

import com.subastas.dto.response.ConexionSubastaResponse;
import com.subastas.dto.response.ItemCatalogoResponse;
import com.subastas.dto.response.MedioPagoResponse;
import com.subastas.dto.response.PujaEnHistorialResponse;
import com.subastas.entity.Asistente;
import com.subastas.entity.Cliente;
import com.subastas.entity.Foto;
import com.subastas.entity.ItemCatalogo;
import com.subastas.entity.MedioPago;
import com.subastas.entity.Subasta;
import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.EstadoSubasta;
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
        return conectar(subastaId, clienteId, null);
    }

    @Transactional
    public ConexionSubastaResponse conectar(Long subastaId, Long clienteId, Long itemId) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new ResourceNotFoundException("Subasta", "id", subastaId));

        if (subasta.getEstado() != EstadoSubasta.abierta) {
            throw new ResourceNotFoundException("Subasta abierta", "id", subastaId);
        }

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", clienteId));

        if (subasta.getNivel() != null && !com.subastas.util.CategoriaUtil.puedeAccederNivel(cliente.getCategoria(), subasta.getNivel())) {
            throw new ForbiddenException("Lamentablemente esta subasta está por encima de tu categoría");
        }

        boolean tieneMedioPagoVerificado = medioPagoRepository.existsByPersonaIdAndEstado(clienteId, EstadoMedioPago.VERIFICADO);

        // ponytail: se quitó el guard "una subasta a la vez". `desconectar` no borra el asistente
        // (FK desde Pujo), así que el guard nunca se liberaba y bloqueaba entrar a cualquier otra
        // subasta con 422. El upsert de abajo ya maneja re-entrar a la misma subasta.

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

        Optional<ItemCatalogo> itemActualOpt;
        if (itemId != null) {
            itemActualOpt = itemCatalogoRepository.findById(itemId);
        } else {
            itemActualOpt = itemCatalogoRepository
                    .findFirstByCatalogoSubastaIdAndSubastado(subastaId, "no");
        }

        ItemCatalogoResponse itemActualResponse = null;
        BigDecimal mayorOfertaActual = null;
        BigDecimal pujaMinima = null;
        BigDecimal pujaMaxima = null;
        List<PujaEnHistorialResponse> historialPujas = List.of();

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

            BigDecimal base = item.getPrecioBase();
            BigDecimal mejorValor = mayorOfertaActual != null ? mayorOfertaActual : base;
            if (mejorValor != null) {
                BigDecimal unPorcientoBase = base.multiply(BigDecimal.valueOf(0.01));
                pujaMinima = mejorValor.add(unPorcientoBase);
                
                CategoriaCliente cat = cliente.getCategoria();
                if (cat != CategoriaCliente.oro && cat != CategoriaCliente.platino) {
                    BigDecimal veintePorcientoBase = base.multiply(BigDecimal.valueOf(0.20));
                    pujaMaxima = mejorValor.add(veintePorcientoBase);
                }
            }

            historialPujas = pujoRepository.findByItemIdOrderByTimestampDesc(item.getId())
                    .stream()
                    .map(p -> new PujaEnHistorialResponse(
                            p.getAsistente().getNumeroPostor(),
                            p.getImporte(),
                            p.getTimestamp()
                    ))
                    .toList();
        }

        MedioPagoResponse medioPagoSeleccionado = medioPagoRepository
                .findByPersonaIdAndEstado(clienteId, EstadoMedioPago.VERIFICADO)
                .stream()
                .findFirst()
                .map(mp -> new MedioPagoResponse(
                        mp.getId(),
                        mp.getTipo() != null ? mp.getTipo().name() : null,
                        null,
                        mp.getMoneda(),
                        mp.getEstado() != null ? mp.getEstado().name() : null,
                        mp.isEsBancaExterior(),
                        mp.getMontoCheque(),
                        mp.getNumeroCuenta(),
                        mp.getNumeroTarjeta()
                ))
                .orElse(null);

        return new ConexionSubastaResponse(
                subastaId,
                asistente.getId(),
                asistente.getNumeroPostor(),
                itemActualResponse,
                mayorOfertaActual,
                tieneMedioPagoVerificado,
                pujaMinima,
                pujaMaxima,
                null,
                historialPujas,
                medioPagoSeleccionado
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
