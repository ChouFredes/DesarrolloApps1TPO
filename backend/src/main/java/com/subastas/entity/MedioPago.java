package com.subastas.entity;

import com.subastas.entity.enums.EstadoMedioPago;
import com.subastas.entity.enums.TipoMedioPago;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "medios_pago")
@Getter
@Setter
public class MedioPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "tipo", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoMedioPago tipo;

    @Column(name = "moneda")
    private String moneda;

    @Column(name = "estado", nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoMedioPago estado;

    @Column(name = "es_banca_exterior")
    private boolean esBancaExterior;

    @Column(name = "numero_cuenta")
    private String numeroCuenta;

    @Column(name = "banco")
    private String banco;

    @Column(name = "numero_tarjeta")
    private String numeroTarjeta;

    @Column(name = "vencimiento")
    private String vencimiento;

    @Column(name = "monto_cheque", precision = 18, scale = 2)
    private BigDecimal montoCheque;
}
