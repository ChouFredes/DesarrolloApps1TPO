package com.subastas.service;

import com.subastas.dto.response.ItemCatalogoResponse;
import com.subastas.dto.response.PujaHistorialResponse;
import com.subastas.dto.response.SubastaDetalleResponse;
import com.subastas.dto.response.SubastaResponse;
import com.subastas.entity.Cliente;
import com.subastas.entity.Foto;
import com.subastas.entity.ItemCatalogo;
import com.subastas.entity.Pujo;
import com.subastas.entity.Subasta;
import com.subastas.entity.enums.CategoriaSubasta;
import com.subastas.exception.ForbiddenException;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.AsistenteRepository;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.PujoRepository;
import com.subastas.repository.SubastaRepository;
import com.subastas.util.CategoriaUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SubastaService {

    private final SubastaRepository subastaRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final FotoRepository fotoRepository;
    private final PujoRepository pujoRepository;
    private final ClienteRepository clienteRepository;
    private final AsistenteRepository asistenteRepository;

    @Transactional(readOnly = true)
    public List<SubastaResponse> obtenerAbiertasParaCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", clienteId));

        List<CategoriaSubasta> categoriasPermitidas = CategoriaUtil.categoriasPermitidas(cliente.getCategoria());
        List<Subasta> subastas = subastaRepository.findAbiertasConCategoriasPermitidas(categoriasPermitidas);

        List<Long> ids = subastas.stream().map(Subasta::getId).toList();
        Map<Long, Long> countPorSubasta = itemCatalogoRepository.countBySubastaIds(ids);

        return subastas.stream()
                .map(s -> new SubastaResponse(
                        s.getId(),
                        tituloFor(s.getCategoria()),
                        s.getCategoria() != null ? s.getCategoria().name() : null,
                        s.getUbicacion(),
                        fechaFinIso(s),
                        countPorSubasta.getOrDefault(s.getId(), 0L).intValue(),
                        imagenFor(s.getCategoria())
                ))
                .toList();
    }

    private String tituloFor(CategoriaSubasta cat) {
        if (cat == null) return "Subasta";
        return switch (cat) {
            case pokemon           -> "Subasta de Pokémon";
            case maquinas_tecnicas -> "Subasta de Máquinas Técnicas";
            case pociones          -> "Subasta de Pociones";
            default                -> "Subasta — " + cat.name();
        };
    }

    private String imagenFor(CategoriaSubasta cat) {
        if (cat == null) return null;
        return switch (cat) {
            case pokemon           -> "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png";
            case maquinas_tecnicas -> "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png";
            case pociones          -> "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png";
            default                -> null;
        };
    }

    private String fechaFinIso(Subasta s) {
        if (s.getFecha() == null) return null;
        String hora = s.getHora() != null ? s.getHora().toString() : "23:59:00";
        return s.getFecha() + "T" + hora;
    }

    @Transactional(readOnly = true)
    public SubastaDetalleResponse obtenerDetalle(Long subastaId, Long clienteId) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new ResourceNotFoundException("Subasta", "id", subastaId));

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", clienteId));

        if (subasta.getCategoria() != null && !CategoriaUtil.puedeAcceder(cliente.getCategoria(), subasta.getCategoria())) {
            throw new ForbiddenException("No tenés acceso a esta subasta");
        }

        String nombreSubastador = null;
        String matriculaSubastador = null;
        if (subasta.getSubastador() != null) {
            nombreSubastador = subasta.getSubastador().getNombre() + " " + subasta.getSubastador().getApellido();
            matriculaSubastador = subasta.getSubastador().getMatricula();
        }

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

        return new SubastaDetalleResponse(
                subasta.getId(),
                subasta.getFecha(),
                subasta.getHora() != null ? subasta.getHora().toString() : null,
                subasta.getEstado() != null ? subasta.getEstado().name() : null,
                subasta.getCategoria() != null ? subasta.getCategoria().name() : null,
                subasta.getUbicacion(),
                nombreSubastador,
                matriculaSubastador,
                subasta.getTieneDeposito(),
                subasta.getSeguridadPropia(),
                subasta.getCapacidadAsistentes(),
                itemActualResponse,
                mayorOfertaActual
        );
    }

    @Transactional(readOnly = true)
    public List<ItemCatalogoResponse> obtenerCatalogo(Long subastaId) {
        subastaRepository.findById(subastaId)
                .orElseThrow(() -> new ResourceNotFoundException("Subasta", "id", subastaId));

        List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoSubastaId(subastaId);

        return items.stream()
                .map(item -> new ItemCatalogoResponse(
                        item.getId(),
                        item.getProducto().getId(),
                        item.getProducto().getDescripcionCatalogo(),
                        item.getPrecioBase(),
                        item.getComision(),
                        item.getSubastado(),
                        buildFotosUrls(item.getProducto().getId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PujaHistorialResponse> obtenerPujas(Long subastaId, Long itemId) {
        subastaRepository.findById(subastaId)
                .orElseThrow(() -> new ResourceNotFoundException("Subasta", "id", subastaId));

        List<Pujo> pujos;
        if (itemId != null) {
            pujos = pujoRepository.findByAsistenteSubastaIdAndItemIdOrderByTimestampDesc(subastaId, itemId);
        } else {
            List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoSubastaId(subastaId);
            pujos = new ArrayList<>();
            for (ItemCatalogo item : items) {
                pujos.addAll(pujoRepository.findByItemIdOrderByTimestampDesc(item.getId()));
            }
        }

        return pujos.stream()
                .map(p -> new PujaHistorialResponse(
                        p.getId(),
                        p.getAsistente().getId(),
                        p.getAsistente().getNumeroPostor(),
                        p.getImporte(),
                        p.getGanador(),
                        p.getTimestamp()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubastaResponse> obtenerParticipaciones(Long clienteId) {
        List<Subasta> subastas = asistenteRepository.findByClienteId(clienteId).stream()
                .map(a -> a.getSubasta())
                .toList();
        List<Long> ids = subastas.stream().map(Subasta::getId).toList();
        Map<Long, Long> counts = itemCatalogoRepository.countBySubastaIds(ids);
        return subastas.stream()
                .map(s -> new SubastaResponse(
                        s.getId(),
                        tituloFor(s.getCategoria()),
                        s.getCategoria() != null ? s.getCategoria().name() : null,
                        s.getUbicacion(),
                        fechaFinIso(s),
                        counts.getOrDefault(s.getId(), 0L).intValue(),
                        imagenFor(s.getCategoria())
                ))
                .toList();
    }

    private List<String> buildFotosUrls(Long productoId) {
        List<Foto> fotos = fotoRepository.findByProductoId(productoId);
        return fotos.stream()
                .map(f -> "/v1/fotos/" + f.getId())
                .toList();
    }
}
