import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

type NavProp = StackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface Subasta {
  id: number;
  titulo: string;
  ubicacion: string;
  cantidadItems: number;
  fechaFin: string;
  categoria: string;
  imagenPortadaUrl?: string | null;
  subastadorNombre?: string;
  subastadorApellido?: string;
  items?: { id: number; nombre: string; imagenUrl?: string }[];
  isNew?: boolean;
}

const FILTERS = [
  { key: 'TODO', label: 'Todo' },
  { key: 'TENDENCIAS', label: 'Tendencias' },
  { key: 'NUEVO', label: 'Nuevo' },
];

export function SearchScreen() {
  const navigation = useNavigation<NavProp>();
  const { token } = useAuthStore();
  const [query, setQuery] = useState('');
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('TODO');
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const fetchSubastas = useCallback(async () => {
    try {
      const res = await axios.get<Subasta[]>(`${API_BASE_URL}/subastas/abiertas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Mark newest 30% as "new" heuristically by sorting by id descending
      const sorted = [...res.data].sort((a, b) => b.id - a.id);
      const newThreshold = Math.ceil(sorted.length * 0.3);
      const tagged = sorted.map((s, i) => ({ ...s, isNew: i < newThreshold }));
      setSubastas(tagged);
    } catch {
      // Fail silently; show empty state
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSubastas();
  }, [fetchSubastas]);

  const lowerQuery = query.toLowerCase();

  const filtered = subastas.filter((s) => {
    const matchesQuery =
      !query ||
      (s.titulo && s.titulo.toLowerCase().includes(lowerQuery)) ||
      (s.subastadorNombre && s.subastadorNombre.toLowerCase().includes(lowerQuery)) ||
      (s.subastadorApellido && s.subastadorApellido.toLowerCase().includes(lowerQuery)) ||
      (s.categoria && s.categoria.toLowerCase().includes(lowerQuery)) ||
      (s.ubicacion && s.ubicacion.toLowerCase().includes(lowerQuery));

    const matchesFilter =
      filter === 'TODO' ||
      (filter === 'NUEVO' && s.isNew) ||
      (filter === 'TENDENCIAS' && !s.isNew);

    return matchesQuery && matchesFilter;
  });

  const handleJoin = async (subasta: Subasta) => {
    setJoiningId(subasta.id);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/subastas/${subasta.id}/conectar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const itemId = res.data?.itemActual?.id;
      if (itemId) {
        navigation.navigate('AuctionRoom', {
          subastaId: subasta.id,
          itemId,
          itemName: res.data.itemActual.descripcionCatalogo || subasta.titulo || 'Artículo',
        });
      } else {
        navigation.navigate('CatalogoDetail', {
          subastaId: subasta.id,
        });
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.detalle ||
        e?.response?.data?.mensaje ||
        e?.response?.data?.message ||
        'No se pudo conectar a la subasta.';
      Alert.alert('Error', msg);
    } finally {
      setJoiningId(null);
    }
  };

  const renderItem = ({ item }: { item: Subasta }) => {
    const creatorName =
      item.subastadorNombre
        ? `${item.subastadorNombre} ${item.subastadorApellido ?? ''}`.trim()
        : 'Subastador';
    const imageUrl = item.imagenPortadaUrl
      ? (item.imagenPortadaUrl.startsWith('/') ? `${API_BASE_URL}${item.imagenPortadaUrl}` : item.imagenPortadaUrl)
      : null;
    const isJoining = joiningId === item.id;

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() =>
          navigation.navigate('CatalogoDetail', {
            subastaId: item.id,
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.resultImageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.resultImage} />
          ) : (
            <View style={styles.resultImagePlaceholder}>
              <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.resultInfo}>
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>Nuevo</Text>
            </View>
          )}
          <Text style={styles.resultCreator} numberOfLines={1}>{creatorName}</Text>
          <Text style={styles.resultName} numberOfLines={2}>{item.titulo}</Text>
          <Text style={styles.resultPrice}>{item.cantidadItems ?? 0} artículos</Text>
        </View>
        <TouchableOpacity
          style={[styles.joinBtn, isJoining && styles.joinBtnDisabled]}
          onPress={() => handleJoin(item)}
          disabled={isJoining}
          activeOpacity={0.8}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.joinBtnText}>Unirte</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Buscar</Text>
        <Text style={styles.subtitle}>Descubrí subastas</Text>
      </View>

      {/* Search input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Dueño, artista, categoría..."
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {query ? `Sin resultados para "${query}"` : 'No hay subastas disponibles.'}
              </Text>
            </View>
          }
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

export default SearchScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  titleBlock: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
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
  searchInput: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#E5E7EB',
  },
  filterPillActive: { backgroundColor: colors.primary },
  filterPillText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  filterPillTextActive: { color: '#fff', fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  resultImageWrap: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  resultImage: { width: '100%', height: '100%' },
  resultImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultInfo: { flex: 1, gap: 2 },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  resultCreator: { fontSize: 11, color: colors.textSecondary },
  resultName: { fontSize: 14, fontWeight: '600', color: colors.text },
  resultPrice: { fontSize: 13, fontWeight: '700', color: colors.text },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 64,
    alignItems: 'center',
  },
  joinBtnDisabled: { opacity: 0.5 },
  joinBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  separator: { height: spacing.sm },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
});
