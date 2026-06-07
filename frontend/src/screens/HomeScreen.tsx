import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

// ── Warm palette ───────────────────────────────────────────────────────────
const W = {
  bg: '#0F1F35',
  card: '#0D1E33',
  surface: '#0A1626',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
  inactive: 'rgba(225,225,225,0.3)',
  imgEmpty: '#0F2A42',
};

const LEVEL_COLORS: Record<string, string> = {
  pokemon: '#00EADF',
  maquinas_tecnicas: '#00EADF',
  pociones: '#00EADF',
};

const POKEBALL_BY_CATEGORY: Record<string, any> = {
  pokemon:           require('../../assets/pokeballs/masterball.png'),
  pociones:          require('../../assets/pokeballs/superball.png'),
  maquinas_tecnicas: require('../../assets/pokeballs/greatball.png'),
};
const POKEBALL_DEFAULT = require('../../assets/pokeballs/pokeball.png');

function getPokeballSource(categoria: string) {
  return POKEBALL_BY_CATEGORY[categoria] ?? POKEBALL_DEFAULT;
}

type Subasta = {
  id: number;
  titulo: string;
  categoria: string;
  ubicacion: string;
  fechaFin: string;
  cantidadItems: number;
  imagenPortadaUrl: string | null;
};

const { width: SW } = Dimensions.get('window');
const PAD = 14;
const GAP = 12;
const AVAIL = SW - PAD * 2 - GAP;
const WL = Math.floor(AVAIL * 0.56);
const WR = Math.floor(AVAIL * 0.44);

const AR_SEEDS = [0.75, 0.9, 1.15, 0.65, 1.25, 0.82, 1.0, 0.7, 1.35, 0.88];
const AR_CACHE: Record<string, number> = {};

function seedAR(id: number) { return AR_SEEDS[id % AR_SEEDS.length]; }
function clampH(h: number) { return Math.min(Math.max(Math.round(h), 90), 300); }

type NavProp = StackNavigationProp<HomeStackParamList, 'HomeMain'>;

// ── Hooks ──────────────────────────────────────────────────────────────────

function useAspectRatio(url: string, fallback: number): number {
  const [ar, setAr] = useState(() => AR_CACHE[url] ?? fallback);
  useEffect(() => {
    if (!url || AR_CACHE[url] !== undefined) return;
    Image.getSize(url, (w, h) => { if (h > 0) { AR_CACHE[url] = w / h; setAr(w / h); } }, () => { });
  }, [url]);
  return ar;
}

function useCountdownBoth(fechaFin: string) {
  const [t, setT] = useState({ full: '--h --m', short: '--h --m' });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(fechaFin).getTime() - Date.now();
      if (diff <= 0) { setT({ full: 'Finalizado', short: 'Finalizado' }); return; }
      const totalH = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const d = Math.floor(totalH / 24);
      const h = totalH % 24;

      // Más de 48h → mostrar días; menos → mostrar horas totales
      const label = d >= 2
        ? `${d}d ${h}h`
        : `${totalH}h ${m}m`;

      setT({ full: label, short: label });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);
  return t;
}

function balanceColumns(items: Subasta[]) {
  const L: Subasta[] = [], R: Subasta[] = [];
  let lH = 0, rH = 0;
  for (const item of items) {
    const ar = AR_CACHE[item.imagenPortadaUrl ?? ''] ?? seedAR(item.id);
    const lCard = clampH(WL / ar) + 72;
    const rCard = clampH(WR / ar) + 64;
    if (lH <= rH) { L.push(item); lH += lCard + GAP; }
    else { R.push(item); rH += rCard + GAP; }
  }
  return { L, R };
}

// ── AuctionCard ────────────────────────────────────────────────────────────
interface CardProps {
  item: Subasta;
  gIdx: number;
  colWidth: number;
  isScrolling: boolean;
  compact: boolean;
  onPress: () => void;
}

function AuctionCard({ item, gIdx, colWidth, isScrolling, compact, onPress }: CardProps) {
  const imgUrl = item.imagenPortadaUrl
    ? (item.imagenPortadaUrl.startsWith('/') ? `${API_BASE_URL}${item.imagenPortadaUrl}` : item.imagenPortadaUrl)
    : '';
  const ar = useAspectRatio(imgUrl, seedAR(item.id));
  const imgH = clampH(colWidth / ar);
  const { full, short } = useCountdownBoth(item.fechaFin);

  const imgs = imgUrl ? [imgUrl] : [];

  const levelColor = LEVEL_COLORS[item.categoria] ?? '#888888';

  const entryAnim = useRef(new Animated.Value(0)).current;
  const kbScale = useRef(new Animated.Value(1)).current;
  const kbAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Ping-pong slots — no image flash on swap
  const [slotA, setSlotA] = useState(() => imgs[0] ?? '');
  const [slotB, setSlotB] = useState(() => imgs[1] ?? '');
  const [dotIdx, setDotIdx] = useState(0);
  const fadeA = useRef(new Animated.Value(1)).current;
  const fadeB = useRef(new Animated.Value(0)).current;
  const frontIsA = useRef(true);
  const nextLoad = useRef(2 % Math.max(imgs.length, 1));

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(0);
  const elapsedRef = useRef(0);
  const cyclingRef = useRef(false);

  // Slower cycling: 6s per image instead of 4s
  const DISPLAY_MS = 6000;
  const FADE_MS = 650;

  const doKenBurns = useCallback((duration: number) => {
    kbAnimRef.current?.stop();
    kbAnimRef.current = Animated.timing(kbScale, {
      toValue: 1.06, duration, easing: Easing.linear, useNativeDriver: true,
    });
    kbAnimRef.current.start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cycleRef = useRef<() => void>(() => { });
  cycleRef.current = () => {
    if (imgs.length <= 1) return;
    kbAnimRef.current?.stop();
    const aIsFront = frontIsA.current;
    const from = aIsFront ? fadeA : fadeB;
    const to = aIsFront ? fadeB : fadeA;
    Animated.parallel([
      Animated.timing(from, { toValue: 0, duration: FADE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(to, { toValue: 1, duration: FADE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      frontIsA.current = !aIsFront;
      setDotIdx(d => (d + 1) % imgs.length);
      const nextIdx = nextLoad.current;
      nextLoad.current = (nextIdx + 1) % imgs.length;
      if (aIsFront) setSlotA(imgs[nextIdx]);
      else setSlotB(imgs[nextIdx]);
      elapsedRef.current = 0;
      doKenBurns(DISPLAY_MS + FADE_MS);
      startedRef.current = Date.now();
      timerRef.current = setTimeout(() => cycleRef.current(), DISPLAY_MS);
    });
  };

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1, duration: 380,
      delay: Math.min(gIdx * 55, 440),
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !cyclingRef.current && imgs.length > 1) {
        cyclingRef.current = true;
        doKenBurns(DISPLAY_MS * 1.8);
        startedRef.current = Date.now();
        // Stagger: each card starts its cycle at a different time
        const stagger = DISPLAY_MS * 1.5 + (gIdx % 8) * 750;
        timerRef.current = setTimeout(() => cycleRef.current(), stagger);
      }
    });
    return () => { if (timerRef.current) clearTimeout(timerRef.current); kbAnimRef.current?.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cyclingRef.current) return;
    if (isScrolling) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        kbAnimRef.current?.stop();
        elapsedRef.current += Date.now() - startedRef.current;
      }
    } else {
      const rem = Math.max(0, DISPLAY_MS - elapsedRef.current);
      doKenBurns(rem + FADE_MS);
      startedRef.current = Date.now();
      timerRef.current = setTimeout(() => cycleRef.current(), rem);
    }
  }, [isScrolling, doKenBurns]);

  const translateY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <Animated.View style={[s.card, { opacity: entryAnim, transform: [{ translateY }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={{ flex: 1 }}>
        <View style={s.cardInner}>
          <View style={[s.imgBox, { height: imgH }]}>
            {imgs.length > 0 ? (
              <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: kbScale }] }]}>
                <Animated.Image source={{ uri: slotA }} style={[StyleSheet.absoluteFillObject, { opacity: fadeA }]} resizeMode="cover" />
                {imgs.length > 1 && (
                  <Animated.Image source={{ uri: slotB }} style={[StyleSheet.absoluteFillObject, { opacity: fadeB }]} resizeMode="cover" />
                )}
              </Animated.View>
            ) : (
              <View style={[StyleSheet.absoluteFillObject, s.imgEmpty]}>
                <Ionicons name="image-outline" size={26} color={W.inactive} />
              </View>
            )}
            {imgs.length >= 2 && false && (
              <View style={s.dotsRow} pointerEvents="none">
                {imgs.slice(0, 4).map((_, i) => (
                  <View key={i} style={i === dotIdx ? s.dotOn : s.dotOff} />
                ))}
              </View>
            )}
          </View>

          <View style={[s.levelBar, { backgroundColor: levelColor }]} />

          <View style={[s.info, compact && s.infoCompact]}>
            <Image
              source={getPokeballSource(item.categoria)}
              style={[s.pokeballBadge, compact && s.pokeballBadgeSm]}
            />
            <View style={s.infoText}>
              <Text style={[s.name, compact && s.nameSm]} numberOfLines={compact ? 1 : 2}>
                {item.titulo}
              </Text>
              <Text style={[s.timerCode, compact && s.timerCodeSm]}>
                {compact ? short : full}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── HomeScreen ─────────────────────────────────────────────────────────────
export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuthStore();
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const { token } = useAuthStore();

  const fetchSubastas = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/subastas/abiertas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setSubastas(data);
    } catch (_) { }
  }, [token]);

  useEffect(() => { fetchSubastas(); }, [fetchSubastas]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubastas().finally(() => setRefreshing(false));
  };

  const initials = user
    ? `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase()
    : '?';
  const nombre = user?.nombre ?? 'Usuario';

  const filtered = subastas;

  const { L: leftItems, R: rightItems } = balanceColumns(filtered);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.greetingWrap}>
          <Text style={s.greetingSub}>Bienvenido de nuevo</Text>
          <Text style={s.greetingName}>¡Hola {nombre}!</Text>
        </View>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        style={s.searchBar}
        onPress={() => navigation.getParent()?.navigate('Search' as never)}
        activeOpacity={0.8}
      >
        <Ionicons name="search-outline" size={18} color={'rgba(0,234,223,0.5)'} />
        <Text style={s.searchPlaceholder}>Buscar subastas...</Text>
      </TouchableOpacity>



      {/* Masonry grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.gridWrap}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={W.accent} />
        }
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setIsScrolling(false)}
        onMomentumScrollEnd={() => setIsScrolling(false)}
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="archive-outline" size={48} color={W.inactive} />
            <Text style={s.emptyTitle}>Sin subastas activas</Text>
            <Text style={s.emptyText}>No hay subastas disponibles en este momento.</Text>
          </View>
        ) : (
          <View style={s.grid}>
            <View style={{ width: WL }}>
              {leftItems.map((item, i) => (
                <React.Fragment key={item.id}>
                  {i > 0 && <View style={{ height: GAP }} />}
                  <AuctionCard
                    item={item}
                    gIdx={i * 2}
                    colWidth={WL}
                    isScrolling={isScrolling}
                    compact={false}
                    onPress={() => navigation.navigate('CatalogoDetail', { subastaId: item.id })}
                  />
                </React.Fragment>
              ))}
            </View>

            <View style={{ width: GAP }} />

            <View style={{ width: WR }}>
              {rightItems.map((item, i) => (
                <React.Fragment key={item.id}>
                  {i > 0 && <View style={{ height: GAP }} />}
                  <AuctionCard
                    item={item}
                    gIdx={i * 2 + 1}
                    colWidth={WR}
                    isScrolling={isScrolling}
                    compact
                    onPress={() => navigation.navigate('CatalogoDetail', { subastaId: item.id })}
                  />
                </React.Fragment>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 12,
    backgroundColor: W.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,234,223,0.15)',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E3A56',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,234,223,0.4)',
  },
  avatarText: { color: '#A0C4D8', fontWeight: '700', fontSize: 14 },
  greetingWrap: { flex: 1 },
  greetingSub: { fontSize: 11, color: W.textSub, letterSpacing: 0.5 },
  greetingName: { fontSize: 16, fontWeight: '700', color: W.text },


  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152C44',
    marginHorizontal: PAD,
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0,234,223,0.2)',
  },
  searchPlaceholder: { color: W.textSub, fontSize: 14, flex: 1 },



  // Grid
  gridWrap: { paddingHorizontal: PAD, paddingBottom: 40 },
  grid: { flexDirection: 'row' },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.22)',
    shadowColor: '#00EADF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  cardInner: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: W.card,
  },
  imgBox: {
    overflow: 'hidden',
    backgroundColor: W.imgEmpty,
  },
  imgEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  dotsRow: {
    position: 'absolute',
    bottom: 7, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dotOn: { width: 14, height: 3, borderRadius: 1.5, backgroundColor: W.accent },
  dotOff: { width: 4, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(0,234,223,0.25)' },

  levelBar: { height: 1, opacity: 0.4 },

  info: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: W.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCompact: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 6,
  },
  pokeballBadge: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    flexShrink: 0,
  },
  pokeballBadgeSm: {
    width: 22,
    height: 22,
  },
  infoText: {
    flex: 1,
    flexDirection: 'column',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: W.text,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  nameSm: { fontSize: 10, lineHeight: 14 },
  timerCode: {
    fontSize: 10,
    color: W.accent,
    letterSpacing: 0.4,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
    opacity: 0.9,
  },
  timerCodeSm: { fontSize: 9, marginTop: 1 },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: W.text },
  emptyText: { color: W.textSub, textAlign: 'center', lineHeight: 20 },
});
