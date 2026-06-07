import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

const DARK = {
  bg:       '#F4EEE8',
  card:     '#FFFFFF',
  text:     '#1A1201',
  textSub:  '#8C7B6B',
  accent:   '#F5A623',
  inactive: '#B8A898',
};

// Pantone-inspired level colors — the "chip" accent for each tier
const LEVEL_COLORS: Record<string, string> = {
  pokemon:           '#E74C3C',
  maquinas_tecnicas: '#3A7BD5',
  pociones:          '#9B59B6',
};

type NavProp = StackNavigationProp<HomeStackParamList, 'Catalogo'>;
type RouteProps = RouteProp<HomeStackParamList, 'Catalogo'>;

interface Subasta {
  id: number;
  titulo: string;
  categoria: string;
  ubicacion: string;
  fechaFin: string;
  cantidadItems: number;
  imagenPortadaUrl: string | null;
}

const CATEGORIAS = [
  { key: 'todos',            label: 'Todos' },
  { key: 'pokemon',          label: 'Pokémon' },
  { key: 'maquinas_tecnicas',label: 'Máquinas' },
  { key: 'pociones',         label: 'Pociones' },
];

const { width: SW } = Dimensions.get('window');
const PAD = 12;
const GAP = 8;
const AVAIL = SW - PAD * 2 - GAP;
const WL = Math.floor(AVAIL * 0.56);
const WR = Math.floor(AVAIL * 0.44);

const AR_SEEDS = [0.75, 0.9, 1.15, 0.65, 1.25, 0.82, 1.0, 0.7, 1.35, 0.88];
const AR_CACHE: Record<string, number> = {};

function seedAR(id: number): number { return AR_SEEDS[id % AR_SEEDS.length]; }
function clampH(h: number): number { return Math.min(Math.max(Math.round(h), 90), 300); }

// ── Hooks ──────────────────────────────────────────────────────────────────

function useAspectRatio(url: string, fallback: number): number {
  const [ar, setAr] = useState(() => AR_CACHE[url] ?? fallback);
  useEffect(() => {
    if (!url || AR_CACHE[url] !== undefined) return;
    Image.getSize(
      url,
      (w, h) => { if (h > 0) { AR_CACHE[url] = w / h; setAr(w / h); } },
      () => {},
    );
  }, [url]);
  return ar;
}

function useCountdownBoth(fechaFin: string) {
  const [t, setT] = useState({ full: '--:--:--', short: '--:--' });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(fechaFin).getTime() - Date.now();
      if (diff <= 0) { setT({ full: 'Finalizado', short: 'Fin' }); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      const full = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      const short = h >= 1 ? `${h}h ${m}m` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      setT({ full, short });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);
  return t;
}

// ── Masonry balancing ──────────────────────────────────────────────────────
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

// ── AuctionCard ─────────────────────────────────────────────────────────────
interface CardProps {
  item: Subasta;
  gIdx: number;
  colWidth: number;
  isScrolling: boolean;
  compact: boolean;
  onPress: () => void;
}

function AuctionCard({ item, gIdx, colWidth, isScrolling, compact, onPress }: CardProps) {
  const imgSrc = item.imagenPortadaUrl
    ? (item.imagenPortadaUrl.startsWith('/') ? `${API_BASE_URL}${item.imagenPortadaUrl}` : item.imagenPortadaUrl)
    : '';
  const ar = useAspectRatio(imgSrc, seedAR(item.id));
  const imgH = clampH(colWidth / ar);
  const { full, short } = useCountdownBoth(item.fechaFin);

  const imgs = imgSrc ? [imgSrc] : [];

  const levelColor = LEVEL_COLORS[item.categoria] ?? '#888888';

  // Entry animation
  const entryAnim = useRef(new Animated.Value(0)).current;

  // Ken Burns — applied to a container wrapping both image slots
  const kbScale = useRef(new Animated.Value(1)).current;
  const kbAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Ping-pong image slots — avoids flash when swapping current image
  // slotA starts as front (fadeA=1), slotB is preloaded back (fadeB=0)
  const [slotA, setSlotA] = useState(() => imgs[0] ?? '');
  const [slotB, setSlotB] = useState(() => imgs[1] ?? '');
  const [dotIdx, setDotIdx] = useState(0);
  const fadeA = useRef(new Animated.Value(1)).current;
  const fadeB = useRef(new Animated.Value(0)).current;
  const frontIsA = useRef(true);
  const nextLoadIdx = useRef(2 % Math.max(imgs.length, 1));

  // Cycle management
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(0);
  const elapsedRef = useRef(0);
  const cyclingRef = useRef(false);

  const DISPLAY_MS = 6000;
  const FADE_MS = 650;

  const doKenBurns = useCallback((duration: number) => {
    kbAnimRef.current?.stop();
    // No setValue(1) — continue from current scale to avoid visual snap
    kbAnimRef.current = Animated.timing(kbScale, {
      toValue: 1.06,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    kbAnimRef.current.start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // cycleRef pattern — closure always reads latest state/refs
  const cycleRef = useRef<() => void>(() => {});
  cycleRef.current = () => {
    if (imgs.length <= 1) return;
    kbAnimRef.current?.stop();

    const aIsFront = frontIsA.current;
    const fromFade = aIsFront ? fadeA : fadeB;
    const toFade   = aIsFront ? fadeB : fadeA;

    Animated.parallel([
      Animated.timing(fromFade, { toValue: 0, duration: FADE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(toFade,   { toValue: 1, duration: FADE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;

      // Swap which slot is the visible front — no opacity resets needed
      frontIsA.current = !aIsFront;

      // Advance dot
      setDotIdx(d => (d + 1) % imgs.length);

      // Preload next image into the now-hidden slot (invisible → no visual glitch)
      const nextIdx = nextLoadIdx.current;
      nextLoadIdx.current = (nextIdx + 1) % imgs.length;
      if (aIsFront) setSlotA(imgs[nextIdx]);
      else          setSlotB(imgs[nextIdx]);

      elapsedRef.current = 0;
      doKenBurns(DISPLAY_MS + FADE_MS);
      startedRef.current = Date.now();
      timerRef.current = setTimeout(() => cycleRef.current(), DISPLAY_MS);
    });
  };

  // Mount: entry anim then start cycling
  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 380,
      delay: Math.min(gIdx * 55, 440),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !cyclingRef.current && imgs.length > 1) {
        cyclingRef.current = true;
        doKenBurns(DISPLAY_MS * 1.8);
        startedRef.current = Date.now();
        // Stagger per card so they don't all animate simultaneously
        const stagger = DISPLAY_MS * 1.5 + (gIdx % 8) * 750;
        timerRef.current = setTimeout(() => cycleRef.current(), stagger);
      }
    });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      kbAnimRef.current?.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pause on scroll / resume on settle
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

        {/* ── Image area ── */}
        <View style={[s.imgBox, { height: imgH }]}>
          {imgs.length > 0 ? (
            // Ken Burns applied to inner wrapper — both slots scale together
            <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: kbScale }] }]}>
              <Animated.Image
                source={{ uri: slotA }}
                style={[StyleSheet.absoluteFillObject, { opacity: fadeA }]}
                resizeMode="cover"
              />
              {imgs.length > 1 && (
                <Animated.Image
                  source={{ uri: slotB }}
                  style={[StyleSheet.absoluteFillObject, { opacity: fadeB }]}
                  resizeMode="cover"
                />
              )}
            </Animated.View>
          ) : (
            <View style={[StyleSheet.absoluteFillObject, s.imgEmpty]}>
              <Ionicons name="image-outline" size={26} color="#444" />
            </View>
          )}

          {/* Dots outside the scaled container */}
          {imgs.length >= 2 && (
            <View style={s.dotsRow} pointerEvents="none">
              {imgs.slice(0, 4).map((_, i) => (
                <View key={i} style={i === dotIdx ? s.dotOn : s.dotOff} />
              ))}
            </View>
          )}
        </View>

        {/* ── Pantone level bar ── */}
        <View style={[s.levelBar, { backgroundColor: levelColor }]} />

        {/* ── Pantone info chip ── */}
        <View style={[s.info, compact && s.infoCompact, { borderLeftColor: levelColor }]}>
          <Text style={[s.name, compact && s.nameSm]} numberOfLines={compact ? 1 : 2}>
            {item.titulo}
          </Text>
          <Text style={[s.timerCode, compact && s.timerCodeSm]}>
            {compact ? short : full}
          </Text>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
}

// ── CatalogoScreen ─────────────────────────────────────────────────────────
export function CatalogoScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { token } = useAuthStore();
  const initialCat = route.params?.categoriaInicial?.toLowerCase() ?? 'todos';
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const fetchSubastas = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/subastas/abiertas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: Subasta[] = await res.json();
      setSubastas(data);
    } catch {
      // keep existing data on refresh failure
    }
  }, [token]);

  useEffect(() => { fetchSubastas(); }, [fetchSubastas]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubastas().finally(() => setRefreshing(false));
  };

  const filtered = selectedCat === 'todos'
    ? subastas
    : subastas.filter(s => s.categoria?.toLowerCase() === selectedCat);

  const { L: leftItems, R: rightItems } = balanceColumns(filtered);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color={DARK.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Catálogos</Text>
        <View style={s.countBadge}>
          <Text style={s.countTxt}>{filtered.length}</Text>
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabsContent}
        style={s.tabsBar}
      >
        {CATEGORIAS.map(cat => {
          const active = selectedCat === cat.key;
          const levelCol = LEVEL_COLORS[cat.key];
          return (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setSelectedCat(cat.key)}
              activeOpacity={0.7}
              style={s.tab}
            >
              {levelCol && (
                <View style={[s.tabDot, { backgroundColor: active ? levelCol : DARK.inactive }]} />
              )}
              <Text style={[s.tabTxt, active && s.tabTxtOn]}>{cat.label}</Text>
              {active && <View style={[s.tabLine, levelCol ? { backgroundColor: levelCol } : null]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Masonry grid */}
      <ScrollView
        contentContainerStyle={s.gridWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DARK.accent} />
        }
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setIsScrolling(false)}
        onMomentumScrollEnd={() => setIsScrolling(false)}
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="archive-outline" size={44} color="#333" />
            <Text style={s.emptyTitle}>Sin resultados</Text>
            <Text style={s.emptySub}>No hay subastas en esta categoría.</Text>
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

export default CatalogoScreen;

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE8E1',
    borderWidth: 1,
    borderColor: '#DDD5CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: DARK.text,
    letterSpacing: -0.4,
  },
  countBadge: {
    backgroundColor: '#EDE8E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DDD5CA',
  },
  countTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK.textSub,
    fontVariant: ['tabular-nums'],
  },

  // Tabs
  tabsBar: { flexGrow: 0, marginBottom: 10 },
  tabsContent: { paddingHorizontal: PAD, gap: 4 },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
    flexDirection: 'row',
    gap: 5,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabTxt: { fontSize: 14, fontWeight: '500', color: DARK.inactive },
  tabTxtOn: { color: DARK.text, fontWeight: '700' },
  tabLine: {
    position: 'absolute',
    bottom: 2,
    left: 6,
    right: 6,
    height: 2,
    backgroundColor: DARK.text,
    borderRadius: 1,
  },

  gridWrap: { paddingHorizontal: PAD, paddingBottom: 40 },
  grid: { flexDirection: 'row' },

  // ── Pantone card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    overflow: 'hidden',
    shadowColor: '#8C6A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  imgBox: {
    overflow: 'hidden',
    backgroundColor: '#E8E0D8',
  },
  imgEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E0D8',
  },

  // Dot indicators (outside the Ken Burns container)
  dotsRow: {
    position: 'absolute',
    bottom: 7,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dotOn:  { width: 14, height: 3, borderRadius: 1.5, backgroundColor: '#FFF' },
  dotOff: { width: 4,  height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Level accent bar between image and info
  levelBar: {
    height: 3,
  },

  // Pantone info section — white, left accent border
  info: {
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 11,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
  },
  infoCompact: {
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 9,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1201',
    letterSpacing: 0.15,
    lineHeight: 17,
  },
  nameSm: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  // Timer shown as a Pantone "color code" — small, monospace-ish, gray
  timerCode: {
    fontSize: 9,
    color: '#8C7B6B',
    letterSpacing: 0.6,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  timerCodeSm: {
    fontSize: 8,
    marginTop: 3,
  },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: DARK.text },
  emptySub: { color: DARK.textSub, textAlign: 'center' },
});
