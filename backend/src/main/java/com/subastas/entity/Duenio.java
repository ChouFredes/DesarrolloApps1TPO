package com.subastas.entity;

import com.subastas.entity.enums.CategoriaCliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "duenios")
@DiscriminatorValue("duenio")
@Getter
@Setter
public class Duenio extends Persona {

    @Column(name = "verificacionFinanciera")
    private String verificacionFinanciera;

    @Column(name = "verificacionJudicial")
    private String verificacionJudicial;

    /** "no" = pendiente de verificación, "si" = aprobado, "rechazado" = rechazado por el admin */
    @Column(name = "admitido")
    private String admitido;

    /** Categoría asignada por el admin al aprobar. Define en qué categorías puede publicar. */
    @Column(name = "categoria")
    @Enumerated(EnumType.STRING)
    private CategoriaCliente categoria;

    /** Foto que acredita la categoría del vendedor (cargada en el registro). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fotoAcreditacion")
    private Foto fotoAcreditacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "numeroPais")
    private Pais pais;
}
