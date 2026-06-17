package com.subastas.entity;

import com.subastas.entity.enums.CategoriaCliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "clientes")
@DiscriminatorValue("cliente")
@Getter
@Setter
public class Cliente extends Persona {

    @Column(name = "admitido")
    private String admitido;

    @Column(name = "categoria")
    @Enumerated(EnumType.STRING)
    private CategoriaCliente categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "numeroPais")
    private Pais pais;

    @Column(name = "token_notificacion")
    private String tokenNotificacion;
}
