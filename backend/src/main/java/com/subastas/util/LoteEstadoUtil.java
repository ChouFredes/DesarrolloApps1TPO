package com.subastas.util;

import com.subastas.entity.Producto;

import java.util.List;

/**
 * Deriva el estado "resumen" de un lote/subasta a partir del estado de sus ítems (Productos).
 * El estado del lote no se persiste ítem por ítem: se calcula al leer.
 */
public final class LoteEstadoUtil {

    private LoteEstadoUtil() {}

    /**
     * Un lote está "pendiente" para la empresa mientras tenga al menos un ítem
     * por inspeccionar o ya inspeccionado a la espera de propuesta de precio.
     */
    public static boolean tienePendientesParaEmpresa(List<Producto> items) {
        return items.stream().anyMatch(p ->
                "pendiente_inspeccion".equals(p.getDisponible())
                        || "inspeccion_aprobada".equals(p.getDisponible())
                        // aceptado_por_usuario: la empresa todavía debe contratar seguro y publicar
                        || "aceptado_por_usuario".equals(p.getDisponible()));
    }

    /**
     * Estado resumido del lote según el avance de sus ítems.
     */
    public static String derivar(List<Producto> items) {
        if (items == null || items.isEmpty()) {
            return "pendiente_inspeccion";
        }
        boolean todosVendidos = items.stream().allMatch(p -> "vendido".equals(p.getDisponible()));
        if (todosVendidos) {
            return "vendido";
        }
        if (items.stream().anyMatch(p -> "pendiente_inspeccion".equals(p.getDisponible()))) {
            return "pendiente_inspeccion";
        }
        if (items.stream().anyMatch(p -> "inspeccion_aprobada".equals(p.getDisponible()))) {
            return "inspeccion_aprobada";
        }
        if (items.stream().anyMatch(p -> "propuesta_enviada".equals(p.getDisponible()))) {
            return "propuesta_enviada";
        }
        if (items.stream().anyMatch(p -> "aceptado_por_usuario".equals(p.getDisponible()))) {
            return "aceptado_por_usuario";
        }
        boolean todosRechazados = items.stream().allMatch(p ->
                "rechazado".equals(p.getDisponible())
                        || "rechazado_por_usuario".equals(p.getDisponible()));
        if (todosRechazados) {
            return "rechazado";
        }
        return "en_proceso";
    }
}
