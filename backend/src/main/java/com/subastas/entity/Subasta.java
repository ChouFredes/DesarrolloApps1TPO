package com.subastas.entity;

import com.subastas.entity.enums.CategoriaSubasta;
import com.subastas.entity.enums.EstadoSubasta;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "subastas")
@Getter
@Setter
public class Subasta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long id;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "hora")
    private LocalTime hora;

    @Column(name = "estado")
    @Enumerated(EnumType.STRING)
    private EstadoSubasta estado;

    @Column(name = "categoria")
    @Enumerated(EnumType.STRING)
    private CategoriaSubasta categoria;

    @Column(name = "ubicacion")
    private String ubicacion;

    @Column(name = "tieneDeposito")
    private String tieneDeposito;

    @Column(name = "seguridadPropia")
    private String seguridadPropia;

    @Column(name = "capacidadAsistentes")
    private Integer capacidadAsistentes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subastador")
    private Subastador subastador;
}
