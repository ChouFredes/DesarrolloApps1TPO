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
    void categoriasPermitidas_comun_retornaCategoriasLimitadas() {
        List<CategoriaSubasta> resultado = CategoriaUtil.categoriasPermitidas(CategoriaCliente.comun);

        assertNotNull(resultado);
        assertTrue(resultado.contains(CategoriaSubasta.pociones));
        assertTrue(resultado.contains(CategoriaSubasta.otros));
        assertFalse(resultado.contains(CategoriaSubasta.maquinas_tecnicas));
        assertFalse(resultado.contains(CategoriaSubasta.pokemon));
        assertFalse(resultado.contains(CategoriaSubasta.arte));
    }

    @Test
    void categoriasPermitidas_platino_retornaTodasLasCategorias() {
        List<CategoriaSubasta> resultado = CategoriaUtil.categoriasPermitidas(CategoriaCliente.platino);

        assertNotNull(resultado);
        assertEquals(CategoriaSubasta.values().length, resultado.size());
        assertTrue(resultado.containsAll(List.of(CategoriaSubasta.values())));
    }

    @Test
    void categoriasPermitidas_oro_noRetornaCategoriasSuperiores() {
        List<CategoriaSubasta> resultado = CategoriaUtil.categoriasPermitidas(CategoriaCliente.oro);

        assertNotNull(resultado);
        assertTrue(resultado.contains(CategoriaSubasta.pokemon));
        assertTrue(resultado.contains(CategoriaSubasta.electronica));
        assertFalse(resultado.contains(CategoriaSubasta.arte));
        assertFalse(resultado.contains(CategoriaSubasta.joyas));
    }

    // -----------------------------------------------------------------------
    // puedeAcceder
    // -----------------------------------------------------------------------

    @Test
    void puedeAcceder_comun_soloNivelCero() {
        assertTrue(CategoriaUtil.puedeAcceder(CategoriaCliente.comun, CategoriaSubasta.pociones));
        assertTrue(CategoriaUtil.puedeAcceder(CategoriaCliente.comun, CategoriaSubasta.otros));
        assertFalse(CategoriaUtil.puedeAcceder(CategoriaCliente.comun, CategoriaSubasta.maquinas_tecnicas));
        assertFalse(CategoriaUtil.puedeAcceder(CategoriaCliente.comun, CategoriaSubasta.arte));
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
    void puedeAcceder_oro_excluyeNivelCuatro() {
        assertTrue(CategoriaUtil.puedeAcceder(CategoriaCliente.oro, CategoriaSubasta.pokemon));
        assertTrue(CategoriaUtil.puedeAcceder(CategoriaCliente.oro, CategoriaSubasta.electronica));
        assertFalse(CategoriaUtil.puedeAcceder(CategoriaCliente.oro, CategoriaSubasta.arte));
        assertFalse(CategoriaUtil.puedeAcceder(CategoriaCliente.oro, CategoriaSubasta.joyas));
    }
}
