-- =============================================================
-- VIVO SUBASTAS — Datos iniciales de Subastas Pokémon
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

-- password = BCrypt de "a" para todos los usuarios -> $2a$12$QhJlMVSKTXM2pfmfrwMt1.JRHxLeieqW5D/bxcrVz0EqzzZ0WFFKm
INSERT INTO personas (identificador, tipo, nombre, apellido, documento, direccion, estado, password) VALUES
(1, 'subastador', 'Rowan',    'Serbal',  '11111111', 'Pueblo Hojarasca, Sinnoh', 'activo', '$2a$12$QhJlMVSKTXM2pfmfrwMt1.JRHxLeieqW5D/bxcrVz0EqzzZ0WFFKm'),
(2, 'duenio',     'Giovanni', 'Sakaki',  '22222222', 'Pueblo Paleta, Kanto',     'activo', '$2a$12$QhJlMVSKTXM2pfmfrwMt1.JRHxLeieqW5D/bxcrVz0EqzzZ0WFFKm'),
(3, 'cliente',    'Ash',      'Ketchum', '33333333', 'Pueblo Paleta, Kanto',     'activo', '$2a$12$QhJlMVSKTXM2pfmfrwMt1.JRHxLeieqW5D/bxcrVz0EqzzZ0WFFKm'),
(4, 'cliente',    'Misty',    'Kasumi',  '44444444', 'Ciudad Celeste, Kanto',    'activo', '$2a$12$QhJlMVSKTXM2pfmfrwMt1.JRHxLeieqW5D/bxcrVz0EqzzZ0WFFKm'),
(5, 'cliente',    'Brock',    'Takeshi', '55555555', 'Ciudad Plateada, Kanto',   'activo', '$2a$12$QhJlMVSKTXM2pfmfrwMt1.JRHxLeieqW5D/bxcrVz0EqzzZ0WFFKm'),
(6, 'cliente',    'test',     'user',    '1',        'Calle de Pruebas 123',     'activo', '$2a$12$QhJlMVSKTXM2pfmfrwMt1.JRHxLeieqW5D/bxcrVz0EqzzZ0WFFKm'),
(7, 'duenio',     'Vendedor', 'Base',    '123456',   'Calle Vendedor 123',       'activo', '$2a$12$QhJlMVSKTXM2pfmfrwMt1.JRHxLeieqW5D/bxcrVz0EqzzZ0WFFKm');

INSERT INTO subastadores (identificador, matricula, region) VALUES
(1, 'MAT-PKM-001', 'Kanto / Sinnoh');

INSERT INTO duenios (identificador, verificacion_financiera, verificacion_judicial, admitido, categoria, numero_pais) VALUES
(2, 'aprobado', 'aprobado', 'si', 'platino', 1),
(7, 'aprobado', 'aprobado', 'si', 'platino', 1);

INSERT INTO clientes (identificador, admitido, categoria, numero_pais) VALUES
(3, 'NO', 'platino',  1),
(4, 'NO', 'oro',      1),
(5, 'NO', 'especial', 1),
(6, 'SI', 'platino',  1);

-- =============================================================
-- SUBASTAS ACTIVAS
-- =============================================================

INSERT INTO subastas (identificador, titulo, fecha, hora, estado, categoria, nivel, ubicacion, tiene_deposito, seguridad_propia, capacidad_asistentes, subastador) VALUES
(1, 'PokeBalls', '2026-06-20', '11:00:00', 'abierta', 'pokemon',           'plata',    'Centro de Subastas Kanto — Sala Coleccionistas', 'SI', 'SI', 150, 1),
(2, 'Piedras de Evolución',  '2026-06-21', '12:00:00', 'abierta', 'pokemon',           'plata',    'Gimnasio Celeste — Salón Evolución',             'SI', 'NO', 100, 1),
(3, 'Mejoras de Combate', '2026-06-22', '13:00:00', 'abierta', 'maquinas_tecnicas', 'especial', 'Centro de Batallas Kanto — Sala X',              'NO', 'SI', 200, 1),
(4, 'Bundle berries',       '2026-06-23', '14:00:00', 'abierta', 'pociones',          'comun',    'Pueblo Lavanda — Tienda Orgánica',               'NO', 'NO', 120, 1),
(5, 'Objetos Equipables', '2026-06-24', '15:00:00', 'abierta', 'otros',             'comun',    'Ciudad Azulona — Mercado Central',               'SI', 'SI', 300, 1);

INSERT INTO catalogos (identificador, subasta) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

-- =============================================================
-- PRODUCTOS
-- =============================================================

-- Subasta 1: Poké Balls (IDs 1-5)
INSERT INTO productos (identificador, descripcion_catalogo, descripcion_completa, disponible, duenio, seguro) VALUES
(1, 'pokeball',
   'La Poké Ball clásica para capturar Pokémon. Tasa de captura: ×1. Material: plástico de alto impacto rojo y blanco. Edición coleccionista sellada de fábrica.',
   'SI', 2, 'PKM-003'),
(2, 'greatball',
   'Poké Ball de mayor rendimiento. Tasa de captura: ×1,5. Carcasa azul y rojo. Ideal para Pokémon de nivel medio. Edición coleccionista sellada.',
   'SI', 2, 'PKM-003'),
(3, 'ultraball',
   'La mejor Poké Ball de uso general. Tasa de captura: ×2. Diseño negro y amarillo premium. Muy eficaz contra Pokémon difíciles. Sellada de fábrica.',
   'SI', 2, 'PKM-001'),
(4, 'safariball',
   'Poké Ball de edición especial, solo disponible en la Zona Safari. Tasa de captura: ×1,5 en entorno Safari. Diseño verde con rayas oscuras. Pieza de colección rara.',
   'SI', 2, 'PKM-001'),
(5, 'masterball',
   'La Poké Ball definitiva. Captura cualquier Pokémon sin fallo. Fabricada por Silph Co. Diseño morado con motivos genéticos. Ejemplar único certificado. Máxima rareza.',
   'SI', 2, 'PKM-001');

-- Subasta 2: Piedras Evolutivas (Stones) (IDs 6-10)
INSERT INTO productos (identificador, descripcion_catalogo, descripcion_completa, disponible, duenio, seguro) VALUES
(6, 'Piedra Fuego (Fire Stone)',
   'Una piedra peculiar de color anaranjado que hace evolucionar a ciertas especies de Pokémon. Caliente al tacto como carbón encendido.',
   'SI', 2, 'PKM-002'),
(7, 'Piedra Hoja (Leaf Stone)',
   'Una piedra peculiar con un patrón de hojas que hace evolucionar a ciertas especies de Pokémon de tipo Planta.',
   'SI', 2, 'PKM-002'),
(8, 'Piedra Lunar (Moon Stone)',
   'Una piedra peculiar que brilla como el cielo nocturno. Hace evolucionar a ciertas especies de Pokémon.',
   'SI', 2, 'PKM-001'),
(9, 'Piedra Trueno (Thunder Stone)',
   'Una piedra peculiar con un patrón de rayo que induce la evolución de Pokémon eléctricos.',
   'SI', 2, 'PKM-002'),
(10, 'Piedra Agua (Water Stone)',
   'Una piedra peculiar de un azul profundo que hace evolucionar a ciertas especies de Pokémon de tipo Agua.',
   'SI', 2, 'PKM-002');

-- Subasta 3: Objetos de Batalla (Xmove) (IDs 11-14)
INSERT INTO productos (identificador, descripcion_catalogo, descripcion_completa, disponible, duenio, seguro) VALUES
(11, 'Ataque X (X Attack)',
   'Objeto de un solo uso que aumenta temporalmente la estadística de Ataque de un Pokémon en pleno combate.',
   'SI', 2, 'PKM-003'),
(12, 'Defensa X (X Defense)',
   'Objeto de un solo uso que aumenta temporalmente la estadística de Defensa de un Pokémon en pleno combate.',
   'SI', 2, 'PKM-003'),
(13, 'Ataque Especial X (X Sp. Atk)',
   'Objeto de un solo uso que aumenta temporalmente la estadística de Ataque Especial de un Pokémon en pleno combate.',
   'SI', 2, 'PKM-003'),
(14, 'Velocidad X (X Speed)',
   'Objeto de un solo uso que aumenta temporalmente la estadística de Velocidad de un Pokémon en pleno combate.',
   'SI', 2, 'PKM-003');

-- Subasta 4: Bayas (Berry) (IDs 15-19)
INSERT INTO productos (identificador, descripcion_catalogo, descripcion_completa, disponible, duenio, seguro) VALUES
(15, 'Baya Oram (Bluk Berry)',
   'Ingrediente tradicional para la elaboración de Pokochos. De color morado intenso y piel rugosa.',
   'SI', 2, 'PKM-003'),
(16, 'Baya Atania (Chesto Berry)',
   'Una baya de cáscara dura. Cura al instante el estado de sueño de un Pokémon cuando este la consume.',
   'SI', 2, 'PKM-003'),
(17, 'Baya Lichi (Liechi Berry)',
   'Una baya extremadamente rara. Aumenta el Ataque del portador si sus puntos de salud caen a niveles críticos.',
   'SI', 2, 'PKM-001'),
(18, 'Baya Latano (Nanab Berry)',
   'Una baya dulce que calma a los Pokémon salvajes cuando se les ofrece, facilitando notablemente su captura.',
   'SI', 2, 'PKM-003'),
(19, 'Baya Petaya (Petaya Berry)',
   'Una baya exótica y muy cotizada. Aumenta el Ataque Especial del portador en situaciones de extremo peligro en combate.',
   'SI', 2, 'PKM-001');

-- Subasta 5: Objetos Equipables (Items) (IDs 20-24)
INSERT INTO productos (identificador, descripcion_catalogo, descripcion_completa, disponible, duenio, seguro) VALUES
(20, 'Moneda Amuleto (Amulet Coin)',
   'Objeto equipable de gran valor. Duplica la recompensa monetaria ganada al finalizar un combate si el Pokémon portador participa activamente.',
   'SI', 2, 'PKM-002'),
(21, 'Restos (Leftovers)',
   'Un objeto equipable muy útil. Restaura gradualmente un pequeño porcentaje de los PS máximos del portador al final de cada turno.',
   'SI', 2, 'PKM-001'),
(22, 'Imán (Magnet)',
   'Objeto equipable de polaridad reforzada. Potencia la fuerza de todos los movimientos de tipo Eléctrico ejecutados por el portador.',
   'SI', 2, 'PKM-002'),
(23, 'Antihielo (Never-Melt Ice)',
   'Un trozo de hielo eterno que nunca se derrite. Incrementa la potencia de los movimientos de tipo Hielo ejecutados por el portador.',
   'SI', 2, 'PKM-002'),
(24, 'Cuchara Torcida (Twisted Spoon)',
   'Objeto equipable impregnado de energía mental. Aumenta la potencia de los movimientos de tipo Psíquico ejecutados por el portador.',
   'SI', 2, 'PKM-002');

-- =============================================================
-- ITEMS EN CATÁLOGO
-- =============================================================

-- Catalogo 1 (Poké Balls - Subasta 1)
INSERT INTO items_catalogo (identificador, catalogo, producto, precio_base, comision, subastado) VALUES
(1, 1, 1,   500.00, 15.00, 'NO'),
(2, 1, 2,  1500.00, 15.00, 'NO'),
(3, 1, 3,  5000.00, 12.00, 'NO'),
(4, 1, 4,  8000.00, 12.00, 'NO'),
(5, 1, 5, 50000.00, 10.00, 'NO');

-- Catalogo 2 (Stones - Subasta 2)
INSERT INTO items_catalogo (identificador, catalogo, producto, precio_base, comision, subastado) VALUES
(6,  2, 6,  2100.00, 15.00, 'NO'),
(7,  2, 7,  2100.00, 15.00, 'NO'),
(8,  2, 8,  3000.00, 12.00, 'NO'),
(9,  2, 9,  2100.00, 15.00, 'NO'),
(10, 2, 10, 2100.00, 15.00, 'NO');

-- Catalogo 3 (Xmove - Subasta 3)
INSERT INTO items_catalogo (identificador, catalogo, producto, precio_base, comision, subastado) VALUES
(11, 3, 11, 350.00, 15.00, 'NO'),
(12, 3, 12, 350.00, 15.00, 'NO'),
(13, 3, 13, 350.00, 15.00, 'NO'),
(14, 3, 14, 350.00, 15.00, 'NO');

-- Catalogo 4 (Bayas - Subasta 4)
INSERT INTO items_catalogo (identificador, catalogo, producto, precio_base, comision, subastado) VALUES
(15, 4, 15, 120.00, 15.00, 'NO'),
(16, 4, 16, 200.00, 15.00, 'NO'),
(17, 4, 17, 800.00, 12.00, 'NO'),
(18, 4, 18, 150.00, 15.00, 'NO'),
(19, 4, 19, 800.00, 12.00, 'NO');

-- Catalogo 5 (Items - Subasta 5)
INSERT INTO items_catalogo (identificador, catalogo, producto, precio_base, comision, subastado) VALUES
(20, 5, 20, 10000.00, 15.00, 'NO'),
(21, 5, 21, 20000.00, 10.00, 'NO'),
(22, 5, 22,  5000.00, 12.00, 'NO'),
(23, 5, 23,  5000.00, 12.00, 'NO'),
(24, 5, 24,  5000.00, 12.00, 'NO');

-- =============================================================
-- ASISTENTES
-- =============================================================

INSERT INTO asistentes (identificador, cliente, subasta, numero_postor) VALUES
-- Subasta 1
(1, 3, 1, 101), (2, 4, 1, 102), (3, 5, 1, 103), (4, 6, 1, 104),
-- Subasta 2
(5, 3, 2, 101), (6, 4, 2, 102), (7, 5, 2, 103), (8, 6, 2, 104),
-- Subasta 3
(9, 3, 3, 101), (10, 4, 3, 102), (11, 5, 3, 103), (12, 6, 3, 104),
-- Subasta 4
(13, 3, 4, 101), (14, 4, 4, 102), (15, 5, 4, 103), (16, 6, 4, 104),
-- Subasta 5
(17, 3, 5, 101), (18, 4, 5, 102), (19, 5, 5, 103), (20, 6, 5, 104);

-- =============================================================
-- MEDIOS DE PAGO (TODOS VERIFICADOS)
-- =============================================================

INSERT INTO medios_pago (id, persona_id, tipo, moneda, estado, es_banca_exterior, numero_cuenta, banco, numero_tarjeta, vencimiento, monto_cheque) VALUES
-- Ash (3)
(1, 3, 'TARJETA_CREDITO',    'USD', 'VERIFICADO', 0, NULL,             NULL,          '4111-1111-1111-1111', '12/29', NULL),
(2, 3, 'CUENTA_BANCARIA',    'ARS', 'VERIFICADO', 0, '0001-2345-6789', 'Banco Kanto', NULL,                  NULL,    NULL),
-- Misty (4)
(3, 4, 'CUENTA_BANCARIA',    'ARS', 'VERIFICADO', 0, '0002-9876-5432', 'Banco Johto', NULL,                  NULL,    NULL),
-- Brock (5)
(4, 5, 'CHEQUE_CERTIFICADO', 'ARS', 'VERIFICADO', 0, NULL,             'Banco Hoenn', NULL,                  NULL,    100000.00),
-- Test User (6)
(5, 6, 'TARJETA_CREDITO',    'USD', 'VERIFICADO', 0, NULL,             NULL,          '4222-2222-2222-2222', '12/29', NULL),
(6, 6, 'CUENTA_BANCARIA',    'ARS', 'VERIFICADO', 0, '0006-1234-5678', 'Banco Test',  NULL,                  NULL,    NULL),
(7, 6, 'CHEQUE_CERTIFICADO', 'ARS', 'VERIFICADO', 0, NULL,             'Banco Test',  NULL,                  NULL,    200000.00);

-- =============================================================
-- NOTIFICACIONES INICIALES
-- =============================================================

INSERT INTO notificaciones (id, usuario_id, tipo, titulo, cuerpo, leida, fecha_creacion) VALUES
(1, 5, 'ARTICULO_ACEPTADO', 'Medio de pago verificado', 'Brock, tu cheque certificado del Banco Hoenn ha sido verificado con éxito.', 0, '2026-06-01 09:00:00'),
(2, 6, 'ARTICULO_ACEPTADO', 'Medio de pago verificado', 'test, tus cuentas y cheque del Banco Test han sido verificados con éxito.', 0, '2026-06-01 09:01:00');
