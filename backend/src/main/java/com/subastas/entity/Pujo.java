package com.subastas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pujos")
@Getter
@Setter
public class Pujo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asistente")
    private Asistente asistente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item")
    private ItemCatalogo item;

    @Column(name = "importe")
    private BigDecimal importe;

    @Column(name = "ganador")
    private String ganador;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;
}
