// Placeholder data — reemplazar con llamadas reales cuando el backend esté activo

export const MOCK_USER = {
  id: 1,
  nombre: 'Juan',
  apellido: 'Pérez',
  categoria: 'oro',
  email: 'juan.perez@email.com',
  domicilio: 'Av. Corrientes 1234, CABA',
  pais: 'Argentina',
};

// Catálogos/Subastas — el catálogo es un contenedor de items, NO tiene precio propio
export const MOCK_SUBASTAS = [
  {
    id: 1,
    nombre: 'Colección Automóviles Clásicos',
    descripcion: 'Una selección exclusiva de vehículos de colección de las décadas del 60 y 70. Cada pieza ha sido verificada por peritos automotores certificados e incluye documentación original.',
    categoria: 'oro',
    fechaFin: new Date(Date.now() + 9 * 3600000 + 12 * 60000).toISOString(),
    subastadorNombre: 'Andrés',
    subastadorApellido: 'García',
    imagenUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
    cantidadItems: 3,
  },
  {
    id: 2,
    nombre: 'Relojería de Lujo',
    descripcion: 'Piezas horarias de las casas más prestigiosas del mundo. Todos los relojes cuentan con certificado de autenticidad, historial de mantenimiento y cajas originales.',
    categoria: 'platino',
    fechaFin: new Date(Date.now() + 2 * 3600000 + 45 * 60000).toISOString(),
    subastadorNombre: 'Pedro',
    subastadorApellido: 'López',
    imagenUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
    cantidadItems: 4,
  },
  {
    id: 3,
    nombre: 'Arte y Fotografía Analógica',
    descripcion: 'Obras originales y equipamiento fotográfico analógico de época. Incluye pinturas firmadas con certificado de autenticidad y cámaras en perfecto estado de funcionamiento.',
    categoria: 'especial',
    fechaFin: new Date(Date.now() + 5 * 3600000 + 30 * 60000).toISOString(),
    subastadorNombre: 'Creador',
    subastadorApellido: 'Pedro',
    imagenUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
    cantidadItems: 2,
  },
  {
    id: 4,
    nombre: 'Instrumentos Musicales Históricos',
    descripcion: 'Guitarras, bajos y equipamiento de artistas reconocidos. Cada instrumento viene con certificado de procedencia y valuación independiente.',
    categoria: 'oro',
    fechaFin: new Date(Date.now() + 11 * 3600000 + 20 * 60000).toISOString(),
    subastadorNombre: 'Música',
    subastadorApellido: 'Live',
    imagenUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
    cantidadItems: 3,
  },
  {
    id: 5,
    nombre: 'Automoción Premium',
    descripcion: 'Vehículos de alta gama recientes con documentación completa. Todos los autos cuentan con inspección técnica certificada y verificación de kilometraje.',
    categoria: 'platino',
    fechaFin: new Date(Date.now() + 6 * 3600000 + 55 * 60000).toISOString(),
    subastadorNombre: 'Motors',
    subastadorApellido: 'Premium',
    imagenUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    cantidadItems: 2,
  },
];

// Items individuales por catálogo — cada item tiene su propio precio y se puja por separado
export const MOCK_ITEMS_POR_CATALOGO: Record<number, MockItem[]> = {
  1: [
    {
      id: 101,
      subastaId: 1,
      nombre: 'Mustang 67',
      descripcion: 'Clásico americano en excelente estado. Motor V8 289 (4.7L) de 225 HP, transmisión automática, restauración completa realizada en 2021. Pintura original Candy Apple Red, interior retapizado en cuero negro.',
      imagenUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
      fotos: [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
        'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
      ],
      precioBase: 250000,
      mayorOfertaActual: 280000,
    },
    {
      id: 102,
      subastaId: 1,
      nombre: 'Chevrolet Camaro SS 1969',
      descripcion: 'Camaro SS 396 de 1969 en estado concurso. Motor big-block 396 ci, caja manual de 4 velocidades, diferencial Posi-Traction. Pintura Rally Green original con franjas negras.',
      imagenUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
      fotos: [
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
      ],
      precioBase: 320000,
      mayorOfertaActual: 320000,
    },
    {
      id: 103,
      subastaId: 1,
      nombre: 'Ferrari 308 GTB 1978',
      descripcion: 'Ferrari 308 GTB con carrocería fibra de vidrio, año 1978. Motor V8 3.0L 255 CV. Una de solo 712 unidades producidas con este tipo de carrocería. Historial de servicio completo.',
      imagenUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
      fotos: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'],
      precioBase: 480000,
      mayorOfertaActual: 510000,
    },
  ],
  2: [
    {
      id: 201,
      subastaId: 2,
      nombre: 'Rolex Submariner Date',
      descripcion: 'Rolex Submariner ref. 116618LB en oro amarillo 18k. Esfera azul, bisel de cerámica azul. Año 2019, con caja y documentación original. Servicio realizado en 2023.',
      imagenUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
      fotos: [
        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
        'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800',
      ],
      precioBase: 50000,
      mayorOfertaActual: 58000,
    },
    {
      id: 202,
      subastaId: 2,
      nombre: 'Patek Philippe Nautilus',
      descripcion: 'Patek Philippe Nautilus ref. 5711/1A-010 en acero inoxidable. Esfera azul con índices aplicados. Año 2020. Pieza altamente demandada, con lista de espera en boutiques.',
      imagenUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800',
      fotos: ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800'],
      precioBase: 120000,
      mayorOfertaActual: 145000,
    },
    {
      id: 203,
      subastaId: 2,
      nombre: 'Audemars Piguet Royal Oak',
      descripcion: 'AP Royal Oak ref. 15500ST en acero, esfera azul "Grande Tapisserie". Calibre 4302, reserva de marcha 70hs. Con caja, documentos y correa adicional de fábrica.',
      imagenUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
      fotos: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800'],
      precioBase: 95000,
      mayorOfertaActual: 95000,
    },
    {
      id: 204,
      subastaId: 2,
      nombre: 'Omega Speedmaster Moonwatch',
      descripcion: 'Omega Speedmaster Professional ref. 310.30.42.50.01.001, el reloj de la NASA. Movimiento calibre 3861 co-axial. Edición 2021 con mejoras de resistencia magnética. Completo.',
      imagenUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800',
      fotos: ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800'],
      precioBase: 18000,
      mayorOfertaActual: 21500,
    },
  ],
  3: [
    {
      id: 301,
      subastaId: 3,
      nombre: 'Sunset Orange — Acrílico Original',
      descripcion: 'Pintura acrílica original firmada por el artista Andrés Yamaha. 80x60cm, enmarcada en madera de roble natural. Certificado de autenticidad y tasación notarial incluidos.',
      imagenUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
      fotos: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'],
      precioBase: 15000,
      mayorOfertaActual: 17500,
    },
    {
      id: 302,
      subastaId: 3,
      nombre: 'Agfa Optima 500',
      descripcion: 'Cámara analógica alemana de 1969 en perfecto estado de funcionamiento. Objetivos Carl Zeiss Tessar 45mm f/2.8. Fotómetro funcional, obturador calibrado. Incluye estuche original de cuero.',
      imagenUrl: 'https://images.unsplash.com/photo-1606986628253-1aac8c4ee4e5?w=800',
      fotos: ['https://images.unsplash.com/photo-1606986628253-1aac8c4ee4e5?w=800'],
      precioBase: 8000,
      mayorOfertaActual: 9200,
    },
  ],
  4: [
    {
      id: 401,
      subastaId: 4,
      nombre: 'Gibson Les Paul Standard 1959',
      descripcion: 'Réplica histórica de la icónica Les Paul Standard de 1959. Acabado sunburst, pastillas PAF originales bobinadas a mano. Mástil de caoba con diapasón de palo de rosa. En condición de coleccionista.',
      imagenUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
      fotos: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800'],
      precioBase: 120000,
      mayorOfertaActual: 135000,
    },
    {
      id: 402,
      subastaId: 4,
      nombre: 'Fender Stratocaster 1965',
      descripcion: 'Fender Stratocaster original de 1965, sunburst. Mástil con truss-rod de una pieza, pastillas originales con fecha de bobinado visible. Incluye estuche original Fender tweed.',
      imagenUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
      fotos: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800'],
      precioBase: 95000,
      mayorOfertaActual: 95000,
    },
    {
      id: 403,
      subastaId: 4,
      nombre: 'Marshall JTM45 1964',
      descripcion: 'Amplificador Marshall JTM45 original de 1964, cabezal. Transformadores Drake originales, KT66 en etapa de potencia. Restauración eléctrica completa respetando componentes vintage. Sonido legendario.',
      imagenUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
      fotos: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800'],
      precioBase: 45000,
      mayorOfertaActual: 52000,
    },
  ],
  5: [
    {
      id: 501,
      subastaId: 5,
      nombre: 'Porsche 911 Carrera 4S 2018',
      descripcion: 'Porsche 911 Carrera 4S 2018. 3.0L biturbo 420CV, PDK 8 velocidades, tracción integral. Color Carrara White Metallic, interiores en cuero negro. 48.000km verificados, historial de service completo en concesionario oficial.',
      imagenUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
      fotos: [
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
        'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
      ],
      precioBase: 980000,
      mayorOfertaActual: 1050000,
    },
    {
      id: 502,
      subastaId: 5,
      nombre: 'BMW M3 Competition 2021',
      descripcion: 'BMW M3 Competition F80 2021, Sao Paulo Yellow. 3.0L biturbo 510CV, M-DCT. Package Competition con diferencial activo y frenos M Carbon. 22.000km, único dueño, estado impecable.',
      imagenUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
      fotos: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800'],
      precioBase: 750000,
      mayorOfertaActual: 780000,
    },
  ],
};

export interface MockItem {
  id: number;
  subastaId: number;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  fotos: string[];
  precioBase: number;
  mayorOfertaActual: number;
}

// Lookup plano de items por itemId
export const MOCK_ITEMS: Record<number, MockItem> = Object.values(MOCK_ITEMS_POR_CATALOGO)
  .flat()
  .reduce((acc, item) => ({ ...acc, [item.id]: item }), {});

export const MOCK_HISTORIAL_PUJAS = [
  { id: 'p1', numeroPostor: 3, importe: 280000, timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
  { id: 'p2', numeroPostor: 7, importe: 275000, timestamp: new Date(Date.now() - 9 * 60000).toISOString() },
  { id: 'p3', numeroPostor: 3, importe: 268000, timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 'p4', numeroPostor: 12, importe: 262000, timestamp: new Date(Date.now() - 23 * 60000).toISOString() },
  { id: 'p5', numeroPostor: 7, importe: 255000, timestamp: new Date(Date.now() - 40 * 60000).toISOString() },
];

// NOTA BRAIN: cuando backend esté activo, reemplazar por ConexionSubastaResponse real.
// Campos: asistenteId, numeroPostor, mayorOfertaActual, pujaMinima, pujaMaxima, historialPujas, medioPago
export const MOCK_CONEXION = {
  asistenteId: 42,
  numeroPostor: 5,
  mayorOfertaActual: 280000,
  pujaMinima: 282800,
  pujaMaxima: 330000,
  historialPujas: MOCK_HISTORIAL_PUJAS,
  medioPago: { id: 1, tipo: 'CUENTA_BANCARIA', moneda: 'ARS', estado: 'VERIFICADO' },
};

export const MOCK_COMPRA = {
  id: 1,
  descripcionProducto: 'Mustang 67',
  importe: 280000,
  comision: 14000,
  costoEnvio: 5000,
  totalAPagar: 299000,
  retiroPersonal: false,
};

export const MOCK_MEDIOS_PAGO = [
  { id: 1, tipo: 'CUENTA_BANCARIA', moneda: 'ARS', estado: 'VERIFICADO', banco: 'BBVA', titular: 'Juan Pérez', cbu: '0170095520000001234567' },
  { id: 2, tipo: 'TARJETA_CREDITO', moneda: 'USD', estado: 'VERIFICADO', banco: 'Mercadopago', titular: 'Juan Pérez', numeroMasked: '1233••••••••79' },
];

export const MOCK_MULTAS = [
  {
    id: 1,
    importe: 28000,
    motivo: 'No presentó medios de pago dentro del plazo de 72hs tras ganar la subasta del ítem "Cámara Leica M6".',
    estado: 'PENDIENTE' as const,
    fechaGeneracion: new Date(Date.now() - 2 * 86400000).toISOString(),
    plazoVencimiento: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: 2,
    importe: 9500,
    motivo: 'No presentó medios de pago en subasta de "Guitarra Fender Stratocaster 1965".',
    estado: 'PAGADA' as const,
    fechaGeneracion: new Date(Date.now() - 30 * 86400000).toISOString(),
    plazoVencimiento: new Date(Date.now() - 27 * 86400000).toISOString(),
    fechaPago: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
];

export const MOCK_NOTIFICACIONES = [
  { id: 1, tipo: 'RESULTADO_COMPRA', titulo: '¡Ganaste la subasta!', cuerpo: 'Ganaste el artículo "Mustang 67" por $280.000. Tenés 72hs para completar el pago.', leida: false, fechaCreacion: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 2, tipo: 'MULTA_PENDIENTE', titulo: 'Multa pendiente', cuerpo: 'Tenés una multa de $28.000 pendiente. Tu cuenta está restringida hasta abonarla.', leida: false, fechaCreacion: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 3, tipo: 'ARTICULO_ACEPTADO', titulo: 'Artículo aceptado', cuerpo: 'Tu artículo "Agfa Optima 500" fue aceptado. Precio base propuesto: $8.000.', leida: true, fechaCreacion: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 4, tipo: 'CUENTA_ACTIVADA', titulo: 'Cuenta activada', cuerpo: 'Tu cuenta fue activada exitosamente. Ya podés participar en subastas.', leida: true, fechaCreacion: new Date(Date.now() - 20 * 86400000).toISOString() },
];

export const MOCK_METRICAS = {
  subastasAsistidas: 14,
  vecesGano: 3,
  totalPagado: 452000,
  totalOfertado: 1850000,
  porcentajeVictorias: 21,
  categoriasFrecuentes: ['Automóviles', 'Relojes', 'Arte'],
  historialPorSubasta: [
    { subastaId: 1, nombreSubasta: 'Mustang 67', gano: true, importePagado: 280000, pujas: [280000, 268000, 255000] },
    { subastaId: 2, nombreSubasta: 'Rolex Submariner', gano: false, importePagado: null, pujas: [52000, 49000] },
    { subastaId: 3, nombreSubasta: 'Gibson Les Paul 1959', gano: true, importePagado: 135000, pujas: [135000, 122000] },
    { subastaId: 4, nombreSubasta: 'Cámara Leica M6', gano: false, importePagado: null, pujas: [98000] },
  ],
};
