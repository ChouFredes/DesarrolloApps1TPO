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
  estado: string;
  subastaId?: number;
  precioBase?: number;
  comision?: number;
  polizaNro?: string;
}

function EstadoBanner({ estado }: { estado: string }) {
  const config: Record<string, { icon: string; color: string; label: string; bg: string }> = {
    PENDIENTE_INSPECCION: { icon: 'time', color: '#D97706', label: 'En inspección', bg: '#FEF3C7' },
    ACEPTADO: { icon: 'checkmark-circle', color: colors.success, label: 'Aceptado', bg: '#D1FAE5' },
    RECHAZADO: { icon: 'close-circle', color: colors.error, label: 'Rechazado', bg: '#FEE2E2' },
    precio_aceptado: { icon: 'thumbs-up', color: colors.success, label: 'Precio aceptado', bg: '#D1FAE5' },
    precio_rechazado: { icon: 'thumbs-down', color: colors.error, label: 'Precio rechazado', bg: '#FEE2E2' },
    VENDIDO: { icon: 'trophy', color: colors.accent, label: 'Vendido', bg: '#FEF9C3' },
  };
  const c = config[estado] ?? { icon: 'help-circle', color: colors.textSecondary, label: estado, bg: colors.background };
  return (
    <View style={[styles.banner, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon as any} size={32} color={c.color} />
      <Text style={[styles.bannerLabel, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

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
    setAccionando(true);
    try {
      await axios.post(`${API_BASE_URL}/articulos/${articuloId}/${accion}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchArticulo();
      Alert.alert('OK', accion === 'aceptar-precio' ? 'Propuesta aceptada.' : 'Propuesta rechazada.');
    } catch {
      Alert.alert('Error', 'No se pudo procesar la acción.');
    } finally {
      setAccionando(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

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
            <EstadoBanner estado={articulo.estado} />

            {articulo.estado === 'ACEPTADO' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Propuesta de la empresa</Text>
                {articulo.precioBase != null && (
                  <InfoLine label="Precio base propuesto" value={`$ ${articulo.precioBase.toLocaleString('es-AR')}`} />
                )}
                {articulo.comision != null && (
                  <InfoLine label="Comisión" value={`$ ${articulo.comision.toLocaleString('es-AR')}`} />
                )}
                {!accionando ? (
                  <View style={styles.accionRow}>
                    <TouchableOpacity style={styles.btnAceptar} onPress={() => handleAccion('aceptar-precio')}>
                      <Text style={styles.btnText}>Aceptar propuesta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnRechazar} onPress={() => handleAccion('rechazar-precio')}>
                      <Text style={styles.btnTextRechazar}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ActivityIndicator color={colors.primary} />
                )}
              </View>
            )}

            {articulo.estado === 'precio_aceptado' && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color={colors.primary} />
                <Text style={styles.infoText}>La empresa fue notificada. Tu artículo será incluido en la próxima subasta disponible.</Text>
              </View>
            )}

            {articulo.estado === 'precio_rechazado' && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color={colors.error} />
                <Text style={styles.infoText}>Rechazaste la propuesta. Se procesará la devolución del artículo (con cargo).</Text>
              </View>
            )}

            {articulo.polizaNro && (
              <View style={styles.section}>
                <InfoLine label="Póliza de seguro" value={articulo.polizaNro} />
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl, gap: spacing.lg },
  descripcion: { fontSize: 18, fontWeight: '700', color: colors.text },
  banner: { alignItems: 'center', borderRadius: borderRadius.lg, paddingVertical: spacing.xl, gap: spacing.sm },
  bannerLabel: { fontSize: 16, fontWeight: '700' },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.base, gap: spacing.sm, ...shadows.card },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  accionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btnAceptar: { flex: 1, backgroundColor: colors.success, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center' },
  btnRechazar: { flex: 1, borderWidth: 1, borderColor: colors.error, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnTextRechazar: { color: colors.error, fontWeight: '700' },
  infoBox: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.base,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.text },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 13, color: colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  noData: { fontSize: 14, color: colors.textSecondary },
});
