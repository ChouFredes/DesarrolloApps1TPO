package com.subastas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegistroVendedorRequest(
        @NotBlank String documento,
        @NotBlank String nombre,
        @NotBlank String apellido,
        @NotBlank String direccion,
        @NotNull Integer paisId,
        @NotBlank String password,
        /** Foto que acredita la categoría del vendedor (data URI base64 o URL) */
        @NotBlank String fotoAcreditacion
) {}
