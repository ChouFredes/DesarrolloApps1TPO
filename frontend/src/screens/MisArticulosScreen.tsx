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
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

type NavProp = StackNavigationProp<ProfileStackParamList, 'MisArticulos'>;

type ArticuloEstado = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | string;

interface Articulo {
  id: number;
  nombre: string;
  descripcion: string;
  estado: ArticuloEstado;
  imagenUrl?: string;
  nroPoliza?: string;
}

function StatusBadge({ estado }: { estado: ArticuloEstado }) {
  let bgColor = '#F5F5F5';
  let textColor = colors.textSecondary;
  let label = estado;

  switch (estado) {
    case 'ACEPTADO':
      bgColor = '#E8F5E9';
      textColor = colors.success;
      label = 'Aceptado';
      break;
    case 'RECHAZADO':
      bgColor = '#FFEBEE';
      textColor = colors.error;
      label = 'Rechazado';
      break;
    case 'PENDIENTE':
      bgColor = '#F5F5F5';
      textColor = colors.textSecondary;
      label = 'Pendiente';
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export function MisArticulosScreen() {
  const navigation = useNavigation<NavProp>();
  const { token } = useAuthStore();
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticulos = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get<Articulo[]>(`${API_BASE_URL}/owner/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticulos(res.data);
    } catch {
      setError('No se pudieron cargar los artículos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchArticulos();
  }, [fetchArticulos]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchArticulos();
  };

  const renderItem = ({ item }: { item: Articulo }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ArticuloDetalle', { articuloId: item.id })}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {item.imagenUrl ? (
          <Image source={{ uri: item.imagenUrl }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.nombre}
        </Text>
        <StatusBadge estado={item.estado} />
        {item.nroPoliza ? (
          <Text style={styles.polizaText} numberOfLines={1}>
            Póliza: {item.nroPoliza}
          </Text>
        ) : null}
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
        <Text style={styles.headerTitle}>Mis Artículos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Solicitar artículo button */}
      <TouchableOpacity
        style={styles.solicitarBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SolicitarArticulo')}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.solicitarBtnText}>Solicitar artículo</Text>
      </TouchableOpacity>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchArticulos}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={articulos}
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
              <Ionicons name="cube-outline" size={56} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No tenés artículos</Text>
              <Text style={styles.emptySubtitle}>
                Solicitá tu primer artículo para comenzar a subastar.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default MisArticulosScreen;

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
  solicitarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    justifyContent: 'center',
    ...shadows.card,
  },
  solicitarBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
    width: 80,
    height: 80,
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
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  polizaText: {
    fontSize: 11,
    color: colors.textSecondary,
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
