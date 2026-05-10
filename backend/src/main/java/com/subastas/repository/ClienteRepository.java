package com.subastas.repository;

import com.subastas.entity.Cliente;
import com.subastas.entity.enums.CategoriaCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByDocumento(String documento);

    boolean existsByDocumento(String documento);

    List<Cliente> findByCategoria(CategoriaCliente categoria);

    List<Cliente> findByAdmitido(String admitido);
}
