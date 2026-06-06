package com.subastas.service;

import com.subastas.dto.response.ItemDetalleResponse;
import com.subastas.entity.Foto;
import com.subastas.entity.ItemCatalogo;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ItemCatalogoRepository;
import com.subastas.repository.PujoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemCatalogoRepository itemCatalogoRepository;
    private final FotoRepository fotoRepository;
    private final PujoRepository pujoRepository;

    @Transactional(readOnly = true)
    public ItemDetalleResponse obtenerDetalle(Long itemId) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));

        List<String> fotosUrls = buildFotosUrls(item.getProducto().getId());

        Long duenioId = item.getProducto().getDuenio() != null ? item.getProducto().getDuenio().getId() : null;

        java.math.BigDecimal mayorOfertaActual = pujoRepository.findMayorImporteByItemId(itemId).orElse(null);

        return new ItemDetalleResponse(
                item.getId(),
                item.getProducto().getId(),
                item.getProducto().getDescripcionCatalogo(),
                item.getProducto().getDescripcionCompleta(),
                item.getPrecioBase(),
                item.getComision(),
                item.getSubastado(),
                item.getProducto().getDisponible(),
                1,
                duenioId,
                fotosUrls,
                mayorOfertaActual
        );
    }

    @Transactional(readOnly = true)
    public List<String> obtenerFotosUrls(Long itemId) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));

        return buildFotosUrls(item.getProducto().getId());
    }

    private List<String> buildFotosUrls(Long productoId) {
        List<Foto> fotos = fotoRepository.findByProductoId(productoId);
        return fotos.stream()
                .map(f -> "/v1/fotos/" + f.getId())
                .toList();
    }
}
