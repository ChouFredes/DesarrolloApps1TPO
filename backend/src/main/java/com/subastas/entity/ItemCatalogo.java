package com.subastas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "itemsCatalogo")
@Getter
@Setter
public class ItemCatalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catalogo")
    private Catalogo catalogo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto")
    private Producto producto;

    @Column(name = "precioBase")
    private BigDecimal precioBase;

    @Column(name = "comision")
    private BigDecimal comision;

    @Column(name = "subastado")
    private String subastado;
}
