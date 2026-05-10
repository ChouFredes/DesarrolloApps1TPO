-- V1__create_new_tables.sql
-- Creates new tables required by the Spring Boot backend that do not exist in the legacy DB schema.

-- medios_pago: Payment methods registered by clients
CREATE TABLE medios_pago (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    cliente_id      BIGINT               NOT NULL,
    tipo            NVARCHAR(30)         NOT NULL,  -- CUENTA_BANCARIA | TARJETA_CREDITO | CHEQUE_CERTIFICADO
    moneda          NVARCHAR(10)         NULL,
    estado          NVARCHAR(30)         NOT NULL,  -- PENDIENTE_VERIFICACION | VERIFICADO | RECHAZADO
    es_banca_exterior BIT               NOT NULL DEFAULT 0,
    numero_cuenta   NVARCHAR(50)         NULL,
    banco           NVARCHAR(100)        NULL,
    numero_tarjeta  NVARCHAR(20)         NULL,
    vencimiento     NVARCHAR(7)          NULL,      -- MM/YYYY
    monto_cheque    DECIMAL(18, 2)       NULL,
    CONSTRAINT PK_medios_pago PRIMARY KEY (id),
    CONSTRAINT FK_medios_pago_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes (identificador)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

CREATE INDEX IX_medios_pago_cliente ON medios_pago (cliente_id);
CREATE INDEX IX_medios_pago_estado  ON medios_pago (estado);


-- notificaciones: In-app and push notifications sent to any user type (Persona)
CREATE TABLE notificaciones (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    usuario_id      BIGINT               NOT NULL,
    tipo            NVARCHAR(30)         NOT NULL,  -- TipoNotificacion enum
    titulo          NVARCHAR(200)        NOT NULL,
    cuerpo          NVARCHAR(MAX)        NULL,
    leida           BIT                  NOT NULL DEFAULT 0,
    fecha_creacion  DATETIME2            NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_notificaciones PRIMARY KEY (id),
    CONSTRAINT FK_notificaciones_usuario FOREIGN KEY (usuario_id)
        REFERENCES personas (identificador)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

CREATE INDEX IX_notificaciones_usuario ON notificaciones (usuario_id);
CREATE INDEX IX_notificaciones_leida   ON notificaciones (usuario_id, leida);


-- refresh_tokens: Long-lived tokens used to obtain new access tokens
CREATE TABLE refresh_tokens (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    usuario_id  BIGINT               NOT NULL,
    token       NVARCHAR(512)        NOT NULL,
    expira_en   DATETIME2            NOT NULL,
    invalidado  BIT                  NOT NULL DEFAULT 0,
    CONSTRAINT PK_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT UQ_refresh_tokens_token UNIQUE (token),
    CONSTRAINT FK_refresh_tokens_usuario FOREIGN KEY (usuario_id)
        REFERENCES personas (identificador)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

CREATE INDEX IX_refresh_tokens_usuario ON refresh_tokens (usuario_id);


-- tokens_activacion: One-time account activation tokens sent via email
CREATE TABLE tokens_activacion (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    usuario_id  BIGINT               NOT NULL,
    token       NVARCHAR(512)        NOT NULL,
    expira_en   DATETIME2            NOT NULL,
    usado       BIT                  NOT NULL DEFAULT 0,
    CONSTRAINT PK_tokens_activacion PRIMARY KEY (id),
    CONSTRAINT UQ_tokens_activacion_token UNIQUE (token),
    CONSTRAINT FK_tokens_activacion_usuario FOREIGN KEY (usuario_id)
        REFERENCES personas (identificador)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

CREATE INDEX IX_tokens_activacion_usuario ON tokens_activacion (usuario_id);
