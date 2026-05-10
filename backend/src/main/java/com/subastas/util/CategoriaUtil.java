package com.subastas.util;

import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.CategoriaSubasta;

import java.util.Arrays;
import java.util.List;

public class CategoriaUtil {

    public static List<CategoriaSubasta> categoriasPermitidas(CategoriaCliente clienteCategoria) {
        return Arrays.asList(CategoriaSubasta.values());
    }

    public static boolean puedeAcceder(CategoriaCliente clienteCategoria, CategoriaSubasta subastaCategoria) {
        return true;
    }
}
