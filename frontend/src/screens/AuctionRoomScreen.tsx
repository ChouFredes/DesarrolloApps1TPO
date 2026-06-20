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
import { spacing } from '../theme';
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
  itemActual?: { id: number; precioBase: number };
  puedeOfertar?: boolean;
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
      const totalH = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const d = Math.floor(totalH / 24);
      const h = totalH % 24;
      setTimeLeft(d >= 2 ? `${d}d ${h}h` : `${totalH}h ${m}m`);
    };
    calc();
    const id = setInterval(calc, 60_000);
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
  const [basePrice, setBasePrice] = useState<number>(0);
  const [currentItemId, setCurrentItemId] = useState<number>(itemId);
  const [fechaFin, setFechaFin] = useState<string | null>(null);
  const [numeroPostor, setNumeroPostor] = useState<number | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [pujaMinima, setPujaMinima] = useState<number | null>(null);
  const [pujaMaxima, setPujaMaxima] = useState<number | null | undefined>(undefined);
  const [medioPagoId, setMedioPagoId] = useState<number | null>(null);
  const [puedeOfertar, setPuedeOfertar] = useState(true);

  const [offerStatus, setOfferStatus] = useState<OfferStatus>('idle');
  const [offerMessage, setOfferMessage] = useState('');
  const lastMyBid = useRef<number>(0);
  const statusFadeAnim = useRef(new Animated.Value(0)).current;

  const stompClient = useRef<Client | null>(null);
  const listRef = useRef<FlatList>(null);
  const currentItemIdRef = useRef<number>(itemId);
  const basePriceRef = useRef<number>(basePrice);
  const pujaMaximaRef = useRef<number | null | undefined>(pujaMaxima);
  const timeLeft = useCountdown(fechaFin);
  const priceScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    currentItemIdRef.current = currentItemId;
  }, [currentItemId]);

  useEffect(() => {
    basePriceRef.current = basePrice;
  }, [basePrice]);

  useEffect(() => {
    pujaMaximaRef.current = pujaMaxima;
  }, [pujaMaxima]);

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
          `${API_BASE_URL}/subastas/${subastaId}/conectar?itemId=${itemId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        axios.get<{ fechaFin: string }>(
          `${API_BASE_URL}/subastas/${subastaId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ]);

      const conexionData = conectarRes.data;
      const itemActual = conexionData.itemActual;

      setFechaFin(subastaRes.data.fechaFin);
      const calculatedBasePrice = itemActual?.precioBase ?? 0;
      setBasePrice(calculatedBasePrice);

      if (itemActual?.id) {
        setCurrentItemId(itemActual.id);
      }

      const initialPrice = conexionData.mayorOfertaActual ?? calculatedBasePrice;
      setCurrentPrice(initialPrice);
      setNumeroPostor(conexionData.numeroPostor);

      if (conexionData.pujaMinima !== undefined && conexionData.pujaMinima !== null) {
        setPujaMinima(conexionData.pujaMinima);
      } else {
        setPujaMinima(initialPrice + calculatedBasePrice * 0.01);
      }

      if (conexionData.pujaMaxima !== undefined) {
        setPujaMaxima(conexionData.pujaMaxima);
      } else {
        setPujaMaxima(initialPrice + calculatedBasePrice * 0.20);
      }

      if (conexionData.medioPagoSeleccionado?.id) {
        setMedioPagoId(conexionData.medioPagoSeleccionado.id);
      }

      if (conexionData.puedeOfertar !== undefined) {
        setPuedeOfertar(conexionData.puedeOfertar);
      }

      if (conexionData.historialPujas && conexionData.historialPujas.length > 0) {
        const sorted = [...conexionData.historialPujas].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        setBids(sorted);
      } else {
        setBids([]);
      }
    } catch (e: any) {
      console.error("Error inicializando subasta:", e);
      setInitError(
        e?.response?.data?.detalle ||
        e?.response?.data?.mensaje ||
        e?.response?.data?.message ||
        'No se pudo conectar a la subasta.'
      );
    } finally {
      setInitLoading(false);
    }
  }, [subastaId, itemId, token]);

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
            if (puja.itemId !== currentItemIdRef.current) return;
            const amount = puja.importe ?? puja.monto ?? 0;
            const newBid: Bid = {
              id: `${Date.now()}-${Math.random()}`,
              numeroPostor: puja.numeroPostor ?? '?',
              importe: amount,
              timestamp: puja.timestamp ?? puja.fechaHora ?? new Date().toISOString(),
            };
            setBids((prev) => [newBid, ...prev]);

            setCurrentPrice((prev) => {
              const nextPrice = Math.max(prev, amount);
              const bp = basePriceRef.current;
              setPujaMinima(nextPrice + bp * 0.01);
              if (pujaMaximaRef.current !== null && pujaMaximaRef.current !== undefined) {
                setPujaMaxima(nextPrice + bp * 0.20);
              }
              return nextPrice;
            });

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
  }, [subastaId, itemId]);

  const handleQuickBidPercent = (percent: number) => {
    const calculated = currentPrice + basePrice * percent;
    setBidAmount(Number(calculated.toFixed(2)).toString());
  };

  const handleBid = () => {
    const amount = parseFloat(bidAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      triggerOfferStatus('invalido', 'Monto inválido.');
      return;
    }
    if (pujaMinima !== null && amount < pujaMinima) {
      triggerOfferStatus('invalido', `Mínimo: $${pujaMinima.toLocaleString('es-AR')}`);
      return;
    }
    if (pujaMaxima !== null && pujaMaxima !== undefined && amount > pujaMaxima) {
      triggerOfferStatus('invalido', `Máximo: $${pujaMaxima.toLocaleString('es-AR')}`);
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
        body: JSON.stringify({ itemId: currentItemId, importe: amount, medioPagoId }),
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
          <ActivityIndicator size="large" color="#00EADF" />
          <Text style={styles.loadingText}>Conectando a la subasta…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
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
          {!puedeOfertar ? (
            <View style={styles.unverifiedContainer}>
              <Ionicons name="card-outline" size={24} color="#FF6B6B" style={{ marginBottom: 6 }} />
              <Text style={styles.unverifiedText}>Verificá tu medio de pago para poder ofertar.</Text>
              <TouchableOpacity
                style={styles.goToPaymentsBtn}
                activeOpacity={0.8}
                onPress={() => (navigation as any).navigate('Profile', { screen: 'MetodosDePago' })}
              >
                <Text style={styles.goToPaymentsBtnText}>Ir a Métodos de Pago</Text>
                <Ionicons name="arrow-forward" size={16} color="#0A1626" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {basePrice > 0 && status === 'connected' && (
                <View style={styles.quickBidsRow}>
                  {[0.05, 0.10, 0.20].map((pct) => {
                    const addAmount = basePrice * pct;
                    return (
                      <TouchableOpacity
                        key={pct}
                        style={styles.quickBidBtn}
                        onPress={() => handleQuickBidPercent(pct)}
                      >
                        <Text style={styles.quickBidBtnText}>+{pct * 100}% (${addAmount.toLocaleString()})</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.inputBar}>
                <TextInput
                  style={styles.bidInput}
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  placeholder={pujaMinima !== null ? `Mín. $${pujaMinima.toLocaleString('es-AR')}` : `Mín. $${(currentPrice + 1).toLocaleString('es-AR')}`}
                  placeholderTextColor="rgba(225,225,225,0.35)"
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
            </>
          )}

          {offerStatus !== 'idle' && (
            <Animated.View style={[
              styles.statusBanner,
              {
                opacity: statusFadeAnim,
                backgroundColor: offerStatus === 'aceptada' ? '#00EADF'
                  : offerStatus === 'invalido' ? '#FF6B6B'
                  : offerStatus === 'superada' ? '#F5C542'
                  : '#00EADF'
              }
            ]}>
              <Text style={styles.statusBannerText}>{offerMessage || 'Procesando...'}</Text>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F1F35' },
  flex: { flex: 1 },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1F35',
  },
  loadingText: {
    color: 'rgba(225,225,225,0.5)',
    marginTop: 12,
    fontSize: 14,
  },

  // Header
  header: {
    backgroundColor: '#0A1626',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,234,223,0.15)',
  },
  headerCenter: { flex: 1, marginLeft: 15 },
  headerTitle: { color: '#E1E1E1', fontSize: 16, fontWeight: '700' },
  headerTimer: { color: '#00EADF', fontSize: 12, marginTop: 2, fontVariant: ['tabular-nums'] },

  // Status dot
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotGreen: { backgroundColor: '#00EADF', shadowColor: '#00EADF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  dotYellow: { backgroundColor: '#F5C542' },
  dotRed: { backgroundColor: '#FF6B6B' },

  // Price section
  priceSection: {
    backgroundColor: '#0A1626',
    paddingVertical: 24,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,234,223,0.1)',
  },
  ofertaLabel: {
    color: 'rgba(225,225,225,0.5)',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ofertaPrice: {
    color: '#00EADF',
    fontSize: 46,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  postorLabel: {
    color: 'rgba(225,225,225,0.4)',
    marginTop: 6,
    fontSize: 12,
    letterSpacing: 0.3,
  },

  // Bid history
  historySection: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  bidList: { paddingBottom: 20 },
  bidRow: {
    flexDirection: 'row',
    backgroundColor: '#0D1E33',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.12)',
    alignItems: 'center',
  },
  bidRowMine: {
    borderLeftWidth: 3,
    borderLeftColor: '#00EADF',
    borderColor: 'rgba(0,234,223,0.3)',
    backgroundColor: 'rgba(0,234,223,0.05)',
  },
  bidPostorBadge: {
    backgroundColor: '#152C44',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(0,234,223,0.2)',
  },
  bidPostorBadgeMine: {
    backgroundColor: 'rgba(0,234,223,0.15)',
    borderColor: '#00EADF',
  },
  bidPostorText: {
    color: '#00EADF',
    fontWeight: '700',
    fontSize: 12,
  },
  bidInfo: { marginLeft: 12, flex: 1 },
  bidAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E1E1E1',
    fontVariant: ['tabular-nums'],
  },
  bidTime: {
    fontSize: 11,
    color: 'rgba(225,225,225,0.4)',
    marginTop: 2,
  },
  bidSeparator: { height: 8 },

  // Input area
  inputArea: {
    backgroundColor: '#0A1626',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,234,223,0.15)',
    paddingBottom: 8,
  },
  unverifiedContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unverifiedText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  goToPaymentsBtn: {
    backgroundColor: '#00EADF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goToPaymentsBtnText: {
    color: '#0A1626',
    fontWeight: '700',
    fontSize: 13,
  },
  quickBidsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 8,
  },
  quickBidBtn: {
    flex: 1,
    backgroundColor: 'rgba(0,234,223,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.25)',
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickBidBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00EADF',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  bidInput: {
    flex: 1,
    backgroundColor: '#152C44',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 50,
    borderWidth: 0.5,
    borderColor: 'rgba(0,234,223,0.2)',
    color: '#E1E1E1',
    fontSize: 15,
  },
  pujarBtn: {
    backgroundColor: '#00EADF',
    borderRadius: 25,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pujarBtnDisabled: { opacity: 0.4 },
  pujarBtnText: {
    color: '#0A1626',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // Status banner
  statusBanner: {
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusBannerText: {
    color: '#0A1626',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default AuctionRoomScreen;
