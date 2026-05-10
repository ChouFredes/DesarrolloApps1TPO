import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

type NavProp = StackNavigationProp<HomeStackParamList, 'ItemDetail'>;
type RouteProps = RouteProp<HomeStackParamList, 'ItemDetail'>;

interface ItemData {
  id: number;
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
  subastadorNombre?: string;
  subastadorApellido?: string;
}

interface SubastaData {
  id: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  mayorOfertaActual?: number;
  fechaFin: string;
  subastadorNombre?: string;
  subastadorApellido?: string;
  items?: ItemData[];
}

function useCountdown(fechaFin: string | null) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!fechaFin) return;

    const calc = () => {
      const diff = new Date(fechaFin).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Finalizado');
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        `${String(h).padStart(2, '0')}H ${String(m).padStart(2, '0')}M ${String(s).padStart(2, '0')}S`,
      );
    };

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);

  return timeLeft;
}

export function ItemDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { token } = useAuthStore();
  const { itemId, subastaId } = route.params;

  const [item, setItem] = useState<ItemData | null>(null);
  const [subasta, setSubasta] = useState<SubastaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [joining, setJoining] = useState(false);

  const timeLeft = useCountdown(subasta?.fechaFin ?? null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [itemRes, subastaRes] = await Promise.all([
        axios.get<ItemData>(`${API_BASE_URL}/items/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<SubastaData>(`${API_BASE_URL}/subastas/${subastaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setItem(itemRes.data);
      setSubasta(subastaRes.data);
    } catch {
      setError('No se pudo cargar la información del ítem.');
    } finally {
      setLoading(false);
    }
  }, [itemId, subastaId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMakeOffer = async () => {
    setJoining(true);
    try {
      await axios.post(
        `${API_BASE_URL}/subastas/${subastaId}/conectar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      navigation.navigate('AuctionRoom', {
        subastaId,
        itemId,
        itemName: subasta?.nombre ?? item?.nombre ?? '',
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'No se pudo unir a la subasta.';
      Alert.alert('Error', msg);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !item || !subasta) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error ?? 'Ítem no encontrado.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentPrice = subasta.mayorOfertaActual ?? subasta.precioBase;
  const creatorName =
    subasta.subastadorNombre
      ? `${subasta.subastadorNombre} ${subasta.subastadorApellido ?? ''}`.trim()
      : 'Subastador';
  const description = item.descripcion || subasta.descripcion || 'Sin descripción disponible.';
  const truncated = !expanded && description.length > 120;
  const displayDesc = truncated ? description.slice(0, 120) + '…' : description;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Countdown banner */}
      <View style={styles.countdownBanner}>
        <Text style={styles.countdownLabel}>Finalización</Text>
        <Text style={styles.countdownTimer}>{timeLeft || '—'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back button overlaid */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Hero image */}
        <View style={styles.heroWrap}>
          {item.imagenUrl ? (
            <Image source={{ uri: item.imagenUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
            </View>
          )}
        </View>

        {/* Item info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.nombre}
            </Text>
            <TouchableOpacity onPress={() => setFavorited(!favorited)} style={styles.heartBtn} activeOpacity={0.7}>
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={26}
                color={favorited ? colors.error : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitial}>{creatorName[0]}</Text>
            </View>
            <Text style={styles.authorName}>{creatorName}</Text>
          </View>

          {/* Description */}
          <Text style={styles.sectionLabel}>Descripción</Text>
          <Text style={styles.description}>{displayDesc}</Text>
          {description.length > 120 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={styles.readMore}>{expanded ? 'ver menos' : 'leer más...'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceBlock}>
          <Text style={styles.ofertaLabel}>Oferta actual</Text>
          <Text style={styles.ofertaPrice}>$ {currentPrice.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.offerBtn, joining && styles.offerBtnDisabled]}
          onPress={handleMakeOffer}
          disabled={joining}
          activeOpacity={0.8}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.offerBtnText}>Hacer oferta</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default ItemDetailScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  errorText: { color: colors.textSecondary, textAlign: 'center', marginHorizontal: spacing.xl },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  countdownBanner: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  countdownLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  countdownTimer: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingBottom: 100 },
  backBtn: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.base,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    ...shadows.card,
  },
  heroWrap: { width: '100%', height: 260, backgroundColor: colors.border },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoSection: { padding: spacing.base },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  itemName: { flex: 1, fontSize: 22, fontWeight: '700', color: colors.text },
  heartBtn: { padding: spacing.xs, marginTop: 2 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.base },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitial: { color: '#fff', fontWeight: '700', fontSize: 13 },
  authorName: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  readMore: { fontSize: 13, color: colors.accent, fontWeight: '600', marginTop: spacing.xs },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.base,
    ...shadows.card,
  },
  priceBlock: { flex: 1 },
  ofertaLabel: { fontSize: 12, color: colors.textSecondary },
  ofertaPrice: { fontSize: 24, fontWeight: '700', color: colors.accent },
  offerBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 130,
    alignItems: 'center',
  },
  offerBtnDisabled: { opacity: 0.5 },
  offerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
