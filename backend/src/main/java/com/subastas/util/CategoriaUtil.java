package com.subastas.util;

import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.CategoriaSubasta;

import java.util.Arrays;
import java.util.List;

public class CategoriaUtil {

    private static int getClientLevel(CategoriaCliente clientCat) {
        if (clientCat == null) return 0;
        return switch (clientCat) {
            case comun -> 0;
            case especial -> 1;
            case plata -> 2;
            case oro -> 3;
            case platino -> 4;
        };
    }

    private static int getSubastaLevel(CategoriaSubasta subastaCat) {
        if (subastaCat == null) return 0;
        return switch (subastaCat) {
            case pociones, otros -> 0;
            case maquinas_tecnicas -> 1;
            case pokemon -> 2;
            case electronica, vehiculos -> 3;
            case arte, antiguedades, joyas, inmuebles -> 4;
        };
    }

    public static List<CategoriaSubasta> categoriasPermitidas(CategoriaCliente clienteCategoria) {
        int userLevel = getClientLevel(clienteCategoria);
        return Arrays.stream(CategoriaSubasta.values())
                .filter(cat -> getSubastaLevel(cat) <= userLevel)
                .toList();
    }

    public static boolean puedeAcceder(CategoriaCliente clienteCategoria, CategoriaSubasta subastaCategoria) {
        return getClientLevel(clienteCategoria) >= getSubastaLevel(subastaCategoria);
    }

    /** El comprador puede acceder a una subasta si su nivel es igual o superior al de la subasta. */
    public static boolean puedeAccederNivel(CategoriaCliente clienteCategoria, CategoriaCliente subastaNivel) {
        return getClientLevel(clienteCategoria) >= getClientLevel(subastaNivel);
    }

    /** Niveles de subasta que un comprador de este nivel puede ver (el suyo y todos los inferiores). */
    public static List<CategoriaCliente> nivelesPermitidos(CategoriaCliente clienteCategoria) {
        int userLevel = getClientLevel(clienteCategoria);
        return Arrays.stream(CategoriaCliente.values())
                .filter(nivel -> getClientLevel(nivel) <= userLevel)
                .toList();
    }
}
