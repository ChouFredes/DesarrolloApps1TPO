import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

interface PujaHistorial {
  subastaId: number;
  itemId: number;
  importe: number;
  ganador: boolean;
  timestamp: string;
}

interface Historial {
  subastasAsistidas: number;
  vecesGano: number;
  porcentajeVictorias: number;
  importeTotalPagado: number;
  importeTotalOfertado: number;
  pujas: PujaHistorial[];
}

export function MetricasScreen() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [historial, setHistorial] = useState<Historial | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistorial = useCallback(async () => {
    try {
      const res = await axios.get<Historial>(`${API_BASE_URL}/usuarios/me/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistorial(res.data);
    } catch {
      setHistorial(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchHistorial(); }, [fetchHistorial]);

  const renderPuja = ({ item }: { item: PujaHistorial }) => (
    <View style={styles.pujaCard}>
      <View style={styles.pujaRow}>
        <Text style={styles.pujaDesc}>Subasta #{item.subastaId} — Item #{item.itemId}</Text>
        <Ionicons
          name={item.ganador ? 'trophy' : 'remove-circle-outline'}
          size={16}
          color={item.ganador ? colors.accent : colors.textSecondary}
        />
      </View>
      <Text style={styles.pujaImporte}>$ {item.importe?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Text>
      <Text style={styles.pujaFecha}>{new Date(item.timestamp).toLocaleString('es-AR')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis métricas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.accent} /></View>
      ) : !historial ? (
        <View style={styles.centered}>
          <Ionicons name="bar-chart-outline" size={56} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Sin historial de participación</Text>
        </View>
      ) : (
        <FlatList
          data={historial.pujas ?? []}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderPuja}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListHeaderComponent={
            <View style={styles.statsGrid}>
              <StatCard icon="storefront" label="Subastas" value={historial.subastasAsistidas} />
              <StatCard icon="trophy" label="Victorias" value={historial.vecesGano} color={colors.accent} />
              <StatCard icon="stats-chart" label="% Victorias" value={`${historial.porcentajeVictorias ?? 0}%`} />
              <StatCard icon="cash" label="Total pagado" value={`$${(historial.importeTotalPagado ?? 0).toLocaleString('es-AR')}`} color={colors.success} />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyText}>Sin pujas registradas</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: any; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={color ?? colors.primary} />
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default MetricasScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: spacing.base,
    alignItems: 'center', gap: spacing.xs, ...shadows.card,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase' },
  pujaCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.sm,
    padding: spacing.md, gap: spacing.xs,
  },
  pujaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pujaDesc: { fontSize: 13, fontWeight: '600', color: colors.text },
  pujaImporte: { fontSize: 15, fontWeight: '700', color: colors.accent },
  pujaFecha: { fontSize: 11, color: colors.textSecondary },
  emptyList: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: colors.textSecondary },
});
