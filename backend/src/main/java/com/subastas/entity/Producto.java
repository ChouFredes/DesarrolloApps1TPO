package com.subastas.entity;

import com.subastas.entity.enums.CategoriaSubasta;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

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

    /** Estado del ciclo de vida del artículo en el proceso de subasta.
     *  Valores posibles: pendiente_inspeccion, rechazado, propuesta_enviada,
     *  aceptado_por_usuario, rechazado_por_usuario, incluido_en_subasta, vendido */
    @Column(name = "disponible")
    private String disponible;

    /** Categoría temática del producto. Debe ser de nivel menor o igual al del vendedor. */
    @Column(name = "categoria")
    @Enumerated(EnumType.STRING)
    private CategoriaSubasta categoria;

    /** Motivo de rechazo por parte del admin (visible para el usuario dueño). */
    @Column(name = "motivoRechazo", length = 500)
    private String motivoRechazo;

    /** Precio base propuesto por la empresa (antes de que el usuario acepte/rechace). */
    @Column(name = "precioBasePropuesto", precision = 14, scale = 2)
    private BigDecimal precioBasePropuesto;

    /** Comisión propuesta por la empresa (antes de que el usuario acepte/rechace). */
    @Column(name = "comisionPropuesta", precision = 14, scale = 2)
    private BigDecimal comisionPropuesta;

    @Column(name = "deposito")
    private String deposito;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duenio")
    private Duenio duenio;

    /** Lote al que pertenece el producto (nullable: los artículos individuales no tienen lote). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lote")
    private Lote lote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seguro")
    private Seguro seguro;
}
