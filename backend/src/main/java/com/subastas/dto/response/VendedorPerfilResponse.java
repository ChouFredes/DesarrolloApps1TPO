package com.subastas.dto.response;

import java.util.List;

public record VendedorPerfilResponse(
        Long id,
        String nombre,
        String apellido,
        String admitido,
        String categoria,
        List<String> categoriasPermitidas,
        String fotoAcreditacionUrl
) {}
