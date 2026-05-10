package com.subastas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "seguros")
@Getter
@Setter
public class Seguro {

    @Id
    @Column(name = "nroPoliza")
    private String nroPoliza;

    @Column(name = "compania")
    private String compania;

    @Column(name = "polizaCombinada")
    private String polizaCombinada;

    @Column(name = "importe")
    private BigDecimal importe;
}
