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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { spacing, borderRadius } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { CATEGORIA_LABELS } from './VendedorHomeScreen';

const W = {
  bg: '#0F1F35', card: '#0D1E33', surface: '#0A1626', text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)', accent: '#00EADF', border: 'rgba(0,234,223,0.2)',
};

interface Subasta {
  id: number;
  titulo: string;
  categoria?: string | null;
  ubicacion?: string | null;
  fechaFin?: string | null;
  cantidadItems: number;
  imagenPortadaUrl?: string | null;
}

function fechaCorta(iso?: string | null): string | null {
  if (!iso) return null;
  return iso.split('T')[0]; // YYYY-MM-DD
}

export function AdminSubastasActivasScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubastas = useCallback(async () => {
    try {
      const res = await axios.get<Subasta[]>(`${API_BASE_URL}/subastas/abiertas?todas=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubastas(res.data ?? []);
    } catch {
      // pull-to-refresh reintenta
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchSubastas(); }, [fetchSubastas]));

  const onRefresh = () => { setRefreshing(true); fetchSubastas(); };

  const renderItem = ({ item }: { item: Subasta }) => {
    const img = item.imagenPortadaUrl
      ? (item.imagenPortadaUrl.startsWith('/') ? `${API_BASE_URL}${item.imagenPortadaUrl}` : item.imagenPortadaUrl)
      : undefined;
    const fin = fechaCorta(item.fechaFin);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AdminSubastaCatalogo', { subastaId: item.id, titulo: item.titulo })}
      >
        <View style={styles.thumb}>
          {img ? (
            <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPh}><Ionicons name="hammer-outline" size={24} color={W.textSub} /></View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>{item.titulo || 'Subasta'}</Text>
          <Text style={styles.meta}>
            {item.cantidadItems} ítem{item.cantidadItems !== 1 ? 's' : ''}
            {item.categoria ? ` · ${CATEGORIA_LABELS[item.categoria] ?? item.categoria}` : ''}
          </Text>
          <View style={styles.badge}>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>En vivo{fin ? ` · hasta ${fin}` : ''}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={W.textSub} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={W.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subastas activas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={W.accent} /></View>
      ) : (
        <FlatList
          data={subastas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={W.accent} />}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="hammer-outline" size={52} color={W.textSub} />
              <Text style={styles.emptyTitle}>No hay subastas activas</Text>
              <Text style={styles.emptySub}>Cuando armes una subasta, va a aparecer acá en vivo.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default AdminSubastasActivasScreen;

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
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: W.card, borderRadius: 14, borderWidth: 1, borderColor: W.border, padding: spacing.md,
  },
  thumb: { width: 64, height: 64, borderRadius: borderRadius.md, overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%' },
  thumbPh: { width: '100%', height: '100%', backgroundColor: W.surface, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: W.text },
  meta: { fontSize: 12, color: W.textSub, marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: W.accent, marginTop: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: W.accent },
  badgeText: { fontSize: 11, fontWeight: '700', color: W.accent },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: W.text },
  emptySub: { fontSize: 13, color: W.textSub, textAlign: 'center', lineHeight: 19 },
});
