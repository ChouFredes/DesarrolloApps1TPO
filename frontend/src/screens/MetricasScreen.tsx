import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { MOCK_METRICAS } from '../mocks/data';

const DEV_MODE = true;

// Shape aligned with MOCK_METRICAS
interface SubastaHistorial {
  subastaId: number;
  nombreSubasta: string;
  gano: boolean;
  importePagado: number | null;
  pujas: number[];
}

interface Metricas {
  subastasAsistidas: number;
  vecesGano: number;
  totalPagado: number;
  totalOfertado: number;
  porcentajeVictorias: number;
  categoriasFrecuentes: string[];
  historialPorSubasta: SubastaHistorial[];
}

// ── Stat card ─────────────────────────────────────────────────────────────
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

// ── Collapsible subasta row ────────────────────────────────────────────────
function SubastaRow({ item }: { item: SubastaHistorial }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.subastaCard}>
      <TouchableOpacity
        style={styles.subastaHeader}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.subastaHeaderLeft}>
          {item.gano && (
            <Ionicons name="trophy" size={16} color={colors.accent} style={styles.trophyIcon} />
          )}
          <Text style={styles.subastaNombre} numberOfLines={1}>
            {item.nombreSubasta}
          </Text>
        </View>
        <View style={styles.subastaHeaderRight}>
          {item.gano ? (
            <Text style={styles.ganoBadge}>Ganada</Text>
          ) : (
            <Text style={styles.perdidoBadge}>Sin ganar</Text>
          )}
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {open && (
        <View style={styles.subastaDetail}>
          {item.importePagado != null && (
            <Text style={styles.importeLabel}>
              Importe pagado:{' '}
              <Text style={styles.importeValue}>
                $ {item.importePagado.toLocaleString('es-AR')}
              </Text>
            </Text>
          )}
          <Text style={styles.pujasTitle}>Mis pujas:</Text>
          {item.pujas.map((p, idx) => (
            <View key={idx} style={styles.pujaRow}>
              <Text style={styles.pujaBullet}>•</Text>
              <Text style={styles.pujaImporte}>
                $ {p.toLocaleString('es-AR')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── MetricasScreen ─────────────────────────────────────────────────────────
export function MetricasScreen() {
  const navigation = useNavigation();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarMetricas = useCallback(() => {
    if (DEV_MODE) {
      // Map MOCK_METRICAS fields to our Metricas interface
      const m = MOCK_METRICAS;
      setMetricas({
        subastasAsistidas: m.subastasAsistidas,
        vecesGano: m.vecesGano,
        totalPagado: m.totalPagado,
        totalOfertado: m.totalOfertado,
        porcentajeVictorias: m.porcentajeVictorias,
        categoriasFrecuentes: m.categoriasFrecuentes,
        historialPorSubasta: m.historialPorSubasta,
      });
      setLoading(false);
      return;
    }
    // Real fetch placeholder
    setLoading(false);
  }, []);

  useEffect(() => { cargarMetricas(); }, [cargarMetricas]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
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
          {/* 4 stat cards — grid 2x2 */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="storefront-outline"
              label="Subastas asistidas"
              value={metricas.subastasAsistidas}
            />
            <StatCard
              icon="trophy"
              label="Veces que ganó"
              value={metricas.vecesGano}
              color={colors.accent}
            />
            <StatCard
              icon="cash-outline"
              label="Total pagado"
              value={`$ ${metricas.totalPagado.toLocaleString('es-AR')}`}
              color={colors.accent}
            />
            <StatCard
              icon="stats-chart"
              label="% de victorias"
              value={`${metricas.porcentajeVictorias}%`}
              color={colors.success}
            />
          </View>

          {/* Categorías frecuentes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorías frecuentes</Text>
            <View style={styles.chipRow}>
              {metricas.categoriasFrecuentes.map((cat) => (
                <View key={cat} style={styles.chip}>
                  <Text style={styles.chipText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Historial por subasta */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial por subasta</Text>
            <View style={styles.historialList}>
              {metricas.historialPorSubasta.map((item) => (
                <SubastaRow key={item.subastaId} item={item} />
              ))}
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
  scrollContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xxl },

  // Stats grid 2x2
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

  // Sections
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },

  // Category chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Historial
  historialList: { gap: spacing.sm },
  subastaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  subastaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  subastaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  trophyIcon: { marginRight: spacing.xs },
  subastaNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  subastaHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ganoBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  perdidoBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  subastaDetail: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  importeLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
  importeValue: { fontWeight: '700', color: colors.accent },
  pujasTitle: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
  pujaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pujaBullet: { color: colors.textSecondary, fontSize: 14 },
  pujaImporte: { fontSize: 13, color: colors.text },
});
