import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import axios from 'axios';
import { spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

// ponytail: paleta navy local (igual a la home) sobreescribe el theme cálido, sin tocar styles
const colors = {
  primary: '#00EADF', accent: '#00EADF', background: '#0F1F35', surface: '#0D1E33',
  text: '#E1E1E1', textSecondary: 'rgba(225,225,225,0.5)', border: 'rgba(0,234,223,0.2)',
  success: '#7ED957', error: '#FF6B6B',
};

type RouteType = RouteProp<ProfileStackParamList, 'EstadoArticulo'>;

interface ArticuloDetalle {
  id: number;
  descripcion: string;
  disponible: string;
  estado: string;
  motivoRechazo?: string;
  subastaId?: number;
  precioBase?: number;
  comision?: number;
  polizaNro?: string;
  imagenUrl?: string;
  ofertaActual?: number;
}

// ─── Estado banner ───────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { icon: string; color: string; label: string; bg: string }> = {
  pendiente_inspeccion: {
    icon: 'time-outline', color: '#F5C542', label: 'Pendiente de inspección', bg: '#0D1E33',
  },
  inspeccion_aprobada: {
    icon: 'checkmark-circle-outline', color: '#4DA6FF', label: 'Inspección aprobada', bg: '#0D1E33',
  },
  propuesta_enviada: {
    icon: 'document-text-outline', color: '#B98CFF', label: 'Propuesta recibida', bg: '#0D1E33',
  },
  aceptado_por_usuario: {
    icon: 'thumbs-up', color: colors.success, label: 'Propuesta aceptada', bg: '#0D1E33',
  },
  rechazado_por_usuario: {
    icon: 'thumbs-down', color: '#FF6B6B', label: 'Propuesta rechazada', bg: '#0D1E33',
  },
  rechazado: {
    icon: 'close-circle', color: '#FF6B6B', label: 'Rechazado', bg: '#0D1E33',
  },
  incluido_en_subasta: {
    icon: 'megaphone', color: colors.accent, label: 'Incluido en subasta', bg: '#0D1E33',
  },
  vendido: {
    icon: 'trophy', color: colors.accent, label: 'Vendido', bg: '#0D1E33',
  },
  // compatibilidad con estados legacy
  PENDIENTE_INSPECCION: {
    icon: 'time-outline', color: '#F5C542', label: 'Pendiente de inspección', bg: '#0D1E33',
  },
  ACEPTADO: {
    icon: 'checkmark-circle-outline', color: colors.success, label: 'Aceptado', bg: '#0D1E33',
  },
  RECHAZADO: {
    icon: 'close-circle', color: '#FF6B6B', label: 'Rechazado', bg: '#0D1E33',
  },
  VENDIDO: {
    icon: 'trophy', color: colors.accent, label: 'Vendido', bg: '#0D1E33',
  },
};

function EstadoBanner({ estado }: { estado: string }) {
  const c = ESTADO_CONFIG[estado] ?? {
    icon: 'help-circle', color: colors.textSecondary, label: estado, bg: colors.background,
  };
  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderLeftWidth: 3, borderLeftColor: c.color }]}>
      <Ionicons name={c.icon as any} size={36} color={c.color} />
      <Text style={[styles.bannerLabel, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EstadoArticuloScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { articuloId } = route.params;
  const { token } = useAuthStore();

  const [articulo, setArticulo] = useState<ArticuloDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState(false);

  const fetchArticulo = useCallback(async () => {
    try {
      const res = await axios.get<ArticuloDetalle[]>(`${API_BASE_URL}/articulos/mis-articulos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const found = res.data.find((a: any) => a.id === articuloId);
      setArticulo(found ?? null);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el artículo.');
    } finally {
      setLoading(false);
    }
  }, [articuloId, token]);

  useEffect(() => { fetchArticulo(); }, [fetchArticulo]);

  const handleAccion = async (accion: 'aceptar-precio' | 'rechazar-precio') => {
    const label = accion === 'aceptar-precio' ? 'aceptar' : 'rechazar';
    Alert.alert(
      `Confirmar ${label}`,
      accion === 'aceptar-precio'
        ? '¿Aceptás la propuesta de precio y comisión enviada por la empresa?'
        : '¿Rechazás la propuesta? El artículo será devuelto con cargo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: accion === 'aceptar-precio' ? 'Aceptar' : 'Rechazar',
          style: accion === 'aceptar-precio' ? 'default' : 'destructive',
          onPress: async () => {
            setAccionando(true);
            try {
              await axios.post(`${API_BASE_URL}/articulos/${articuloId}/${accion}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
              });
              await fetchArticulo();
              Alert.alert(
                'OK',
                accion === 'aceptar-precio'
                  ? 'Propuesta aceptada. La empresa procederá con el seguro e inclusión en subasta.'
                  : 'Propuesta rechazada. Se gestionará la devolución del artículo (con cargo).'
              );
            } catch (err: any) {
              const msg = err?.response?.data?.mensaje || err?.response?.data?.message || 'No se pudo procesar la acción.';
              Alert.alert('Error', msg);
            } finally {
              setAccionando(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  const estado = articulo?.estado ?? articulo?.disponible ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estado del artículo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!articulo ? (
          <View style={styles.centered}>
            <Text style={styles.noData}>Artículo no encontrado.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.descripcion}>{articulo.descripcion}</Text>

            {/* Banner de estado */}
            <EstadoBanner estado={estado} />

            {/* Motivo de rechazo */}
            {(estado === 'rechazado' || estado === 'RECHAZADO') && articulo.motivoRechazo && (
              <View style={styles.motivoCard}>
                <View style={styles.motivoHeader}>
                  <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
                  <Text style={styles.motivoTitle}>Motivo del rechazo</Text>
                </View>
                <Text style={styles.motivoText}>{articulo.motivoRechazo}</Text>
              </View>
            )}

            {/* Propuesta de la empresa — esperando respuesta del usuario */}
            {estado === 'propuesta_enviada' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Propuesta de la empresa</Text>
                <Text style={styles.sectionSubtitle}>
                  Revisá los términos y decidí si aceptás o rechazás la propuesta.
                </Text>
                {articulo.precioBase != null && (
                  <InfoLine label="Precio base propuesto" value={`$ ${articulo.precioBase.toLocaleString('es-AR')}`} />
                )}
                {articulo.comision != null && (
                  <InfoLine label="Comisión de la empresa" value={`$ ${articulo.comision.toLocaleString('es-AR')}`} />
                )}
                {!accionando ? (
                  <View style={styles.accionRow}>
                    <TouchableOpacity style={styles.btnAceptar} onPress={() => handleAccion('aceptar-precio')}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={styles.btnText}>Aceptar propuesta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnRechazar} onPress={() => handleAccion('rechazar-precio')}>
                      <Ionicons name="close-circle-outline" size={16} color="#FF6B6B" />
                      <Text style={styles.btnTextRechazar}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
                )}
              </View>
            )}

            {/* Propuesta aceptada → esperando que la empresa asigne póliza y depósito */}
            {estado === 'aceptado_por_usuario' && (
              <View style={styles.infoBox}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.infoText}>
                  Aceptaste la propuesta. La empresa procederá con la contratación del seguro, asignación de depósito e inclusión en una futura subasta.
                </Text>
              </View>
            )}

            {/* Propuesta rechazada → devolución en proceso */}
            {estado === 'rechazado_por_usuario' && (
              <View style={[styles.infoBox, { backgroundColor: '#0D1E33', borderLeftWidth: 3, borderLeftColor: '#FF6B6B' }]}>
                <Ionicons name="information-circle" size={20} color="#FF6B6B" />
                <Text style={[styles.infoText, { color: '#FF6B6B' }]}>
                  Rechazaste la propuesta. Se procesará la devolución del artículo con cargo al usuario según las condiciones acordadas.
                </Text>
              </View>
            )}

            {/* Incluido en subasta */}
            {(estado === 'incluido_en_subasta' || estado === 'ACEPTADO') && articulo.subastaId && (
              <View style={styles.infoBox}>
                <Ionicons name="megaphone" size={20} color={colors.accent} />
                <Text style={styles.infoText}>
                  Tu artículo está incluido en la subasta #{articulo.subastaId}.
                </Text>
              </View>
            )}

            {/* Cómo va la subasta — oferta actual */}
            {(estado === 'incluido_en_subasta' || estado === 'vendido' || estado === 'VENDIDO') && articulo.subastaId && (
              <View style={styles.ofertaCard}>
                <Text style={styles.ofertaLabel}>
                  {estado === 'vendido' || estado === 'VENDIDO' ? 'Vendido en' : 'Oferta actual'}
                </Text>
                {articulo.ofertaActual != null ? (
                  <Text style={styles.ofertaValue}>$ {articulo.ofertaActual.toLocaleString('es-AR')}</Text>
                ) : (
                  <Text style={styles.ofertaVacia}>Todavía sin ofertas</Text>
                )}
                {articulo.precioBase != null && (
                  <Text style={styles.ofertaBase}>Base: $ {articulo.precioBase.toLocaleString('es-AR')}</Text>
                )}
              </View>
            )}

            {/* Póliza de seguro */}
            {articulo.polizaNro && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Póliza de seguro</Text>
                <InfoLine label="Número de póliza" value={articulo.polizaNro} />
              </View>
            )}

            {/* Precio y comisión (estados post-aceptación) */}
            {(estado === 'aceptado_por_usuario' || estado === 'incluido_en_subasta' || estado === 'ACEPTADO') &&
              (articulo.precioBase != null || articulo.comision != null) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Condiciones pactadas</Text>
                {articulo.precioBase != null && (
                  <InfoLine label="Precio base" value={`$ ${articulo.precioBase.toLocaleString('es-AR')}`} />
                )}
                {articulo.comision != null && (
                  <InfoLine label="Comisión" value={`$ ${articulo.comision.toLocaleString('es-AR')}`} />
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default EstadoArticuloScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl, gap: spacing.lg, paddingTop: spacing.base },
  descripcion: { fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 24 },
  banner: {
    alignItems: 'center', borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl, gap: spacing.sm,
  },
  bannerLabel: { fontSize: 16, fontWeight: '700' },
  // Motivo de rechazo
  motivoCard: {
    backgroundColor: '#0D1E33', borderRadius: borderRadius.md,
    padding: spacing.base, gap: spacing.sm, borderLeftWidth: 3, borderLeftColor: '#FF6B6B',
  },
  motivoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  motivoTitle: { fontSize: 14, fontWeight: '700', color: '#FF6B6B' },
  motivoText: { fontSize: 13, color: '#FF6B6B', lineHeight: 20 },
  // Secciones
  section: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.base, gap: spacing.sm, ...shadows.card,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  sectionSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  accionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btnAceptar: {
    flex: 1, backgroundColor: colors.success, borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
  },
  btnRechazar: {
    flex: 1, borderWidth: 1.5, borderColor: '#FF6B6B', borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnTextRechazar: { color: '#FF6B6B', fontWeight: '700', fontSize: 13 },
  // Info box
  infoBox: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.base,
    ...shadows.card,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 20 },
  ofertaCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.base, alignItems: 'center', gap: 4, ...shadows.card,
  },
  ofertaLabel: { fontSize: 12, color: colors.textSecondary, letterSpacing: 0.3 },
  ofertaValue: { fontSize: 30, fontWeight: '800', color: colors.accent },
  ofertaVacia: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, paddingVertical: 4 },
  ofertaBase: { fontSize: 12, color: colors.textSecondary },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  infoLabel: { fontSize: 13, color: colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  noData: { fontSize: 14, color: colors.textSecondary },
});
