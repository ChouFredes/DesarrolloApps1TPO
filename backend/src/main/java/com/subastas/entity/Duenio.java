package com.subastas.entity;

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
}
