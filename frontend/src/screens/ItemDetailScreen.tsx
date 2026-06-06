import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

interface ItemDetalle {
  id: number;
  productoId: number;
  descripcionCatalogo: string;
  descripcionCompleta: string | null;
  precioBase: number;
  comision: number;
  subastado: string;
  fotosUrls: string[];
  mayorOfertaActual: number | null;
}

interface SubastaDetalle {
  id: number;
  titulo: string;
  imagenPortadaUrl: string | null;
  fechaFin: string | null;
  subastador: string | null;
  mayorOfertaActual: number | null;
}

type NavProp = StackNavigationProp<HomeStackParamList, 'ItemDetail'>;
type RouteProps = RouteProp<HomeStackParamList, 'ItemDetail'>;

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 280;

// ── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(fechaFin: string | null) {
  const [parts, setParts] = useState({ h: '00', m: '00', s: '00', finished: false });
  useEffect(() => {
    if (!fechaFin) return;
    const calc = () => {
      const diff = new Date(fechaFin).getTime() - Date.now();
      if (diff <= 0) {
        setParts({ h: '00', m: '00', s: '00', finished: true });
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setParts({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
        finished: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);
  return parts;
}

// ── ItemDetailScreen ────────────────────────────────────────────────────────
export function ItemDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { itemId, subastaId } = route.params;
  const { token } = useAuthStore();

  const [item, setItem] = useState<ItemDetalle | null>(null);
  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [itemRes, subRes] = await Promise.all([
          fetch(`${API_BASE_URL}/items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/subastas/${subastaId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (itemRes.ok) setItem(await itemRes.json());
        if (subRes.ok) setSubasta(await subRes.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [itemId, subastaId, token]);

  const fotos: string[] = (item?.fotosUrls ?? []).map(url =>
    url.startsWith('/') ? `${API_BASE_URL}${url}` : url
  );

  const countdown = useCountdown(subasta?.fechaFin ?? null);

  // Animations
  const imageFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(imageFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(contentSlide, { toValue: 0, duration: 480, delay: 180, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 480, delay: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [loading, imageFade, contentSlide, contentOpacity]);

  const handleMakeOffer = () => {
    setJoining(true);
    setTimeout(() => {
      setJoining(false);
      navigation.navigate('AuctionRoom', {
        subastaId,
        itemId,
        itemName: item?.descripcionCatalogo ?? subasta?.titulo ?? '',
      });
    }, 400);
  };

  const description = item?.descripcionCompleta ?? item?.descripcionCatalogo ?? 'Sin descripción disponible.';
  const truncated = !expanded && description.length > 140;
  const displayDesc = truncated ? description.slice(0, 140) + '…' : description;

  const currentPrice = item?.mayorOfertaActual ?? item?.precioBase ?? 0;
  const basePrice = item?.precioBase ?? 0;
  const creatorName = subasta?.subastador ?? 'Subastador';

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActivePhoto(idx);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Countdown banner */}
      <View style={styles.countdownBanner}>
        <Text style={styles.countdownLabel}>Tiempo restante</Text>
        <View style={styles.countdownSegments}>
          <View style={styles.countdownSeg}>
            <Text style={styles.countdownNum}>{countdown.h}</Text>
            <Text style={styles.countdownUnit}>H</Text>
          </View>
          <Text style={styles.countdownColon}>:</Text>
          <View style={styles.countdownSeg}>
            <Text style={styles.countdownNum}>{countdown.m}</Text>
            <Text style={styles.countdownUnit}>M</Text>
          </View>
          <Text style={styles.countdownColon}>:</Text>
          <View style={styles.countdownSeg}>
            <Text style={styles.countdownNum}>{countdown.s}</Text>
            <Text style={styles.countdownUnit}>S</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces
      >
        {/* Hero / Gallery */}
        <View style={styles.heroWrap}>
          <Animated.View style={{ opacity: imageFade, flex: 1 }}>
            {fotos.length > 1 ? (
              <>
                <FlatList
                  data={fotos}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onScrollEnd}
                  keyExtractor={(_, i) => String(i)}
                  renderItem={({ item: uri }) => (
                    <Image
                      source={{ uri }}
                      style={{ width, height: HERO_HEIGHT }}
                      resizeMode="cover"
                    />
                  )}
                />
                {/* Dot indicators */}
                <View style={styles.dotsWrap}>
                  {fotos.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === activePhoto && styles.dotActive]}
                    />
                  ))}
                </View>
              </>
            ) : fotos.length === 1 ? (
              <Image
                source={{ uri: fotos[0] }}
                style={{ width: '100%', height: HERO_HEIGHT }}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
              </View>
            )}
          </Animated.View>

          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Favorite button */}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => setFavorited(!favorited)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={20}
              color={favorited ? colors.error : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View
          style={[
            styles.contentWrap,
            { opacity: contentOpacity, transform: [{ translateY: contentSlide }] },
          ]}
        >
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item?.descripcionCatalogo ?? subasta?.titulo ?? ''}
            </Text>
          </View>

          {/* Auctioneer */}
          <View style={styles.auctioneerRow}>
            <View style={styles.auctioneerAvatar}>
              <Text style={styles.auctioneerInitial}>{creatorName[0]}</Text>
            </View>
            <View>
              <Text style={styles.auctioneerLabel}>Subastador</Text>
              <Text style={styles.auctioneerName}>{creatorName}</Text>
            </View>
          </View>

          {/* Price section */}
          <View style={styles.priceCard}>
            <View style={styles.priceItem}>
              <Text style={styles.priceSublabel}>Precio base</Text>
              <Text style={styles.priceBaseValue}>$ {basePrice.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceSublabel}>Oferta actual</Text>
              <Text style={styles.priceCurrentValue}>$ {currentPrice.toLocaleString('es-AR')}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionLabel}>Descripción</Text>
          <Text style={styles.description}>{displayDesc}</Text>
          {description.length > 140 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={styles.readMore}>{expanded ? 'ver menos' : 'leer más...'}</Text>
            </TouchableOpacity>
          )}

          {/* Spacer for bottom bar */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceWrap}>
          <Text style={styles.bottomPriceLabel}>Oferta actual</Text>
          <Text style={styles.bottomPrice}>$ {currentPrice.toLocaleString('es-AR')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.offerBtn, joining && styles.offerBtnDisabled]}
          onPress={handleMakeOffer}
          disabled={joining}
          activeOpacity={0.85}
        >
          {joining ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="hammer-outline" size={18} color="#fff" />
              <Text style={styles.offerBtnText}>Hacer oferta</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default ItemDetailScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Countdown banner
  countdownBanner: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  countdownLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '500' },
  countdownSegments: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countdownSeg: { alignItems: 'center', minWidth: 32 },
  countdownNum: { color: '#fff', fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'], lineHeight: 24 },
  countdownUnit: { color: colors.accent, fontSize: 9, fontWeight: '700' },
  countdownColon: { color: colors.accent, fontSize: 18, fontWeight: '700', marginBottom: 8 },

  scrollContent: { paddingBottom: 0 },

  // Hero
  heroWrap: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
    height: HERO_HEIGHT,
  },
  dotsWrap: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 18,
    borderRadius: 3,
  },
  backBtn: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.base,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.base,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },

  // Content
  contentWrap: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  titleRow: { marginBottom: spacing.md },
  itemName: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 28 },

  // Auctioneer
  auctioneerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  auctioneerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  auctioneerInitial: { color: '#fff', fontWeight: '700', fontSize: 16 },
  auctioneerLabel: { fontSize: 11, color: colors.textSecondary },
  auctioneerName: { fontSize: 14, fontWeight: '600', color: colors.text },

  // Price card
  priceCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  priceItem: { flex: 1, alignItems: 'center' },
  priceSublabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  priceBaseValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  priceCurrentValue: { fontSize: 22, fontWeight: '800', color: colors.accent },
  priceDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  // Description
  sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  readMore: { fontSize: 13, color: colors.accent, fontWeight: '600', marginTop: spacing.xs },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.base,
    ...shadows.card,
  },
  bottomPriceWrap: { flex: 1 },
  bottomPriceLabel: { fontSize: 11, color: colors.textSecondary },
  bottomPrice: { fontSize: 20, fontWeight: '800', color: colors.accent },
  offerBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 140,
    justifyContent: 'center',
    ...shadows.card,
  },
  offerBtnDisabled: { opacity: 0.5 },
  offerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
