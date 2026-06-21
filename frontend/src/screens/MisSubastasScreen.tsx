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
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { spacing, borderRadius } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { CATEGORIA_LABELS } from './VendedorHomeScreen';
import { VendedorItemsStackParamList } from '../navigation/VendedorNavigator';

// ─── Paleta navy (igual que Panel / Armar Subasta) ───────────────────────────
const W = {
  bg: '#0F1F35',
  card: '#0D1E33',
  surface: '#0A1626',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
};

interface ItemResumen {
  id: number;
  estado: string;
}

interface Lote {
  id: number;
  titulo: string;
  fotoPortadaUrl?: string | null;
  estado: string;
  categoria?: string | null;
  items: ItemResumen[];
}

// Etiqueta + color del estado del lote (derivado en el backend)
export function estadoLote(estado: string): { label: string; color: string } {
  switch (estado) {
    case 'pendiente_inspeccion':
      return { label: 'En revisión', color: '#FFB454' };
    case 'inspeccion_aprobada':
      return { label: 'Inspección aprobada', color: '#7ED957' };
    case 'propuesta_enviada':
      return { label: 'Propuesta recibida', color: '#B794F6' };
    case 'aceptado_por_usuario':
      return { label: 'Aceptada', color: '#7ED957' };
    case 'rechazado':
      return { label: 'Rechazada', color: '#FF6B6B' };
    case 'vendido':
      return { label: 'Vendida', color: '#00EADF' };
    default:
      return { label: 'En proceso', color: '#9BA8B5' };
  }
}

type Nav = StackNavigationProp<VendedorItemsStackParamList, 'MisSubastas'>;

export function MisSubastasScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuthStore();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLotes = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get<Lote[]>(`${API_BASE_URL}/articulos/lotes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLotes(res.data ?? []);
    } catch {
      setError('No se pudieron cargar tus subastas.');
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
    const est = estadoLote(item.estado);
    const portada = item.fotoPortadaUrl
      ? (item.fotoPortadaUrl.startsWith('/') ? `${API_BASE_URL}${item.fotoPortadaUrl}` : item.fotoPortadaUrl)
      : undefined;
    const cantItems = item.items?.length ?? 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SubastaDetalleVendedor', { loteId: item.id })}
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
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.titulo || 'Subasta sin título'}
          </Text>
          <Text style={styles.cardMeta}>
            {cantItems} ítem{cantItems !== 1 ? 's' : ''}
            {item.categoria ? ` · ${CATEGORIA_LABELS[item.categoria] ?? item.categoria}` : ''}
          </Text>
          <View style={[styles.badge, { borderColor: est.color }]}>
            <Text style={[styles.badgeText, { color: est.color }]}>{est.label}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={W.textSub} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Artículos</Text>
      </View>

      <TouchableOpacity
        style={styles.cta}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('SolicitarArticulo')}
      >
        <Ionicons name="add-circle" size={22} color={W.surface} />
        <Text style={styles.ctaText}>Cargar artículos</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={W.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={W.textSub} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchLotes}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lotes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={W.accent} />
          }
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={56} color={W.textSub} />
              <Text style={styles.emptyTitle}>Todavía no cargaste artículos</Text>
              <Text style={styles.emptySubtitle}>
                Tocá "Cargar artículos" para enviar tus bienes a revisión de la empresa.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default MisSubastasScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: W.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: W.text },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: W.accent,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
    borderRadius: 14,
    paddingVertical: spacing.base,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: W.surface },
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
  thumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: W.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: W.text },
  cardMeta: { fontSize: 12, color: W.textSub },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  errorText: { color: W.textSub, textAlign: 'center' },
  retryBtn: {
    backgroundColor: W.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  retryText: { color: W.surface, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: W.text },
  emptySubtitle: { fontSize: 13, color: W.textSub, textAlign: 'center', lineHeight: 19 },
});
