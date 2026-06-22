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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { LinearGradient } from 'expo-linear-gradient';
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

// La pokeball representa el NIVEL de acceso de la subasta (a mayor nivel, ball más rara).
const POKEBALL_BY_NIVEL: Record<string, any> = {
  comun: require('../../assets/pokeballs/pokeball.png'),
  especial: require('../../assets/pokeballs/superball.png'),
  plata: require('../../assets/pokeballs/greatball.png'),
  oro: require('../../assets/pokeballs/ultraball.png'),
  platino: require('../../assets/pokeballs/masterball.png'),
};
const POKEBALL_DEFAULT = require('../../assets/pokeballs/pokeball.png');
const ROTOM_IMG = require('../../assets/pokeballs/rotom.png');
const CARD_IMG_H = 110; // altura fija de imagen en cada card
const SCAN_H = Math.floor(CARD_IMG_H * 0.35); // altura concreta para el scanline (38px)

function getPokeballSource(nivel: string) {
  return POKEBALL_BY_NIVEL[nivel] ?? POKEBALL_DEFAULT;
}

// ── ScanlineOverlay ────────────────────────────────────────────────────────
// opacity fade-in/out: evita el clip abrupto sin necesitar overflow:hidden
function ScanlineOverlay() {
  const scanY = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    let active = true;
    const runAnimation = () => {
      if (!active) return;
      scanY.setValue(-1);
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: 1,
          duration: 2800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ]).start((result) => {
        if (result.finished && active) {
          runAnimation();
        }
      });
    };

    runAnimation();

    return () => {
      active = false;
      scanY.stopAnimation();
    };
  }, [scanY]);

  const translateY = scanY.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCAN_H, CARD_IMG_H],
  });

  // fade 0→0.6 al entrar por arriba, 0.6→0 al salir por abajo
  const opacity = scanY.interpolate({
    inputRange: [-1, -0.75, 0.55, 1],
    outputRange: [0, 0.6, 0.6, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: SCAN_H,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <LinearGradient
        colors={['rgba(0,234,223,0)', 'rgba(0,234,223,0.08)', 'rgba(0,234,223,0)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1.5,
          backgroundColor: '#00EADF',
          shadowColor: '#00EADF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 3,
          elevation: 4,
        }}
      />
    </Animated.View>
  );
}

type Subasta = {
  id: number;
  titulo: string;
  categoria: string;
  nivel: string;
  ubicacion: string;
  fechaFin: string;
  cantidadItems: number;
  imagenPortadaUrl: string | null;
};

const { width: SW } = Dimensions.get('window');
const PAD = 14;
const GAP = 12;

type NavProp = StackNavigationProp<HomeStackParamList, 'HomeMain'>;

// ── Hooks ──────────────────────────────────────────────────────────────────

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

// ── AuctionCard ────────────────────────────────────────────────────────────
interface CardProps {
  item: Subasta;
  gIdx: number;
  onPress: () => void;
  fontsLoaded?: boolean;
}

function AuctionCard({ item, gIdx, onPress, fontsLoaded }: CardProps) {
  const imgUrl = item.imagenPortadaUrl
    ? (item.imagenPortadaUrl.startsWith('/')
      ? `${API_BASE_URL}${item.imagenPortadaUrl}`
      : item.imagenPortadaUrl)
    : '';

  const { full } = useCountdownBoth(item.fechaFin);
  const finalizado = full === 'Finalizado';
  const levelColor = LEVEL_COLORS[item.categoria] ?? '#00EADF';

  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 350,
      delay: Math.min(gIdx * 60, 400),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const translateY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });



  return (
    <Animated.View style={[s.card, { opacity: entryAnim, transform: [{ translateY }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={finalizado} style={{ flex: 1 }}>
        <View style={s.cardInner}>

          {/* Imagen superior */}
          <View style={s.imgBox}>
            {imgUrl ? (
              <Image
                source={{ uri: imgUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            ) : (
              // Sin portada (ej. subastas stock sin imagen): mostramos la pokeball del nivel.
              <View style={[StyleSheet.absoluteFillObject, s.imgEmpty]}>
                <Image
                  source={getPokeballSource(item.nivel)}
                  style={s.imgFallbackBall}
                  resizeMode="contain"
                />
              </View>
            )}
            <ScanlineOverlay />
          </View>

          {/* Contenido inferior */}
          <View style={s.cardBody}>
            {/* Pokéball + título */}
            <View style={s.cardTitleRow}>
              <Image
                source={getPokeballSource(item.nivel)}
                style={s.pokeballBadge}
              />
              <Text style={s.name} numberOfLines={2}>{item.titulo}</Text>
            </View>

            {/* Timer */}
            <View style={s.timerRow}>
              <Ionicons name="time-outline" size={10} color={W.accent} />
              <Text style={[
                s.timerCode,
                fontsLoaded && { fontFamily: 'PressStart2P_400Regular', fontSize: 8 },
              ]}>{full}</Text>
            </View>

            {/* Botón Ofertar */}
            <TouchableOpacity
              style={[s.bidBtn, finalizado && s.bidBtnDisabled]}
              onPress={onPress}
              activeOpacity={0.75}
              disabled={finalizado}
            >
              <Text style={[
                s.bidBtnTxt,
                finalizado && s.bidBtnTxtDisabled,
                fontsLoaded && { fontFamily: 'PressStart2P_400Regular', fontSize: 7 },
              ]}>{finalizado ? 'FINALIZADA' : 'OFERTAR'}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log('Expo Push Token obtenido:', token);
    } catch (error) {
      console.log('Error obteniendo token con projectId:', error);
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo Push Token obtenido (sin projectId):', token);
      } catch (err) {
        console.log('Error final obteniendo token:', err);
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// ── HomeScreen ─────────────────────────────────────────────────────────────
export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { token, user, setUser } = useAuthStore();
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });

  useEffect(() => {
    if (!token) return;

    registerForPushNotificationsAsync().then(pushToken => {
      if (pushToken) {
        fetch(`${API_BASE_URL}/usuarios/me/token-notificacion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: pushToken }),
        })
          .then(res => {
            if (res.ok) {
              console.log('Token de notificación registrado con éxito en el backend.');
            } else {
              console.log('Error registrando token de notificación en el backend:', res.status);
            }
          })
          .catch(err => {
            console.error('Error al registrar token de notificación:', err);
          });
      }
    });
  }, [token]);

  // Rotom animation refs
  const rotomFloat = useRef(new Animated.Value(0)).current;
  const rotomRing1 = useRef(new Animated.Value(1)).current;
  const rotomRing2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotomFloat, { toValue: -5, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rotomFloat, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rotomRing1, { toValue: 1.18, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rotomRing2, { toValue: 1.35, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(rotomRing1, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rotomRing2, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

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

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser({
          id: data.id,
          nombre: data.nombre,
          apellido: data.apellido,
          categoria: data.categoria,
          admitido: data.admitido,
        });
      }
    } catch (_) { }
  }, [token, setUser]);

  useFocusEffect(
    useCallback(() => {
      fetchSubastas();
      fetchUserProfile();
    }, [fetchSubastas, fetchUserProfile])
  );

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchSubastas(), fetchUserProfile()]).finally(() => setRefreshing(false));
  };

  const initials = user
    ? `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase()
    : '?';
  const nombre = user?.nombre ?? 'Usuario';

  const filtered = subastas;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.greetingWrap}>
          <Text style={[
            s.greetingSub,
            fontsLoaded && { fontFamily: 'PressStart2P_400Regular', fontSize: 7 },
          ]}>BIENVENIDO DE NUEVO</Text>
          <Text style={s.greetingName}>¡Hola {nombre}!</Text>
        </View>
        <View style={s.rotomWrap}>
          <Animated.View style={[s.rotomRing, s.rotomRing1, { transform: [{ scale: rotomRing1 }] }]} />
          <Animated.View style={[s.rotomRing, s.rotomRing2, { transform: [{ scale: rotomRing2 }] }]} />
          <Animated.Image
            source={ROTOM_IMG}
            style={[s.rotomImg, { transform: [{ translateY: rotomFloat }] }]}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Banner de validación pendiente */}
      {user?.admitido !== 'si' && (
        <View style={s.validationBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#00EADF" />
          <Text style={s.validationBannerTxt}>
            Tu cuenta está pendiente de validación. Puedes explorar pero no podrás pujar.
          </Text>
        </View>
      )}

      {/* Search bar */}
      <TouchableOpacity
        style={s.searchBar}
        onPress={() => navigation.getParent()?.navigate('Search' as never)}
        activeOpacity={0.8}
      >
        <Ionicons name="search-outline" size={18} color={'rgba(0,234,223,0.5)'} />
        <Text style={s.searchPlaceholder}>Buscar subastas...</Text>
      </TouchableOpacity>



      {/* Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.gridWrap}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={W.accent} />
        }
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="archive-outline" size={48} color={W.inactive} />
            <Text style={s.emptyTitle}>Sin subastas activas</Text>
            <Text style={s.emptyText}>No hay subastas disponibles en este momento.</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {filtered.map((item, i) => (
              <AuctionCard
                key={item.id}
                item={item}
                gIdx={i}
                fontsLoaded={fontsLoaded}
                onPress={() => navigation.navigate('CatalogoDetail', { subastaId: item.id })}
              />
            ))}
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


  // Rotom
  rotomWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rotomRing: {
    position: 'absolute',
    borderRadius: 22,
    borderWidth: 1,
  },
  rotomRing1: {
    width: 44,
    height: 44,
    borderColor: 'rgba(0,234,223,0.25)',
  },
  rotomRing2: {
    width: 44,
    height: 44,
    borderColor: 'rgba(0,234,223,0.1)',
  },
  rotomImg: {
    width: 34,
    height: 34,
  },

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
  validationBanner: {
    backgroundColor: 'rgba(0, 234, 223, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 234, 223, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  validationBannerTxt: {
    color: '#00EADF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },



  // Layout del grid
  gridWrap: { paddingHorizontal: PAD, paddingTop: 4, paddingBottom: 40 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },

  // Card — ocupa mitad del ancho menos el gap
  card: {
    width: '47.5%',     // dos columnas con gap entre medio
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.2)',
    shadowColor: '#00EADF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInner: {
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: W.card,
    flex: 1,
  },

  // Imagen superior fija
  imgBox: {
    height: CARD_IMG_H,
    backgroundColor: W.imgEmpty,
    position: 'relative',
  },
  imgEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgFallbackBall: {
    width: 56,
    height: 56,
    opacity: 0.85,
  },



  // Contenido inferior
  cardBody: {
    paddingHorizontal: 9,
    paddingTop: 8,
    paddingBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 5,
  },
  pokeballBadge: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    flexShrink: 0,
    marginTop: 1,
  },
  name: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: W.text,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  timerCode: {
    fontSize: 10,
    color: W.accent,
    fontVariant: ['tabular-nums'],
    opacity: 0.9,
  },

  // Botón Ofertar
  bidBtn: {
    backgroundColor: 'rgba(0,234,223,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.3)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  bidBtnTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: W.accent,
    letterSpacing: 0.8,
  },
  bidBtnDisabled: {
    backgroundColor: 'rgba(225,225,225,0.05)',
    borderColor: 'rgba(225,225,225,0.15)',
  },
  bidBtnTxtDisabled: {
    color: W.inactive,
  },

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
