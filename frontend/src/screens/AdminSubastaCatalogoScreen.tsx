import React, { useCallback, useState } from 'react';
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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { spacing, borderRadius } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

const W = {
  bg: '#0F1F35', card: '#0D1E33', surface: '#0A1626', text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)', accent: '#00EADF', border: 'rgba(0,234,223,0.2)', success: '#7ED957',
};

interface ItemCatalogo {
  id: number;
  productoId: number;
  descripcionCatalogo: string;
  precioBase?: number | null;
  comision?: number | null;
  subastado?: string | null;
  fotosUrls?: string[];
}

export function AdminSubastaCatalogoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const subastaId = route.params?.subastaId as number;
  const tituloParam = route.params?.titulo as string | undefined;
  const { token } = useAuthStore();
  const [items, setItems] = useState<ItemCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCatalogo = useCallback(async () => {
    try {
      const res = await axios.get<ItemCatalogo[]>(`${API_BASE_URL}/subastas/${subastaId}/catalogo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data ?? []);
    } catch {
      // pull-to-refresh reintenta
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [subastaId, token]);

  useFocusEffect(useCallback(() => { fetchCatalogo(); }, [fetchCatalogo]));

  const onRefresh = () => { setRefreshing(true); fetchCatalogo(); };

  const renderItem = ({ item }: { item: ItemCatalogo }) => {
    const raw = item.fotosUrls && item.fotosUrls.length > 0 ? item.fotosUrls[0] : undefined;
    const img = raw ? (raw.startsWith('/') ? `${API_BASE_URL}${raw}` : raw) : undefined;
    const vendido = item.subastado === 'si';
    return (
      <View style={styles.card}>
        <View style={styles.thumb}>
          {img ? (
            <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPh}><Ionicons name="cube-outline" size={22} color={W.textSub} /></View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.desc} numberOfLines={2}>{item.descripcionCatalogo}</Text>
          {item.precioBase != null ? <Text style={styles.precio}>Base: ${item.precioBase}</Text> : null}
          <View style={[styles.badge, { borderColor: vendido ? W.accent : W.success }]}>
            <Text style={[styles.badgeText, { color: vendido ? W.accent : W.success }]}>
              {vendido ? 'Vendido' : 'Disponible'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={W.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{tituloParam || 'Catálogo'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={W.accent} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={W.accent} />}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={
            <Text style={styles.count}>{items.length} ítem{items.length !== 1 ? 's' : ''} en el catálogo</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color={W.textSub} />
              <Text style={styles.emptyText}>Esta subasta no tiene ítems.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default AdminSubastaCatalogoScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: W.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: W.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.base, paddingBottom: spacing.xxl },
  count: { fontSize: 12, color: W.textSub, marginBottom: spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: W.card, borderRadius: 12, borderWidth: 1, borderColor: W.border, padding: spacing.md,
  },
  thumb: { width: 60, height: 60, borderRadius: borderRadius.md, overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%' },
  thumbPh: { width: '100%', height: '100%', backgroundColor: W.surface, justifyContent: 'center', alignItems: 'center' },
  desc: { fontSize: 14, fontWeight: '600', color: W.text },
  precio: { fontSize: 12, color: W.accent, fontWeight: '700', marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1, marginTop: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: 60 },
  emptyText: { fontSize: 13, color: W.textSub },
});
