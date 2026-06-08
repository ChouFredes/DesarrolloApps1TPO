import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing, borderRadius } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

interface SubastaDetalle {
  id: number;
  titulo: string;
  imagenPortadaUrl: string | null;
  fechaFin: string;
  categoria: string;
  ubicacion: string;
  subastador: string | null;
}

interface CatalogoItem {
  id: number;
  productoId: number;
  descripcionCatalogo: string;
  precioBase: number;
  comision: number;
  subastado: string;
  fotosUrls: string[];
}

const D = {
  bg:      '#0F1F35',
  card:    '#0D1E33',
  surface: '#0A1626',
  text:    '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent:  '#00EADF',
  border:  'rgba(0,234,223,0.2)',
};

const LEVEL_COLORS: Record<string, string> = {
  comun:    '#00EADF',
  especial: '#00EADF',
  plata:    '#00EADF',
  oro:      '#00EADF',
  platino:  '#00EADF',
  pokemon:          '#00EADF',
  maquinas_tecnicas:'#00EADF',
  pociones:         '#00EADF',
};

type NavProp = StackNavigationProp<HomeStackParamList, 'CatalogoDetail'>;
type RouteProps = RouteProp<HomeStackParamList, 'CatalogoDetail'>;

const { width } = Dimensions.get('window');

function useCountdown(fechaFin: string) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(fechaFin).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Finalizado'); return; }
      const totalH = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const d = Math.floor(totalH / 24);
      const h = totalH % 24;
      setTimeLeft(d >= 2 ? `${d}d ${h}h` : `${totalH}h ${m}m`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);
  return timeLeft;
}

function ItemRow({ item, index, onPress }: { item: CatalogoItem; index: number; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const imgUrl = item.fotosUrls[0]
    ? (item.fotosUrls[0].startsWith('/') ? `${API_BASE_URL}${item.fotosUrls[0]}` : item.fotosUrls[0])
    : null;

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX }] }}>
      <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.87}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={[styles.itemImage, { backgroundColor: D.surface, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={24} color={D.textSub} />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre} numberOfLines={2}>{item.descripcionCatalogo}</Text>
          <View style={styles.itemPriceRow}>
            <View>
              <Text style={styles.priceLabel}>Precio base</Text>
              <Text style={styles.priceBase}>$ {Number(item.precioBase).toLocaleString('es-AR')}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={D.textSub} style={styles.chevron} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function CatalogoDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { subastaId } = route.params;
  const { token } = useAuthStore();

  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [detRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/subastas/${subastaId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/subastas/${subastaId}/catalogo`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (detRes.ok) setSubasta(await detRes.json());
        if (catRes.ok) setItems(await catRes.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subastaId, token]);

  const timeLeft = useCountdown(subasta?.fechaFin ?? '');
  const levelColor = LEVEL_COLORS[subasta?.categoria ?? ''] ?? D.accent;

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!loading) {
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [loading, headerAnim]);

  const subastador = subasta?.subastador ?? 'Subastador';

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00EADF" />
        </View>
      </SafeAreaView>
    );
  }

  const heroUrl = subasta?.imagenPortadaUrl
    ? (subasta.imagenPortadaUrl.startsWith('/') ? `${API_BASE_URL}${subasta.imagenPortadaUrl}` : subasta.imagenPortadaUrl)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <Animated.View style={{ opacity: headerAnim }}>
            {/* Hero image */}
            <View style={styles.heroWrap}>
              {heroUrl ? (
                <Image source={{ uri: heroUrl }} style={styles.heroImage} resizeMode="cover" />
              ) : (
                <View style={[styles.heroImage, { backgroundColor: D.surface }]} />
              )}
              <View style={styles.heroOverlay} />
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={[styles.catBadge, { backgroundColor: levelColor }]}>
                <Text style={styles.catBadgeText}>{(subasta?.categoria ?? '').toUpperCase()}</Text>
              </View>
              <View style={styles.timerBadge}>
                <Ionicons name="time-outline" size={13} color="#fff" />
                <Text style={styles.timerText}>{timeLeft}</Text>
              </View>
            </View>

            {/* Level accent bar */}
            <View style={[styles.levelBar, { backgroundColor: levelColor }]} />

            {/* Catálogo info */}
            <View style={styles.infoCard}>
              <Text style={styles.catalogoNombre}>{subasta?.titulo ?? 'Subasta'}</Text>
              <View style={styles.subastadorRow}>
                <View style={[styles.subastadorDot, { backgroundColor: levelColor }]} />
                <Text style={styles.subastadorText}>{subastador}</Text>
              </View>
              {subasta?.ubicacion ? (
                <Text style={styles.catalogoDesc}>{subasta.ubicacion}</Text>
              ) : null}
            </View>

            {/* Section title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Artículos en subasta</Text>
              <View style={[styles.countBadge, { backgroundColor: levelColor }]}>
                <Text style={styles.countText}>{items.length}</Text>
              </View>
            </View>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <ItemRow
            item={item}
            index={index}
            onPress={() => navigation.navigate('ItemDetail', { itemId: item.id, subastaId })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="archive-outline" size={48} color={D.textSub} />
            <Text style={styles.emptyText}>No hay artículos en este catálogo.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

export default CatalogoDetailScreen;

const HERO_HEIGHT = width * 0.58;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },
  listContent: { paddingBottom: spacing.xxl },

  // Hero
  heroWrap: { height: HERO_HEIGHT, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtn: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  catBadge: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,234,223,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,234,223,0.4)',
  },
  catBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  timerBadge: {
    position: 'absolute',
    bottom: 30,
    right: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,234,223,0.25)',
  },
  timerText: {
    color: '#00EADF',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Level bar
  levelBar: { height: 2, opacity: 0.5 },

  // Info card
  infoCard: {
    backgroundColor: D.card,
    marginHorizontal: spacing.base,
    marginTop: -spacing.xl,
    borderRadius: 14,
    padding: spacing.base,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.2)',
    shadowColor: '#00EADF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  catalogoNombre: { fontSize: 20, fontWeight: '800', color: D.text },
  subastadorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  subastadorDot: { width: 7, height: 7, borderRadius: 4 },
  subastadorText: { fontSize: 13, color: D.textSub },
  catalogoDesc: { fontSize: 13, color: D.textSub, lineHeight: 20 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: D.text },
  countBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,234,223,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,234,223,0.35)',
  },
  countText: { color: '#000000', fontSize: 12, fontWeight: '700' },

  // Item rows
  itemRow: {
    flexDirection: 'row',
    backgroundColor: D.card,
    marginHorizontal: spacing.base,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.2)',
    shadowColor: '#00EADF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  itemImage: { width: 110, height: 110 },
  itemInfo: { flex: 1, padding: spacing.md, gap: 4 },
  itemNombre: { fontSize: 14, fontWeight: '700', color: D.text, lineHeight: 19 },
  itemDesc: { fontSize: 12, color: D.textSub, lineHeight: 17 },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  priceLabel: { fontSize: 10, color: D.textSub, marginBottom: 1 },
  priceBase: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  ofertaWrap: { alignItems: 'flex-end' },
  ofertaPrice: { fontSize: 14, fontWeight: '700', color: D.accent },
  chevron: { paddingRight: spacing.sm },

  separator: { height: spacing.md },

  // Empty / loading
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyText: { fontSize: 15, color: D.textSub, textAlign: 'center' },
});
