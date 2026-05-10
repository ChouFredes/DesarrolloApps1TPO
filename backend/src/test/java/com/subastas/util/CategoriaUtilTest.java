package com.subastas.util;

import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.CategoriaSubasta;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for {@link CategoriaUtil}.
 *
 * NOTE: The current implementation of CategoriaUtil uses product-type categories
 * (arte, electronica, vehiculos, etc.) rather than a tier-based system.
 * Both {@code categoriasPermitidas} and {@code puedeAcceder} currently return
 * all categories / true for every client — these tests document that real behavior.
 * When tier-based access control is implemented, update these tests accordingly.
 */
class CategoriaUtilTest {

    // -----------------------------------------------------------------------
    // categoriasPermitidas
    // -----------------------------------------------------------------------

    @Test
    void categoriasPermitidas_comun_retornaTodasLasCategorias() {
        List<CategoriaSubasta> resultado = CategoriaUtil.categoriasPermitidas(CategoriaCliente.comun);

        assertNotNull(resultado);
        // Current implementation: all categories are allowed for every client tier
        assertEquals(CategoriaSubasta.values().length, resultado.size());
        assertTrue(resultado.containsAll(List.of(CategoriaSubasta.values())));
    }

    @Test
    void categoriasPermitidas_platino_retornaTodasLasCategorias() {
        List<CategoriaSubasta> resultado = CategoriaUtil.categoriasPermitidas(CategoriaCliente.platino);

        assertNotNull(resultado);
        assertEquals(CategoriaSubasta.values().length, resultado.size());
        assertTrue(resultado.containsAll(List.of(CategoriaSubasta.values())));
    }

    @Test
    void categoriasPermitidas_oro_retornaTodasLasCategorias() {
        List<CategoriaSubasta> resultado = CategoriaUtil.categoriasPermitidas(CategoriaCliente.oro);

        assertNotNull(resultado);
        assertFalse(resultado.isEmpty());
    }

    // -----------------------------------------------------------------------
    // puedeAcceder
    // -----------------------------------------------------------------------

    @Test
    void puedeAcceder_comun_cualquierCategoria_retornaTrue() {
        // Current implementation always returns true regardless of client/subasta category
        assertTrue(CategoriaUtil.puedeAcceder(CategoriaCliente.comun, CategoriaSubasta.arte));
        assertTrue(CategoriaUtil.puedeAcceder(CategoriaCliente.comun, CategoriaSubasta.joyas));
        assertTrue(CategoriaUtil.puedeAcceder(CategoriaCliente.comun, CategoriaSubasta.inmuebles));
    }

    @Test
    void puedeAcceder_platino_todasLasCategorias_retornaTrue() {
        for (CategoriaSubasta cat : CategoriaSubasta.values()) {
            assertTrue(
                    CategoriaUtil.puedeAcceder(CategoriaCliente.platino, cat),
                    "platino deberia poder acceder a categoria: " + cat
            );
        }
    }

    @Test
    void puedeAcceder_oro_todasLasCategorias_retornaTrue() {
        for (CategoriaSubasta cat : CategoriaSubasta.values()) {
            assertTrue(
                    CategoriaUtil.puedeAcceder(CategoriaCliente.oro, cat),
                    "oro deberia poder acceder a categoria: " + cat
            );
        }
    }
}
