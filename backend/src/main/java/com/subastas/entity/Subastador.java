package com.subastas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "subastadores")
@DiscriminatorValue("subastador")
@Getter
@Setter
public class Subastador extends Persona {

    @Column(name = "matricula")
    private String matricula;

    @Column(name = "region")
    private String region;
}
