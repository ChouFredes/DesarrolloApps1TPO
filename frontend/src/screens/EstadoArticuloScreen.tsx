import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

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
}

// ─── Estado banner ───────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { icon: string; color: string; label: string; bg: string }> = {
  pendiente_inspeccion: {
    icon: 'time-outline', color: '#D97706', label: 'Pendiente de inspección', bg: '#FEF3C7',
  },
  inspeccion_aprobada: {
    icon: 'checkmark-circle-outline', color: '#2563EB', label: 'Inspección aprobada', bg: '#DBEAFE',
  },
  propuesta_enviada: {
    icon: 'document-text-outline', color: '#7C3AED', label: 'Propuesta recibida', bg: '#EDE9FE',
  },
  aceptado_por_usuario: {
    icon: 'thumbs-up', color: colors.success, label: 'Propuesta aceptada', bg: '#D1FAE5',
  },
  rechazado_por_usuario: {
    icon: 'thumbs-down', color: '#EF4444', label: 'Propuesta rechazada', bg: '#FEE2E2',
  },
  rechazado: {
    icon: 'close-circle', color: '#EF4444', label: 'Rechazado', bg: '#FEE2E2',
  },
  incluido_en_subasta: {
    icon: 'megaphone', color: colors.accent, label: 'Incluido en subasta', bg: '#FEF9C3',
  },
  vendido: {
    icon: 'trophy', color: colors.accent, label: 'Vendido', bg: '#FEF9C3',
  },
  // compatibilidad con estados legacy
  PENDIENTE_INSPECCION: {
    icon: 'time-outline', color: '#D97706', label: 'Pendiente de inspección', bg: '#FEF3C7',
  },
  ACEPTADO: {
    icon: 'checkmark-circle-outline', color: colors.success, label: 'Aceptado', bg: '#D1FAE5',
  },
  RECHAZADO: {
    icon: 'close-circle', color: '#EF4444', label: 'Rechazado', bg: '#FEE2E2',
  },
  VENDIDO: {
    icon: 'trophy', color: colors.accent, label: 'Vendido', bg: '#FEF9C3',
  },
};

function EstadoBanner({ estado }: { estado: string }) {
  const c = ESTADO_CONFIG[estado] ?? {
    icon: 'help-circle', color: colors.textSecondary, label: estado, bg: colors.background,
  };
  return (
    <View style={[styles.banner, { backgroundColor: c.bg }]}>
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
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
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
                      <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
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
              <View style={[styles.infoBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="information-circle" size={20} color="#EF4444" />
                <Text style={[styles.infoText, { color: '#991B1B' }]}>
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
    backgroundColor: '#FEF2F2', borderRadius: borderRadius.md,
    padding: spacing.base, gap: spacing.sm, borderLeftWidth: 3, borderLeftColor: '#EF4444',
  },
  motivoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  motivoTitle: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  motivoText: { fontSize: 13, color: '#7F1D1D', lineHeight: 20 },
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
    flex: 1, borderWidth: 1.5, borderColor: '#EF4444', borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnTextRechazar: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  // Info box
  infoBox: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.base,
    ...shadows.card,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 20 },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  infoLabel: { fontSize: 13, color: colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  noData: { fontSize: 14, color: colors.textSecondary },
});
