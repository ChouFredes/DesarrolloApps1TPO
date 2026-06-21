import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type RouteProps = RouteProp<ProfileStackParamList, 'CompraDetalle'>;

interface CompraDetalle {
  id: number;
  descripcionProducto: string;
  importe: number;
  comision: number;
  costoEnvio: number;
  totalAPagar: number;
  retiroPersonal: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function PriceRow({
  label,
  value,
  bold,
  accent,
  large,
}: {
  label: string;
  value: number;
  bold?: boolean;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, bold && styles.priceLabelBold, large && styles.priceLabelLarge]}>
        {label}
      </Text>
      <Text
        style={[
          styles.priceValue,
          bold && styles.priceValueBold,
          accent && styles.priceValueAccent,
          large && styles.priceValueLarge,
        ]}
      >
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export function CompraDetalleScreen() {
  // useNavigation typed as any to allow cross-stack navigation (Home > PostSubastaGanador)
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const { compraId } = route.params;
  const { token } = useAuthStore();

  const [compra, setCompra] = useState<CompraDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Entrance animation for the main card
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [cardOpacity, cardTranslate]);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const res = await axios.get<CompraDetalle>(
          `${API_BASE_URL}/compras/${compraId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCompra(res.data);
      } catch {
        setError('No se pudo cargar el detalle de la compra.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [compraId, token]);

  const handlePagar = () => {
    // Cross-stack navigation: Home tab → PostSubastaGanador screen
    navigation.navigate('Home', {
      screen: 'PostSubastaGanador',
      params: { compraId: compra?.id ?? compraId },
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Detalle de compra</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !compra) {
    return (
      <SafeAreaView style={styles.safe}>
        {renderHeader()}
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error ?? 'Compra no encontrada.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {renderHeader()}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }}
        >
          {/* Item card */}
          <View style={styles.itemCard}>
            <View style={styles.itemThumb}>
              <View style={styles.itemThumbPlaceholder}>
                <Ionicons name="cube-outline" size={28} color={colors.textSecondary} />
              </View>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={3}>
                {compra.descripcionProducto}
              </Text>
              {compra.retiroPersonal && (
                <View style={styles.retiroBadge}>
                  <Ionicons name="walk-outline" size={14} color={colors.accent} />
                  <Text style={styles.retiroText}>Retiro personal</Text>
                </View>
              )}
            </View>
          </View>

          {/* Price breakdown */}
          <View style={styles.priceCard}>
            <Text style={styles.sectionTitle}>Resumen de pago</Text>

            <PriceRow label="Precio subastado" value={Number(compra.importe)} />
            <PriceRow label="Comisión" value={Number(compra.comision)} />
            <PriceRow label="Costo de envío" value={Number(compra.costoEnvio)} />

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a pagar</Text>
              <Text style={styles.totalValue}>{formatCurrency(Number(compra.totalAPagar))}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.pagarBtn}
            onPress={handlePagar}
            activeOpacity={0.85}
          >
            <Ionicons name="card-outline" size={20} color="#0A1626" />
            <Text style={styles.pagarText}>Pagar ahora</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default CompraDetalleScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  retryText: { color: '#0A1626', fontWeight: '600' },

  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  },

  // Item card
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    flexDirection: 'row',
    gap: spacing.md,
    ...shadows.card,
    marginBottom: spacing.base,
  },
  itemThumb: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  itemThumbImage: { width: '100%', height: '100%' },
  itemThumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  itemDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  retiroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#152C44',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  retiroText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },

  // Status card
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
    marginBottom: spacing.base,
  },
  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statusInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  statusTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Price card
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    gap: spacing.sm,
    ...shadows.card,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceLabelBold: {
    color: colors.text,
    fontWeight: '700',
  },
  priceLabelLarge: {
    fontSize: 16,
  },
  priceValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  priceValueBold: {
    fontWeight: '700',
  },
  priceValueAccent: {
    color: colors.accent,
  },
  priceValueLarge: {
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  // Total highlighted row
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.4)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },

  // Pay button
  pagarBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.card,
    marginBottom: spacing.base,
  },
  pagarText: {
    color: '#0A1626',
    fontWeight: '700',
    fontSize: 16,
  },

  // Info row (non-pending states)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
});
