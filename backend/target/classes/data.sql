-- =============================================================
-- VIVO SUBASTAS — Datos iniciales (Pokémon Theme)
-- Nombres de tablas y columnas en snake_case:
-- SpringPhysicalNamingStrategy los convierte automáticamente.
--   itemsCatalogo   → items_catalogo
--   registroDeSubasta → registro_de_subasta
--   nroPoliza       → nro_poliza
--   precioBase      → precio_base   (etc.)
-- =============================================================

INSERT INTO paises (numero, nombre, nacionalidad, idioma) VALUES
(1, 'Argentina', 'Argentina',  'Español'),
(2, 'Japón',     'Japonesa',   'Japonés'),
(3, 'España',    'Española',   'Español'),
(4, 'Brasil',    'Brasileña',  'Portugués'),
(5, 'Francia',   'Francesa',   'Francés');

INSERT INTO seguros (nro_poliza, compania, poliza_combinada, importe) VALUES
('PKM-001', 'Silph Co. Seguros',        'SI', 500000.00),
('PKM-002', 'Devon Corp. Aseguradoras', 'SI', 150000.00),
('PKM-003', 'Jenny Security Services',  'NO',  10000.00);

-- password = BCrypt de "Pokeball1!"
INSERT INTO personas (identificador, tipo, nombre, apellido, documento, direccion, estado, password) VALUES
(1, 'subastador', 'Rowan',    'Serbal',  '11111111', 'Pueblo Hojarasca, Sinnoh', 'activo', '$2b$12$OVbnxO1VJWW5TRtnPdoD2umpoSZsAq3NZtUubWrDMysl3wWTGmY/y'),
(2, 'duenio',     'Giovanni', 'Sakaki',  '22222222', 'Pueblo Paleta, Kanto',     'activo', '$2b$12$OVbnxO1VJWW5TRtnPdoD2umpoSZsAq3NZtUubWrDMysl3wWTGmY/y'),
(3, 'cliente',    'Ash',      'Ketchum', '33333333', 'Pueblo Paleta, Kanto',     'activo', '$2b$12$OVbnxO1VJWW5TRtnPdoD2umpoSZsAq3NZtUubWrDMysl3wWTGmY/y'),
(4, 'cliente',    'Misty',    'Kasumi',  '44444444', 'Ciudad Celeste, Kanto',    'activo', '$2b$12$OVbnxO1VJWW5TRtnPdoD2umpoSZsAq3NZtUubWrDMysl3wWTGmY/y'),
(5, 'cliente',    'Brock',    'Takeshi', '55555555', 'Ciudad Plateada, Kanto',   'activo', '$2b$12$OVbnxO1VJWW5TRtnPdoD2umpoSZsAq3NZtUubWrDMysl3wWTGmY/y');

INSERT INTO subastadores (identificador, matricula, region) VALUES
(1, 'MAT-PKM-001', 'Kanto / Sinnoh');

INSERT INTO duenios (identificador, verificacion_financiera, verificacion_judicial) VALUES
(2, 'aprobado', 'aprobado');

INSERT INTO clientes (identificador, admitido, categoria, numero_pais) VALUES
(3, 'SI', 'platino',  1),
(4, 'SI', 'oro',      1),
(5, 'SI', 'especial', 1);

INSERT INTO subastas (identificador, fecha, hora, estado, categoria, ubicacion, tiene_deposito, seguridad_propia, capacidad_asistentes, subastador) VALUES
(1, '2026-06-10', '14:00:00', 'abierta', 'pokemon',           'Centro de Subastas Kanto — Salón Principal',   'SI', 'SI', 500, 1),
(2, '2026-06-12', '16:00:00', 'abierta', 'maquinas_tecnicas', 'Centro de Subastas Kanto — Sala Técnica',      'NO', 'SI', 200, 1),
(3, '2026-06-15', '10:00:00', 'abierta', 'pociones',          'Mercado Ciudad Carmín — Pabellón Oeste',       'NO', 'NO', 300, 1),
(4, '2026-05-25', '15:00:00', 'cerrada', 'pokemon',           'Centro de Subastas Kanto — Bóveda Legendaria', 'SI', 'SI', 100, 1);

INSERT INTO catalogos (identificador, subasta) VALUES
(1, 1), (2, 2), (3, 3), (4, 4);

-- ── Pokémon Atacantes ──────────────────────────────────────────
INSERT INTO productos (identificador, descripcion_catalogo, descripcion_completa, disponible, duenio, seguro) VALUES
(1, 'Charizard — Atacante Fuego/Volador',
   'Tipo: Fuego / Volador | PS: 78 | Atk: 109 | Def: 78 | Atk.Esp: 109 | Def.Esp: 85 | Vel: 100 | Habilidad: Mar Llamas. Movimientos: Llamarada, Giro de Dragón, Cola de Hierro, Vuelo.',
   'SI', 2, 'PKM-001'),
(2, 'Dragonite — Atacante Dragón/Volador',
   'Tipo: Dragón / Volador | PS: 91 | Atk: 134 | Def: 95 | Atk.Esp: 100 | Def.Esp: 100 | Vel: 80 | Habilidad: Vista Lince. Movimientos: Cometa Draco, Hiperrayo, Golpe Cuerpo, Trueno.',
   'SI', 2, 'PKM-001'),
(3, 'Salamence — Atacante Dragón/Volador',
   'Tipo: Dragón / Volador | PS: 95 | Atk: 135 | Def: 80 | Atk.Esp: 110 | Def.Esp: 80 | Vel: 100 | Habilidad: Intimidación. Movimientos: Cometa Draco, Terremoto, Vuelo.',
   'SI', 2, 'PKM-001'),
(4, 'Garchomp — Atacante Dragón/Tierra',
   'Tipo: Dragón / Tierra | PS: 108 | Atk: 130 | Def: 95 | Atk.Esp: 80 | Def.Esp: 85 | Vel: 102 | Habilidad: Paso Arena. Movimientos: Garra Dragón, Terremoto, Espada Danza.',
   'SI', 2, 'PKM-001'),
(5, 'Machamp — Atacante Lucha',
   'Tipo: Lucha | PS: 90 | Atk: 130 | Def: 80 | Atk.Esp: 65 | Def.Esp: 85 | Vel: 55 | Habilidad: Sin Límite. Movimientos: Puño Dinámico, Golpe Roca, Patada Ígnea.',
   'SI', 2, 'PKM-001'),
-- ── Pokémon Defensores ─────────────────────────────────────────
(6, 'Umbreon — Defensor Siniestro',
   'Tipo: Siniestro | PS: 95 | Atk: 65 | Def: 110 | Atk.Esp: 60 | Def.Esp: 130 | Vel: 65 | Habilidad: Sincronía. Movimientos: Deseo, Maldición, Tóxico, Puño Sombra.',
   'SI', 2, 'PKM-001'),
(7, 'Blissey — Defensor Normal (Máx. PS)',
   'Tipo: Normal | PS: 255 | Atk: 10 | Def: 10 | Atk.Esp: 75 | Def.Esp: 135 | Vel: 55 | Habilidad: Dicha. Movimientos: Canto, Recuperación, Llanto Mortal, Fuego Secreto.',
   'SI', 2, 'PKM-001'),
(8, 'Skarmory — Defensor Acero/Volador',
   'Tipo: Acero / Volador | PS: 65 | Atk: 80 | Def: 140 | Atk.Esp: 40 | Def.Esp: 70 | Vel: 70 | Habilidad: Aguante. Movimientos: Tóxico, Trampa Rocas, Tornado, Cuerpo Puro.',
   'SI', 2, 'PKM-001'),
(9, 'Ferrothorn — Defensor Planta/Acero',
   'Tipo: Planta / Acero | PS: 74 | Atk: 94 | Def: 131 | Atk.Esp: 54 | Def.Esp: 116 | Vel: 20 | Habilidad: Cuerpo Férreo. Movimientos: Trampa Rocas, Tóxico, Manto Espejo.',
   'SI', 2, 'PKM-001'),
(10, 'Cloyster — Defensor Agua/Hielo (Def. 180)',
    'Tipo: Agua / Hielo | PS: 50 | Atk: 95 | Def: 180 | Atk.Esp: 85 | Def.Esp: 45 | Vel: 70 | Habilidad Oculta: Destreza. Movimientos: Rompecorazas, Carámbano, Onda Acuática.',
    'SI', 2, 'PKM-001'),
-- ── MT por calidad ─────────────────────────────────────────────
(11, 'MT17 Rugido — Calidad Básica',
    'MT de uso único. Enseña: Rugido | Tipo: Normal | Estado. Baja 1 nivel el Ataque del rival. Calidad: Básica.',
    'SI', 2, 'PKM-002'),
(12, 'MT28 Excavar — Calidad Básica',
    'MT de uso único. Enseña: Excavar | Tipo: Tierra | Potencia: 80 | Exactitud: 100 | Físico. Calidad: Básica.',
    'SI', 2, 'PKM-002'),
(13, 'MT24 Trueno — Calidad Especial',
    'MT de uso único. Enseña: Trueno | Tipo: Eléctrico | Potencia: 110 | Exactitud: 70. 30% de paralizar. Calidad: Especial.',
    'SI', 2, 'PKM-002'),
(14, 'MT13 Rayo Hielo — Calidad Especial',
    'MT de uso único. Enseña: Rayo Hielo | Tipo: Hielo | Potencia: 90 | Exactitud: 100. 10% de congelar. Calidad: Especial.',
    'SI', 2, 'PKM-002'),
(15, 'MT26 Terremoto — Calidad Avanzada',
    'MT de uso único. Enseña: Terremoto | Tipo: Tierra | Potencia: 100 | Exactitud: 100. Afecta a todos. Calidad: Avanzada.',
    'SI', 2, 'PKM-002'),
(16, 'MT29 Psíquico — Calidad Avanzada',
    'MT de uso único. Enseña: Psíquico | Tipo: Psíquico | Potencia: 90 | Exactitud: 100. Calidad: Avanzada.',
    'SI', 2, 'PKM-002'),
(17, 'MT59 Pulso Dragón — Calidad Premium',
    'MT de uso único. Enseña: Pulso Dragón | Tipo: Dragón | Potencia: 85 | Exactitud: 100. Calidad: Premium.',
    'SI', 2, 'PKM-002'),
(18, 'MT02 Garra Dragón — Élite + Voucher Cometa Draco',
    'MT de uso único. Enseña: Garra Dragón | Tipo: Dragón | Potencia: 80 | Exactitud: 100. INCLUYE voucher Cometa Draco (Potencia 130). Calidad: Élite.',
    'SI', 2, 'PKM-002'),
-- ── Pociones ───────────────────────────────────────────────────
(19, 'Poción ×10',          'Restaura 20 PS. Lote de 10 unidades. Fabricado por Silph Co.',                                         'SI', 2, 'PKM-003'),
(20, 'Super Poción ×5',     'Restaura 60 PS. Lote de 5 unidades.',                                                                  'SI', 2, 'PKM-003'),
(21, 'Hiper Poción ×3',     'Restaura 200 PS. Lote de 3 unidades.',                                                                 'SI', 2, 'PKM-003'),
(22, 'Poción Máxima ×1',    'Restaura TODOS los PS de un Pokémon.',                                                                 'SI', 2, 'PKM-003'),
(23, 'Revivir ×3',          'Revive con la mitad de los PS. Lote de 3 unidades.',                                                   'SI', 2, 'PKM-003'),
(24, 'Revivir Máximo ×1',   'Revive con TODOS los PS.',                                                                             'SI', 2, 'PKM-003'),
(25, 'Elixir ×2',           'Restaura 10 PP de todos los movimientos. Lote de 2 unidades.',                                         'SI', 2, 'PKM-003'),
(26, 'Elixir Máximo ×1',    'Restaura TODOS los PP de TODOS los movimientos.',                                                      'SI', 2, 'PKM-003'),
(27, 'Agua Fresca ×10',     'Restaura 25 PS. Pack de 10 botellas.',                                                                 'SI', 2, 'PKM-003'),
(28, 'Kit Curación Completo','3× Antigripal, 3× Antídoto, 3× Antiparalítico, 3× Despertar, 3× Quemapolvo, 3× Hielo Cura.',        'SI', 2, 'PKM-003'),
-- ── Legendarios (subasta cerrada) ─────────────────────────────
(29, 'Mewtwo — Atacante Psíquico Legendario',
    'Tipo: Psíquico | PS: 106 | Atk: 110 | Def: 90 | Atk.Esp: 154 | Def.Esp: 90 | Vel: 130 | Habilidad: Presión. Movimientos: Psíquico, Sombra Mental, Foco Resplandor, Recuperación.',
    'SI', 2, 'PKM-001'),
(30, 'Lugia — Defensor Psíquico/Volador Legendario',
    'Tipo: Psíquico / Volador | PS: 106 | Atk: 90 | Def: 130 | Atk.Esp: 90 | Def.Esp: 154 | Vel: 110 | Habilidad: Presión. Movimientos: Aeroblast, Canto Mortal, Recuperación.',
    'SI', 2, 'PKM-001');

INSERT INTO items_catalogo (identificador, catalogo, producto, precio_base, comision, subastado) VALUES
(1,  1,  1, 250000.00, 10.00, 'NO'),
(2,  1,  2, 180000.00, 10.00, 'NO'),
(3,  1,  3, 220000.00, 10.00, 'NO'),
(4,  1,  4, 300000.00, 10.00, 'NO'),
(5,  1,  5,  80000.00, 10.00, 'NO'),
(6,  1,  6, 120000.00, 10.00, 'NO'),
(7,  1,  7, 100000.00, 10.00, 'NO'),
(8,  1,  8,  90000.00, 10.00, 'NO'),
(9,  1,  9, 110000.00, 10.00, 'NO'),
(10, 1, 10,  75000.00, 10.00, 'NO'),
(11, 2, 11,   2000.00, 12.00, 'NO'),
(12, 2, 12,   2500.00, 12.00, 'NO'),
(13, 2, 13,   8000.00, 12.00, 'NO'),
(14, 2, 14,   8500.00, 12.00, 'NO'),
(15, 2, 15,  25000.00, 12.00, 'NO'),
(16, 2, 16,  22000.00, 12.00, 'NO'),
(17, 2, 17,  80000.00, 12.00, 'NO'),
(18, 2, 18, 200000.00, 12.00, 'NO'),
(19, 3, 19,    150.00, 15.00, 'NO'),
(20, 3, 20,    400.00, 15.00, 'NO'),
(21, 3, 21,   1200.00, 15.00, 'NO'),
(22, 3, 22,   2500.00, 15.00, 'NO'),
(23, 3, 23,   3000.00, 15.00, 'NO'),
(24, 3, 24,  12000.00, 15.00, 'NO'),
(25, 3, 25,   6000.00, 15.00, 'NO'),
(26, 3, 26,  18000.00, 15.00, 'NO'),
(27, 3, 27,    250.00, 15.00, 'NO'),
(28, 3, 28,   5000.00, 15.00, 'NO'),
(29, 4, 29, 800000.00, 10.00, 'SI'),
(30, 4, 30, 500000.00, 10.00, 'SI');

INSERT INTO asistentes (identificador, cliente, subasta, numero_postor) VALUES
(1, 3, 1, 101), (2, 4, 1, 102), (3, 5, 1, 103),
(4, 3, 2,  51), (5, 4, 2,  52),
(6, 5, 3, 201), (7, 3, 3, 202),
(8, 3, 4, 301), (9, 4, 4, 302);

INSERT INTO pujos (identificador, asistente, item, importe, ganador, timestamp) VALUES
(1, 8, 29,  900000.00, 'NO', '2026-05-25 15:10:00'),
(2, 9, 29, 1000000.00, 'NO', '2026-05-25 15:14:00'),
(3, 8, 29, 1100000.00, 'NO', '2026-05-25 15:18:00'),
(4, 9, 29, 1200000.00, 'NO', '2026-05-25 15:22:00'),
(5, 8, 29, 1350000.00, 'SI', '2026-05-25 15:28:00'),
(6, 8, 30,  550000.00, 'NO', '2026-05-25 15:40:00'),
(7, 9, 30,  650000.00, 'NO', '2026-05-25 15:45:00'),
(8, 8, 30,  700000.00, 'NO', '2026-05-25 15:49:00'),
(9, 9, 30,  780000.00, 'SI', '2026-05-25 15:55:00');

INSERT INTO registro_de_subasta (identificador, subasta, producto, cliente, duenio, importe, comision, costo_envio, retiro_personal) VALUES
(1, 4, 29, 3, 2, 1350000.00, 135000.00,    0.00, 1),
(2, 4, 30, 4, 2,  780000.00,  78000.00, 5000.00, 0);

INSERT INTO medios_pago (id, cliente_id, tipo, moneda, estado, es_banca_exterior, numero_cuenta, banco, numero_tarjeta, vencimiento, monto_cheque) VALUES
(1, 3, 'TARJETA_CREDITO',    'USD', 'VERIFICADO',             0, NULL,             NULL,          '4111-1111-1111-1111', '12/29', NULL),
(2, 3, 'CUENTA_BANCARIA',    'ARS', 'VERIFICADO',             0, '0001-2345-6789', 'Banco Kanto', NULL,                  NULL,    NULL),
(3, 4, 'CUENTA_BANCARIA',    'ARS', 'VERIFICADO',             0, '0002-9876-5432', 'Banco Johto', NULL,                  NULL,    NULL),
(4, 5, 'CHEQUE_CERTIFICADO', 'ARS', 'PENDIENTE_VERIFICACION', 0, NULL,             'Banco Hoenn', NULL,                  NULL,    50000.00);

INSERT INTO notificaciones (id, usuario_id, tipo, titulo, cuerpo, leida, fecha_creacion) VALUES
(1, 3, 'RESULTADO_COMPRA',  '¡Ganaste la subasta!',
 'Felicitaciones, Ash! Ganaste a Mewtwo por $1.350.000. Coordiná el retiro dentro de las próximas 48 hs.',
 0, '2026-05-25 16:00:00'),
(2, 4, 'RESULTADO_COMPRA',  '¡Ganaste la subasta!',
 'Felicitaciones, Misty! Ganaste a Lugia por $780.000. Envío a Ciudad Celeste: $5.000.',
 0, '2026-05-25 16:01:00'),
(3, 5, 'MULTA_PENDIENTE',   'Verificación de medio de pago pendiente',
 'Brock, tu cheque certificado (Banco Hoenn) está siendo verificado. No podrás pujar hasta que finalice.',
 0, '2026-05-26 09:00:00'),
(4, 3, 'ARTICULO_ACEPTADO', 'Tu puja fue registrada',
 'Tu puja de $1.350.000 por Mewtwo (Lote 29) fue registrada. Eres el postor activo.',
 1, '2026-05-25 15:28:00'),
(5, 4, 'ARTICULO_ACEPTADO', 'Tu puja fue registrada',
 'Tu puja de $780.000 por Lugia (Lote 30) fue registrada. Eres la postora activa.',
 1, '2026-05-25 15:55:00');
