import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

type NavProp = StackNavigationProp<ProfileStackParamList, 'CompraDetalle'>;
type RouteProps = RouteProp<ProfileStackParamList, 'CompraDetalle'>;

interface CompraDetalle {
  id: number;
  articulo: {
    nombre: string;
    imagenUrl?: string;
  };
  precioSubastado: number;
  comision: number;
  costoEnvio: number;
  total: number;
  estado: string;
  retiroPersonal?: boolean;
  fechaSubasta?: string;
}

function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

export function CompraDetalleScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { compraId } = route.params;
  const { token, user } = useAuthStore();

  const [compra, setCompra] = useState<CompraDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
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
  }, [compraId, token, user]);

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
        {/* Item card */}
        <View style={styles.itemCard}>
          <View style={styles.itemThumb}>
            {compra.articulo?.imagenUrl ? (
              <Image
                source={{ uri: compra.articulo.imagenUrl }}
                style={styles.itemThumbImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.itemThumbPlaceholder}>
                <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
              </View>
            )}
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={3}>
              {compra.articulo?.nombre ?? 'Artículo'}
            </Text>
            {compra.fechaSubasta && (
              <Text style={styles.itemDate}>
                {new Date(compra.fechaSubasta).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}
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

          <PriceRow label="Precio subastado" value={compra.precioSubastado} />
          <PriceRow label="Comisión" value={compra.comision} />
          <PriceRow label="Costo de envío" value={compra.costoEnvio} />

          <View style={styles.divider} />

          <PriceRow label="Total a pagar" value={compra.total} bold accent large />
        </View>

        {/* Status */}
        <View style={styles.statusCard}>
          <Ionicons
            name={compra.estado === 'ENTREGADO' ? 'checkmark-circle' : 'time-outline'}
            size={24}
            color={compra.estado === 'ENTREGADO' ? colors.success : colors.accent}
          />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {compra.estado === 'ENTREGADO' ? 'Entregado' : 'Pendiente de entrega'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {compra.estado === 'ENTREGADO'
                ? 'Tu artículo fue entregado correctamente.'
                : 'Tu compra está siendo procesada.'}
            </Text>
          </View>
        </View>
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
  retryText: { color: '#fff', fontWeight: '600' },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    flexDirection: 'row',
    gap: spacing.md,
    ...shadows.card,
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
    backgroundColor: '#FFF3E0',
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
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    gap: spacing.sm,
    ...shadows.card,
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
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  statusInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statusSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
