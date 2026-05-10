package com.subastas.entity;

import com.subastas.entity.enums.TipoNotificacion;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
@Getter
@Setter
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Persona usuario;

    @Column(name = "tipo", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoNotificacion tipo;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "cuerpo", columnDefinition = "NVARCHAR(MAX)")
    private String cuerpo;

    @Column(name = "leida", nullable = false)
    private boolean leida;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
