import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing, borderRadius } from '../theme';
import { MOCK_SUBASTAS, MOCK_ITEMS_POR_CATALOGO, MockItem } from '../mocks/data';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

const D = {
  bg:      '#F4EEE8',
  card:    '#FFFFFF',
  surface: '#EDE8E1',
  text:    '#1A1201',
  textSub: '#8C7B6B',
  accent:  '#F5A623',
  border:  '#DDD5CA',
};

const LEVEL_COLORS: Record<string, string> = {
  comun: '#888888',
  especial: '#3A7BD5',
  plata: '#B0B8C1',
  oro: '#E8A020',
  platino: '#9B59B6',
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
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);
  return timeLeft;
}

function ItemRow({ item, index, onPress }: { item: MockItem; index: number; onPress: () => void }) {
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
  const ofertaActiva = item.mayorOfertaActual > item.precioBase;

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX }] }}>
      <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.87}>
        <Image source={{ uri: item.imagenUrl }} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre} numberOfLines={2}>{item.nombre}</Text>
          <Text style={styles.itemDesc} numberOfLines={2}>{item.descripcion}</Text>
          <View style={styles.itemPriceRow}>
            <View>
              <Text style={styles.priceLabel}>Precio base</Text>
              <Text style={styles.priceBase}>$ {item.precioBase.toLocaleString('es-AR')}</Text>
            </View>
            {ofertaActiva && (
              <View style={styles.ofertaWrap}>
                <Text style={styles.priceLabel}>Oferta actual</Text>
                <Text style={styles.ofertaPrice}>$ {item.mayorOfertaActual.toLocaleString('es-AR')}</Text>
              </View>
            )}
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

  const catalogo = MOCK_SUBASTAS.find(s => s.id === subastaId) ?? MOCK_SUBASTAS[0];
  const items = MOCK_ITEMS_POR_CATALOGO[catalogo.id] ?? [];
  const timeLeft = useCountdown(catalogo.fechaFin);
  const levelColor = LEVEL_COLORS[catalogo.categoria] ?? D.accent;

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [headerAnim]);

  const subastador = `${catalogo.subastadorNombre} ${catalogo.subastadorApellido ?? ''}`.trim();

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
              <Image source={{ uri: catalogo.imagenUrl }} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.heroOverlay} />
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              {/* Level-colored category badge */}
              <View style={[styles.catBadge, { backgroundColor: levelColor }]}>
                <Text style={styles.catBadgeText}>{catalogo.categoria.toUpperCase()}</Text>
              </View>
              <View style={styles.timerBadge}>
                <Ionicons name="time-outline" size={13} color="#fff" />
                <Text style={styles.timerText}>{timeLeft}</Text>
              </View>
            </View>

            {/* Level accent bar */}
            <View style={[styles.levelBar, { backgroundColor: levelColor }]} />

            {/* Catálogo info — dark card */}
            <View style={styles.infoCard}>
              <Text style={styles.catalogoNombre}>{catalogo.nombre}</Text>
              <View style={styles.subastadorRow}>
                <View style={[styles.subastadorDot, { backgroundColor: levelColor }]} />
                <Text style={styles.subastadorText}>{subastador}</Text>
              </View>
              <Text style={styles.catalogoDesc}>{catalogo.descripcion}</Text>
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
            onPress={() => navigation.navigate('ItemDetail', { itemId: item.id, subastaId: catalogo.id })}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backBtn: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catBadge: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  catBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  timerBadge: {
    position: 'absolute',
    bottom: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  timerText: { color: D.accent, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // Level bar
  levelBar: { height: 3 },

  // Info card — dark surface
  infoCard: {
    backgroundColor: D.card,
    marginHorizontal: spacing.base,
    marginTop: -spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: D.border,
  },
  catalogoNombre: { fontSize: 20, fontWeight: '800', color: D.text },
  subastadorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  subastadorDot: { width: 7, height: 7, borderRadius: 4 },
  subastadorText: { fontSize: 13, color: D.textSub },
  catalogoDesc: { fontSize: 13, color: D.textSub, lineHeight: 20 },

  // Section
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
    borderRadius: borderRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Item rows
  itemRow: {
    flexDirection: 'row',
    backgroundColor: D.card,
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: D.border,
  },
  itemImage: { width: 110, height: 110 },
  itemInfo: { flex: 1, padding: spacing.md, gap: 4 },
  itemNombre: { fontSize: 15, fontWeight: '700', color: D.text },
  itemDesc: { fontSize: 12, color: D.textSub, lineHeight: 17 },
  itemPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.xs },
  priceLabel: { fontSize: 10, color: D.textSub, marginBottom: 1 },
  priceBase: { fontSize: 13, fontWeight: '600', color: D.text },
  ofertaWrap: { alignItems: 'flex-end' },
  ofertaPrice: { fontSize: 14, fontWeight: '700', color: D.accent },
  chevron: { paddingRight: spacing.sm },

  separator: { height: spacing.md },

  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: 15, color: D.textSub, textAlign: 'center' },
});
