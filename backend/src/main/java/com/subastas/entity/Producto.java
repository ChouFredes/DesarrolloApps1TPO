package com.subastas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "productos")
@Getter
@Setter
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long id;

    @Column(name = "descripcionCatalogo")
    private String descripcionCatalogo;

    @Column(name = "descripcionCompleta")
    private String descripcionCompleta;

    @Column(name = "disponible")
    private String disponible;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duenio")
    private Duenio duenio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seguro")
    private Seguro seguro;
}
