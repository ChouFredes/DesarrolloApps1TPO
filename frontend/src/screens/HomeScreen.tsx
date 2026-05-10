import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { ItemCard } from '../components/ItemCard';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

type NavProp = StackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface Subasta {
  id: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  fechaFin: string;
  categoria: string;
  imagenUrl?: string;
  subastadorNombre?: string;
  subastadorApellido?: string;
  items?: Item[];
}

interface Item {
  id: number;
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.base * 2 - spacing.md) / 2;

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { token, user } = useAuthStore();
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubastas = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get<Subasta[]>(`${API_BASE_URL}/subastas/abiertas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubastas(res.data);
    } catch (e: any) {
      setError('No se pudieron cargar las subastas. Intente nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSubastas();
  }, [fetchSubastas]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubastas();
  };

  const initials = user
    ? `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase()
    : '?';

  const nombre = user?.nombre ?? 'Usuario';

  const renderItem = ({ item, index }: { item: Subasta; index: number }) => {
    const creatorName =
      item.subastadorNombre
        ? `${item.subastadorNombre} ${item.subastadorApellido ?? ''}`.trim()
        : 'Subastador';

    const itemId = item.items?.[0]?.id ?? item.id;
    const imageUrl = item.items?.[0]?.imagenUrl ?? item.imagenUrl;

    return (
      <ItemCard
        imageUrl={imageUrl}
        creatorName={creatorName}
        itemName={item.nombre}
        precioBase={`$ ${item.precioBase.toLocaleString()}`}
        onPress={() =>
          navigation.navigate('ItemDetail', {
            itemId,
            subastaId: item.id,
          })
        }
        style={StyleSheet.flatten([styles.card, index % 2 === 0 ? { marginRight: spacing.md / 2 } : { marginLeft: spacing.md / 2 }])}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.greeting}>¡Hola {nombre}!</Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => navigation.navigate('Catalogo', {})}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.getParent()?.navigate('Search' as never)}
        activeOpacity={0.8}
      >
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.searchPlaceholder}>Buscar...</Text>
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
          <TouchableOpacity style={styles.retryBtn} onPress={fetchSubastas}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={subastas}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tendencias</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Catalogo', {})}>
                <Text style={styles.verTodo}>ver todo</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="archive-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay subastas activas en este momento.</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  greeting: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  searchPlaceholder: { color: colors.textSecondary, fontSize: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  errorText: { color: colors.textSecondary, textAlign: 'center', marginHorizontal: spacing.xl },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  columnWrapper: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  verTodo: { fontSize: 14, fontWeight: '600', color: colors.accent },
  card: { width: CARD_WIDTH, marginBottom: spacing.md },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
});
