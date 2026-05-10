import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { ItemCard } from '../components/ItemCard';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

type NavProp = StackNavigationProp<HomeStackParamList, 'Catalogo'>;
type RouteProps = RouteProp<HomeStackParamList, 'Catalogo'>;

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
  items?: { id: number; nombre: string; imagenUrl?: string }[];
}

const CATEGORIAS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'ARTE', label: 'Arte' },
  { key: 'JOYAS', label: 'Joyas' },
  { key: 'RELOJES', label: 'Relojes' },
  { key: 'VEHICULOS', label: 'Vehículos' },
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.base * 2 - spacing.md) / 2;

export function CatalogoScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { token } = useAuthStore();

  const initialCat = route.params?.categoriaInicial ?? 'TODOS';
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const fetchSubastas = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await axios.get<Subasta[]>(`${API_BASE_URL}/subastas/abiertas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubastas(res.data);
    } catch {
      setError('No se pudo cargar el catálogo. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSubastas();
  }, [fetchSubastas]);

  const filteredSubastas =
    selectedCat === 'TODOS'
      ? subastas
      : subastas.filter((s) => s.categoria?.toUpperCase() === selectedCat);

  const handleJoin = async (subasta: Subasta) => {
    setJoiningId(subasta.id);
    try {
      await axios.post(
        `${API_BASE_URL}/subastas/${subasta.id}/conectar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const itemId = subasta.items?.[0]?.id ?? subasta.id;
      navigation.navigate('AuctionRoom', {
        subastaId: subasta.id,
        itemId,
        itemName: subasta.nombre,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? 'No se pudo conectar a la subasta. Intente nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setJoiningId(null);
    }
  };

  const renderItem = ({ item, index }: { item: Subasta; index: number }) => {
    const creatorName =
      item.subastadorNombre
        ? `${item.subastadorNombre} ${item.subastadorApellido ?? ''}`.trim()
        : 'Subastador';
    const imageUrl = item.items?.[0]?.imagenUrl ?? item.imagenUrl;
    const isJoining = joiningId === item.id;

    return (
      <ItemCard
        imageUrl={imageUrl}
        creatorName={creatorName}
        itemName={item.nombre}
        precioBase={`$ ${item.precioBase.toLocaleString()}`}
        showJoinButton
        onJoin={() => handleJoin(item)}
        onPress={() =>
          navigation.navigate('ItemDetail', {
            itemId: item.items?.[0]?.id ?? item.id,
            subastaId: item.id,
          })
        }
        style={StyleSheet.flatten([
          styles.card,
          index % 2 === 0 ? { marginRight: spacing.md / 2 } : { marginLeft: spacing.md / 2 },
        ])}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsRow}
      >
        {CATEGORIAS.map((cat) => {
          const active = selectedCat === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setSelectedCat(cat.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
          data={filteredSubastas}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="archive-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay subastas en esta categoría.</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

export default CatalogoScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  headerSpacer: { width: 32 },
  tabsRow: { flexGrow: 0 },
  tabsContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#E5E7EB',
    marginRight: spacing.sm,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: '#fff', fontWeight: '600' },
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
  card: { width: CARD_WIDTH, marginBottom: spacing.md },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
});
