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
  bg: '#0F1F35',
  card: '#0D1E33',
  surface: '#0A1626',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
};

interface Item {
  id: number;
  disponible: string;
}

interface Lote {
  id: number;
  titulo: string;
  fotoPortadaUrl?: string | null;
  estado: string;
  categoria?: string | null;
  duenioNombre?: string | null;
  items: Item[];
}

export function AdminSubastasScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLotes = useCallback(async () => {
    try {
      const res = await axios.get<Lote[]>(`${API_BASE_URL}/admin/lotes/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLotes(res.data ?? []);
    } catch {
      // se reintenta con pull-to-refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchLotes();
    }, [fetchLotes])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLotes();
  };

  const renderItem = ({ item }: { item: Lote }) => {
    const portada = item.fotoPortadaUrl
      ? (item.fotoPortadaUrl.startsWith('/') ? `${API_BASE_URL}${item.fotoPortadaUrl}` : item.fotoPortadaUrl)
      : undefined;
    const pendientes = (item.items ?? []).filter(
      (i) => i.disponible === 'pendiente_inspeccion' || i.disponible === 'inspeccion_aprobada'
    ).length;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AdminSubastaDetalle', { loteId: item.id })}
      >
        <View style={styles.thumb}>
          {portada ? (
            <Image source={{ uri: portada }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="images-outline" size={26} color={W.textSub} />
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo || 'Subasta sin título'}</Text>
          {item.duenioNombre ? (
            <Text style={styles.cardMeta}>Vendedor: {item.duenioNombre}</Text>
          ) : null}
          <Text style={styles.cardMeta}>
            {item.items?.length ?? 0} ítem{(item.items?.length ?? 0) !== 1 ? 's' : ''}
            {item.categoria ? ` · ${CATEGORIA_LABELS[item.categoria] ?? item.categoria}` : ''}
          </Text>
          {pendientes > 0 ? (
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={12} color="#FFB454" />
              <Text style={styles.badgeText}>{pendientes} por revisar</Text>
            </View>
          ) : null}
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
        <Text style={styles.headerTitle}>Ítems por revisar</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={W.accent} />
        </View>
      ) : (
        <FlatList
          data={lotes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={W.accent} />}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={52} color={W.textSub} />
              <Text style={styles.emptyTitle}>No hay subastas pendientes</Text>
              <Text style={styles.emptySubtitle}>Cuando un vendedor publique una subasta, aparecerá acá.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default AdminSubastasScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: W.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: W.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.base, paddingBottom: spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: W.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: W.border,
    padding: spacing.md,
  },
  thumb: { width: 72, height: 72, borderRadius: borderRadius.md, overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { width: '100%', height: '100%', backgroundColor: W.surface, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: W.text },
  cardMeta: { fontSize: 12, color: W.textSub },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFB454',
    marginTop: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFB454' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: W.text },
  emptySubtitle: { fontSize: 13, color: W.textSub, textAlign: 'center', lineHeight: 19 },
});
