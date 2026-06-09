package com.subastas.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ActualizarPerfilRequest(
        @NotBlank(message = "El nombre es requerido") String nombre,
        @NotBlank(message = "El apellido es requerido") String apellido,
        String telefono,
        @NotBlank(message = "El email es requerido") String email
) {}
