import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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

type NavProp = StackNavigationProp<ProfileStackParamList, 'Compras'>;

interface Compra {
  id: number;
  articulo: {
    nombre: string;
    imagenUrl?: string;
  };
  fechaSubasta: string;
  precioFinal: number;
  estado: 'ENTREGADO' | 'PENDIENTE' | string;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ estado }: { estado: string }) {
  const isEntregado = estado === 'ENTREGADO';
  return (
    <View style={[styles.badge, isEntregado ? styles.badgeGreen : styles.badgeGray]}>
      <Text style={[styles.badgeText, isEntregado ? styles.badgeTextGreen : styles.badgeTextGray]}>
        {isEntregado ? 'Entregado' : 'Pendiente'}
      </Text>
    </View>
  );
}

export function ComprasScreen() {
  const navigation = useNavigation<NavProp>();
  const { token, user } = useAuthStore();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompras = useCallback(async () => {
    if (!user?.id) return;
    try {
      setError(null);
      const res = await axios.get<Compra[]>(`${API_BASE_URL}/compras/mis-compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompras(res.data);
    } catch {
      setError('No se pudieron cargar tus compras.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchCompras();
  }, [fetchCompras]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompras();
  };

  const renderItem = ({ item }: { item: Compra }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('CompraDetalle', { compraId: item.id })}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {item.articulo?.imagenUrl ? (
          <Image
            source={{ uri: item.articulo.imagenUrl }}
            style={styles.thumbImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.articulo?.nombre ?? 'Artículo'}
        </Text>
        <Text style={styles.cardDate}>Subasta: {formatDate(item.fechaSubasta)}</Text>
        <Text style={styles.cardPrice}>$ {item.precioFinal.toLocaleString('es-AR')}</Text>
        <StatusBadge estado={item.estado} />
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Compras</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCompras}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={56} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No tenés compras</Text>
              <Text style={styles.emptySubtitle}>
                Cuando ganes una subasta, tus compras aparecerán aquí.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default ComprasScreen;

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
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeGreen: { backgroundColor: '#152C44' },
  badgeGray: { backgroundColor: '#152C44' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextGreen: { color: colors.success },
  badgeTextGray: { color: colors.textSecondary },
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
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
