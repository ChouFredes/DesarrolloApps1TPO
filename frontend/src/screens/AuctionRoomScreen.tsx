import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

// ─── POLYFILLS PARA STOMP EN REACT NATIVE ────────────────────────────────────
// STOMP necesita TextEncoder/Decoder para funcionar en Android/iOS
if (typeof (global as any).TextEncoder === 'undefined') {
  (global as any).TextEncoder = class {
    encode(str: string) {
      const utf8Str = unescape(encodeURIComponent(str));
      const buf = new Uint8Array(utf8Str.length);
      for (let i = 0; i < utf8Str.length; i++) {
        buf[i] = utf8Str.charCodeAt(i);
      }
      return buf;
    }
  };
}
if (typeof (global as any).TextDecoder === 'undefined') {
  (global as any).TextDecoder = class {
    decode(buf: any) {
      let view: Uint8Array;
      if (buf instanceof Uint8Array) {
        view = buf;
      } else if (buf instanceof ArrayBuffer) {
        view = new Uint8Array(buf);
      } else if (buf && buf.buffer instanceof ArrayBuffer) {
        view = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      } else {
        view = new Uint8Array(buf || []);
      }
      
      let str = "";
      for (let i = 0; i < view.length; i++) {
        str += String.fromCharCode(view[i]);
      }
      
      try {
        return decodeURIComponent(escape(str));
      } catch (e) {
        return str;
      }
    }
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────
type NavProp = StackNavigationProp<HomeStackParamList, 'AuctionRoom'>;
type RouteProps = RouteProp<HomeStackParamList, 'AuctionRoom'>;

interface Bid {
  id: string;
  numeroPostor: number | string;
  importe: number;
  timestamp: string;
}

interface ConectarResponse {
  asistenteId: number;
  numeroPostor: number;
  mayorOfertaActual: number;
  pujaMinima?: number;
  pujaMaxima?: number | null;
  historialPujas?: Bid[];
  medioPagoSeleccionado?: { id: number };
}

type OfferStatus = 'idle' | 'procesando' | 'aceptada' | 'rechazada' | 'superada' | 'invalido';
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(fechaFin: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!fechaFin) return;
    const calc = () => {
      const diff = new Date(fechaFin).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Finalizado'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${String(h).padStart(2, '0')}H ${String(m).padStart(2, '0')}M ${String(s).padStart(2, '0')}S`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);
  return timeLeft;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AuctionRoomScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { token } = useAuthStore();
  const { subastaId, itemId, itemName } = route.params;

  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [fechaFin, setFechaFin] = useState<string | null>(null);
  const [numeroPostor, setNumeroPostor] = useState<number | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [pujaMinima, setPujaMinima] = useState<number | null>(null);
  const [pujaMaxima, setPujaMaxima] = useState<number | null | undefined>(undefined);
  const [medioPagoId, setMedioPagoId] = useState<number | null>(null);

  const [offerStatus, setOfferStatus] = useState<OfferStatus>('idle');
  const [offerMessage, setOfferMessage] = useState('');
  const lastMyBid = useRef<number>(0);
  const statusFadeAnim = useRef(new Animated.Value(0)).current;

  const stompClient = useRef<Client | null>(null);
  const listRef = useRef<FlatList>(null);
  const timeLeft = useCountdown(fechaFin);
  const priceScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentPrice === 0) return;
    Animated.sequence([
      Animated.timing(priceScale, { toValue: 1.1, duration: 120, useNativeDriver: true }),
      Animated.spring(priceScale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [currentPrice]);

  const showStatusBanner = useCallback((fadeIn: boolean, cb?: () => void) => {
    Animated.timing(statusFadeAnim, {
      toValue: fadeIn ? 1 : 0,
      duration: fadeIn ? 200 : 300,
      useNativeDriver: true,
    }).start(cb);
  }, [statusFadeAnim]);

  const dismissOfferStatus = useCallback(() => {
    showStatusBanner(false, () => {
      setOfferStatus('idle');
      setOfferMessage('');
    });
  }, [showStatusBanner]);

  const triggerOfferStatus = useCallback((
    newStatus: OfferStatus,
    message: string,
    autoHideMs?: number,
  ) => {
    setOfferStatus(newStatus);
    setOfferMessage(message);
    showStatusBanner(true, () => {
      if (autoHideMs) {
        setTimeout(() => dismissOfferStatus(), autoHideMs);
      }
    });
  }, [showStatusBanner, dismissOfferStatus]);

  const initialize = useCallback(async () => {
    try {
      setInitError(null);
      setInitLoading(true);

      const [conectarRes, subastaRes] = await Promise.all([
        axios.post<ConectarResponse>(
          `${API_BASE_URL}/subastas/${subastaId}/conectar`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        axios.get<{ mayorOfertaActual?: number; fechaFin: string; itemActual?: { precioBase: number } }>(
          `${API_BASE_URL}/subastas/${subastaId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ]);

      const conexionData = {
        ...conectarRes.data,
        mayorOfertaActual:
          conectarRes.data.mayorOfertaActual ??
          subastaRes.data.mayorOfertaActual ??
          subastaRes.data.itemActual?.precioBase ??
          0,
      };
      setFechaFin(subastaRes.data.fechaFin);

      setCurrentPrice(conexionData.mayorOfertaActual);
      setNumeroPostor(conexionData.numeroPostor);
      if (conexionData.pujaMinima !== undefined) setPujaMinima(conexionData.pujaMinima);
      if (conexionData.pujaMaxima !== undefined) setPujaMaxima(conexionData.pujaMaxima);
      if (conexionData.medioPagoSeleccionado?.id) setMedioPagoId(conexionData.medioPagoSeleccionado.id);

      if (conexionData.historialPujas && conexionData.historialPujas.length > 0) {
        const sorted = [...conexionData.historialPujas].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        setBids(sorted);
      }
    } catch (e: any) {
      console.error("Error inicializando subasta:", e);
      setInitError(e?.response?.data?.message ?? 'No se pudo conectar a la subasta.');
    } finally {
      setInitLoading(false);
    }
  }, [subastaId, token]);

  const connectWs = useCallback(() => {
    const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/ws-native`;
    console.log("Intentando conexión WebSocket a:", wsUrl);

    setStatus('connecting');

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (msg) => console.log('STOMP DEBUG:', msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      onConnect: () => {
        console.log("¡CONEXIÓN WS ESTABLECIDA!");
        setStatus('connected');

        client.subscribe(`/topic/auctions/${subastaId}/bids`, (msg) => {
          try {
            const puja = JSON.parse(msg.body);
            const amount = puja.importe ?? puja.monto ?? 0;
            const newBid: Bid = {
              id: `${Date.now()}-${Math.random()}`,
              numeroPostor: puja.numeroPostor ?? '?',
              importe: amount,
              timestamp: puja.timestamp ?? puja.fechaHora ?? new Date().toISOString(),
            };
            setBids((prev) => [newBid, ...prev]);
            setCurrentPrice((prev) => Math.max(prev, amount));

            if (numeroPostor !== null && puja.numeroPostor !== numeroPostor && amount > lastMyBid.current && lastMyBid.current > 0) {
              triggerOfferStatus('superada', '¡Tu oferta fue superada!', 4000);
            }
          } catch (err) {
            console.error("Error procesando mensaje de puja:", err);
          }
        });

        client.subscribe('/user/queue/errors', (msg) => {
          Alert.alert('Error en subasta', msg.body);
        });
      },
      onDisconnect: () => {
        console.log("WS Desconectado");
        setStatus('disconnected');
      },
      onStompError: (frame) => {
        console.error('STOMP ERROR:', frame.headers['message']);
        setStatus('error');
      },
      onWebSocketError: (event) => {
        console.error('WEB_SOCKET ERROR:', event);
        setStatus('error');
      },
    });

    client.activate();
    stompClient.current = client;
  }, [subastaId, token, triggerOfferStatus, numeroPostor]);

  useEffect(() => {
    initialize();
    connectWs();

    return () => {
      stompClient.current?.deactivate();
      axios.post(`${API_BASE_URL}/subastas/${subastaId}/desconectar`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    };
  }, [subastaId]);

  const handleBid = () => {
    const amount = parseFloat(bidAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      triggerOfferStatus('invalido', 'Monto inválido.');
      return;
    }
    if (amount <= currentPrice) {
      triggerOfferStatus('invalido', `Debe superar $${currentPrice}`);
      return;
    }

    if (!stompClient.current?.connected) {
      Alert.alert('Sin conexión', 'Reconectando al servidor...');
      return;
    }

    triggerOfferStatus('procesando', '');
    try {
      stompClient.current!.publish({
        destination: `/app/auctions/${subastaId}/bid`,
        body: JSON.stringify({ itemId, importe: amount, medioPagoId }),
      });
      lastMyBid.current = amount;
      setBidAmount('');
      triggerOfferStatus('aceptada', '¡Oferta enviada!', 2000);
    } catch (err) {
      console.error("Error al enviar puja:", err);
      triggerOfferStatus('rechazada', 'Error al enviar.', 3000);
    }
  };

  const renderBid = ({ item }: { item: Bid }) => (
    <View style={[styles.bidRow, item.numeroPostor === numeroPostor && styles.bidRowMine]}>
      <View style={[styles.bidPostorBadge, item.numeroPostor === numeroPostor && styles.bidPostorBadgeMine]}>
        <Text style={styles.bidPostorText}>#{item.numeroPostor}</Text>
      </View>
      <View style={styles.bidInfo}>
        <Text style={styles.bidAmount}>$ {item.importe.toLocaleString('es-AR')}</Text>
        <Text style={styles.bidTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
    </View>
  );

  if (initLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Conectando a la subasta…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{itemName}</Text>
            <Text style={styles.headerTimer}>{timeLeft}</Text>
          </View>
          <View style={[styles.statusDot, status === 'connected' ? styles.dotGreen : status === 'connecting' ? styles.dotYellow : styles.dotRed]} />
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.ofertaLabel}>Oferta actual</Text>
          <Animated.View style={{ transform: [{ scale: priceScale }] }}>
            <Text style={styles.ofertaPrice}>$ {currentPrice.toLocaleString('es-AR')}</Text>
          </Animated.View>
          {numeroPostor && <Text style={styles.postorLabel}>Tu número: #{numeroPostor}</Text>}
        </View>

        <View style={styles.historySection}>
          <FlatList
            data={bids}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderBid}
            contentContainerStyle={styles.bidList}
            ItemSeparatorComponent={() => <View style={styles.bidSeparator} />}
          />
        </View>

        <View style={styles.inputArea}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.bidInput}
              value={bidAmount}
              onChangeText={setBidAmount}
              placeholder={`Mín. $${(currentPrice + 1).toLocaleString()}`}
              keyboardType="numeric"
              editable={status === 'connected'}
            />
            <TouchableOpacity
              style={[styles.pujarBtn, status !== 'connected' && styles.pujarBtnDisabled]}
              onPress={handleBid}
              disabled={status !== 'connected'}
            >
              <Text style={styles.pujarBtnText}>Pujar</Text>
            </TouchableOpacity>
          </View>

          {offerStatus !== 'idle' && (
            <Animated.View style={[styles.statusBanner, { opacity: statusFadeAnim, backgroundColor: offerStatus === 'aceptada' ? colors.success : colors.primary }]}>
              <Text style={styles.statusBannerText}>{offerMessage || 'Procesando...'}</Text>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary, marginTop: 10 },
  header: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', padding: 15 },
  headerCenter: { flex: 1, marginLeft: 15 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerTimer: { color: colors.accent, fontSize: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  dotGreen: { backgroundColor: '#27AE60' },
  dotYellow: { backgroundColor: '#F5A623' },
  dotRed: { backgroundColor: '#E74C3C' },
  priceSection: { backgroundColor: colors.primary, paddingBottom: 30, alignItems: 'center' },
  ofertaLabel: { color: 'rgba(255,255,255,0.7)' },
  ofertaPrice: { color: colors.accent, fontSize: 42, fontWeight: '700' },
  postorLabel: { color: 'rgba(255,255,255,0.6)', marginTop: 5 },
  historySection: { flex: 1, padding: 15 },
  bidList: { paddingBottom: 20 },
  bidRow: { flexDirection: 'row', backgroundColor: colors.surface, padding: 15, borderRadius: 10, ...shadows.card },
  bidRowMine: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  bidPostorBadge: { backgroundColor: colors.primary, padding: 5, borderRadius: 5, minWidth: 40, alignItems: 'center' },
  bidPostorBadgeMine: { backgroundColor: colors.accent },
  bidPostorText: { color: '#fff', fontWeight: 'bold' },
  bidInfo: { marginLeft: 15, flex: 1 },
  bidAmount: { fontSize: 16, fontWeight: 'bold' },
  bidTime: { fontSize: 12, color: colors.textSecondary },
  bidSeparator: { height: 10 },
  inputArea: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  inputBar: { flexDirection: 'row', padding: 15, gap: 10 },
  bidInput: { flex: 1, backgroundColor: colors.background, borderRadius: 25, paddingHorizontal: 20, height: 50, borderWidth: 1, borderColor: colors.border },
  pujarBtn: { backgroundColor: colors.primary, borderRadius: 25, paddingHorizontal: 25, justifyContent: 'center' },
  pujarBtnDisabled: { opacity: 0.5 },
  pujarBtnText: { color: '#fff', fontWeight: 'bold' },
  statusBanner: { padding: 10, alignItems: 'center' },
  statusBannerText: { color: '#fff', fontWeight: 'bold' }
});

export default AuctionRoomScreen;
