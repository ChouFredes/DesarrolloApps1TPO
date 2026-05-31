import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

interface Multa {
  id: number;
  importe: number;
  motivo: string;
  estado: 'PENDIENTE' | 'PAGADA';
  fechaGeneracion: string;
  plazoVencimiento: string;
  fechaPago?: string;
}

export function MultasScreen() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [multas, setMultas] = useState<Multa[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagando, setPagando] = useState<number | null>(null);

  const fetchMultas = useCallback(async () => {
    try {
      const res = await axios.get<Multa[]>(`${API_BASE_URL}/multas/mis-multas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMultas(res.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las multas.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMultas(); }, [fetchMultas]);

  const handlePagar = async (multaId: number) => {
    setPagando(multaId);
    try {
      await axios.post(`${API_BASE_URL}/multas/${multaId}/pagar`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMultas();
    } catch {
      Alert.alert('Error', 'No se pudo procesar el pago.');
    } finally {
      setPagando(null);
    }
  };

  const hasPendiente = multas.some(m => m.estado === 'PENDIENTE');

  const renderItem = ({ item }: { item: Multa }) => (
    <View style={[styles.card, item.estado === 'PENDIENTE' && styles.cardPendiente]}>
      <View style={styles.cardHeader}>
        <Ionicons
          name={item.estado === 'PENDIENTE' ? 'warning' : 'checkmark-circle'}
          size={22}
          color={item.estado === 'PENDIENTE' ? colors.error : colors.success}
        />
        <Text style={[styles.estadoBadge, item.estado === 'PENDIENTE' ? styles.badgePendiente : styles.badgePagada]}>
          {item.estado}
        </Text>
      </View>
      <Text style={styles.motivo}>{item.motivo}</Text>
      <Text style={styles.importe}>$ {item.importe?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Text>
      {item.estado === 'PENDIENTE' && (
        <>
          <Text style={styles.plazo}>Plazo: {new Date(item.plazoVencimiento).toLocaleString('es-AR')}</Text>
          <TouchableOpacity
            style={styles.pagarBtn}
            onPress={() => handlePagar(item.id)}
            disabled={pagando === item.id}
          >
            {pagando === item.id
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.pagarBtnText}>Pagar multa</Text>}
          </TouchableOpacity>
        </>
      )}
      {item.estado === 'PAGADA' && item.fechaPago && (
        <Text style={styles.pagadaText}>Pagada el {new Date(item.fechaPago).toLocaleDateString('es-AR')}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Multas</Text>
        <View style={{ width: 40 }} />
      </View>

      {hasPendiente && (
        <View style={styles.alertBanner}>
          <Ionicons name="lock-closed" size={18} color="#fff" />
          <Text style={styles.alertText}>Cuenta restringida hasta abonar la multa pendiente</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={multas}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color={colors.success} />
              <Text style={styles.emptyText}>No tenés multas pendientes</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default MultasScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.error, paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  alertText: { color: '#fff', fontWeight: '600', fontSize: 13, flex: 1 },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.base, gap: spacing.sm, ...shadows.card,
  },
  cardPendiente: { borderLeftWidth: 4, borderLeftColor: colors.error },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  estadoBadge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  badgePendiente: { backgroundColor: '#FEE2E2', color: colors.error },
  badgePagada: { backgroundColor: '#D1FAE5', color: colors.success },
  motivo: { fontSize: 14, color: colors.text },
  importe: { fontSize: 22, fontWeight: '800', color: colors.accent },
  plazo: { fontSize: 12, color: colors.textSecondary },
  pagarBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  pagarBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pagadaText: { fontSize: 12, color: colors.success },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
});
