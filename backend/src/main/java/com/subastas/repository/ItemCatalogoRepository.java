package com.subastas.repository;

import com.subastas.entity.ItemCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemCatalogoRepository extends JpaRepository<ItemCatalogo, Long> {

    List<ItemCatalogo> findByCatalogoId(Long catalogoId);

    List<ItemCatalogo> findBySubastado(String subastado);

    List<ItemCatalogo> findByProductoId(Long productoId);

    Optional<ItemCatalogo> findFirstByProductoId(Long productoId);

    List<ItemCatalogo> findByCatalogoSubastaId(Long subastaId);

    Optional<ItemCatalogo> findFirstByCatalogoSubastaIdAndSubastado(Long subastaId, String subastado);
}
