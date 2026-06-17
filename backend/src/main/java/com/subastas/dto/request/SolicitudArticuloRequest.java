package com.subastas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SolicitudArticuloRequest(
        @NotBlank String descripcion,
        String descripcionCompleta,
        @NotNull @Size(min = 6) List<@NotBlank String> fotosUrls,
        String datosHistoricos,
        String artista,
        @NotNull Boolean declaraPropiedad,
        Long cuentaDestinoId,
        /** Categoría temática del artículo (debe estar permitida para el nivel del vendedor) */
        @NotBlank String categoria
) {}
