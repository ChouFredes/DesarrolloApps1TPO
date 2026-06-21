package com.subastas.entity;

import com.subastas.entity.enums.CategoriaSubasta;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "lotes")
@Getter
@Setter
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long id;

    @Column(name = "titulo")
    private String titulo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duenio")
    private Duenio duenio;

    /** Foto general de portada de la subasta/lote. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fotoPortada")
    private Foto fotoPortada;

    @Column(name = "fechaCreacion")
    private LocalDateTime fechaCreacion;

    /** Estado del lote. Valor inicial: "pendiente_inspeccion". */
    @Column(name = "estado")
    private String estado;

    @Column(name = "categoria")
    @Enumerated(EnumType.STRING)
    private CategoriaSubasta categoria;
}
