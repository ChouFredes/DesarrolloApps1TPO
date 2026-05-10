package com.subastas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "fotos")
@Getter
@Setter
public class Foto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long id;

    @Lob
    @Column(name = "foto")
    private byte[] foto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto")
    private Producto producto;
}
