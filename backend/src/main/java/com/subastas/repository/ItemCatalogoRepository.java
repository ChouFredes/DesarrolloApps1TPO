package com.subastas.repository;

import com.subastas.entity.ItemCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public interface ItemCatalogoRepository extends JpaRepository<ItemCatalogo, Long> {

    List<ItemCatalogo> findByCatalogoId(Long catalogoId);

    List<ItemCatalogo> findBySubastado(String subastado);

    List<ItemCatalogo> findByProductoId(Long productoId);

    Optional<ItemCatalogo> findFirstByProductoId(Long productoId);

    List<ItemCatalogo> findByCatalogoSubastaId(Long subastaId);

    Optional<ItemCatalogo> findFirstByCatalogoSubastaIdAndSubastado(Long subastaId, String subastado);

    @Query("SELECT ic.catalogo.subasta.id, COUNT(ic) FROM ItemCatalogo ic WHERE ic.catalogo.subasta.id IN :ids GROUP BY ic.catalogo.subasta.id")
    List<Object[]> countRawBySubastaIds(List<Long> ids);

    default Map<Long, Long> countBySubastaIds(List<Long> ids) {
        return countRawBySubastaIds(ids).stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
    }
}
