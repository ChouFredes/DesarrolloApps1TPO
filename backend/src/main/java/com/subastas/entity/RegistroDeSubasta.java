package com.subastas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "registroDeSubasta")
@Getter
@Setter
public class RegistroDeSubasta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta")
    private Subasta subasta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto")
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duenio")
    private Duenio duenio;

    @Column(name = "importe")
    private BigDecimal importe;

    @Column(name = "comision")
    private BigDecimal comision;

    @Column(name = "costoEnvio")
    private BigDecimal costoEnvio;

    @Column(name = "retiroPersonal")
    private boolean retiroPersonal;
}
