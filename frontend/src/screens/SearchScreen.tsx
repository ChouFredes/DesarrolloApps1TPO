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
  const navigation = useNavigation<any>();
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
        navigation.navigate('Home', {
          screen: 'AuctionRoom',
          params: {
            subastaId: subasta.id,
            itemId,
            itemName: res.data.itemActual.descripcionCatalogo || subasta.titulo || 'Artículo',
          },
        });
      } else {
        navigation.navigate('Home', {
          screen: 'CatalogoDetail',
          params: {
            subastaId: subasta.id,
          },
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
          navigation.navigate('Home', {
            screen: 'CatalogoDetail',
            params: {
              subastaId: item.id,
            },
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.resultImageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.resultImage} />
          ) : (
            <View style={styles.resultImagePlaceholder}>
              <Ionicons name="image-outline" size={28} color="rgba(225,225,225,0.25)" />
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
            <ActivityIndicator size="small" color="#0A1626" />
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
        <Ionicons name="search-outline" size={18} color="rgba(0,234,223,0.5)" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Dueño, artista, categoría..."
          placeholderTextColor="rgba(225,225,225,0.35)"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color="rgba(225,225,225,0.4)" />
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
          <ActivityIndicator size="large" color="#00EADF" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="rgba(225,225,225,0.25)" />
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
  safe: { flex: 1, backgroundColor: '#0F1F35' },

  // Título
  titleBlock: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E1E1E1',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(225,225,225,0.5)',
    marginTop: 2,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152C44',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0,234,223,0.2)',
  },
  searchInput: {
    flex: 1,
    color: '#E1E1E1',
    fontSize: 14,
    padding: 0,
  },

  // Filter pills
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,        // padding vertical para que no se corten
    marginBottom: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.25)',
    backgroundColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: '#00EADF',
    borderColor: '#00EADF',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(225,225,225,0.5)',
  },
  filterPillTextActive: {
    color: '#0A1626',          // texto OSCURO sobre fondo cyan — siempre
    fontWeight: '700',
  },

  // Loading / empty
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(225,225,225,0.5)',
    textAlign: 'center',
    fontSize: 14,
  },

  // Lista
  listContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },
  separator: { height: 10 },

  // Result card
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#0D1E33',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.2)',
    shadowColor: '#00EADF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  resultImageWrap: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0F2A42',
  },
  resultImage: { width: '100%', height: '100%' },
  resultImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: { flex: 1, gap: 2 },

  // Badge "Nuevo"
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,234,223,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,234,223,0.4)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },
  newBadgeText: {
    color: '#00EADF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  resultCreator: { fontSize: 11, color: 'rgba(225,225,225,0.45)' },
  resultName: { fontSize: 14, fontWeight: '600', color: '#E1E1E1' },
  resultPrice: { fontSize: 13, fontWeight: '600', color: 'rgba(225,225,225,0.6)' },

  // Botón Unirte
  joinBtn: {
    backgroundColor: '#00EADF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  joinBtnDisabled: { opacity: 0.4 },
  joinBtnText: {
    color: '#0A1626',          // texto oscuro sobre cyan
    fontSize: 12,
    fontWeight: '700',
  },
});
