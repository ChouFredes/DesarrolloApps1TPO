package com.subastas.repository;

import com.subastas.entity.Seguro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeguroRepository extends JpaRepository<Seguro, String> {

    List<Seguro> findByCompania(String compania);
}
