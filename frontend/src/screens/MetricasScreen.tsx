import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

interface Metricas {
  totalSubastasAsistidas: number;
  totalGanadas: number;
  totalPujasRealizadas: number;
  importeTotalPagado: number;
  importeTotalOfertado: number;
}

function StatCard({
  icon, label, value, color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={color ?? colors.primary} />
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function MetricasScreen() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMetricas = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get<Metricas>(`${API_BASE_URL}/usuarios/me/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetricas(res.data);
    } catch {
      setError('No se pudieron cargar las métricas.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { cargarMetricas(); }, [cargarMetricas]);

  const porcentajeVictorias =
    metricas && metricas.totalSubastasAsistidas > 0
      ? Math.round((metricas.totalGanadas / metricas.totalSubastasAsistidas) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Métricas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={cargarMetricas}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : !metricas ? (
        <View style={styles.centered}>
          <Ionicons name="bar-chart-outline" size={56} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Sin historial de participación</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsGrid}>
            <StatCard
              icon="storefront-outline"
              label="Subastas asistidas"
              value={metricas.totalSubastasAsistidas}
            />
            <StatCard
              icon="trophy"
              label="Veces que ganó"
              value={metricas.totalGanadas}
              color={colors.accent}
            />
            <StatCard
              icon="cash-outline"
              label="Total pagado"
              value={`$ ${Number(metricas.importeTotalPagado).toLocaleString('es-AR')}`}
              color={colors.accent}
            />
            <StatCard
              icon="stats-chart"
              label="% de victorias"
              value={`${porcentajeVictorias}%`}
              color={colors.success}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen general</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pujas realizadas</Text>
                <Text style={styles.summaryValue}>{metricas.totalPujasRealizadas}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total ofertado</Text>
                <Text style={styles.summaryValue}>
                  $ {Number(metricas.importeTotalOfertado).toLocaleString('es-AR')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default MetricasScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  scrollContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xxl },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.card,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  summaryDivider: { height: 1, backgroundColor: colors.border },
});
