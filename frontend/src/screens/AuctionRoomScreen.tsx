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
// ─── Dev flag ───────────────────────────────────────────────────────────────
const DEV_MODE = false;

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

  // Core state
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [fechaFin, setFechaFin] = useState<string | null>(null);
  const [numeroPostor, setNumeroPostor] = useState<number | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Corrección 1.2 — rango de pujas
  const [pujaMinima, setPujaMinima] = useState<number | null>(null);
  const [pujaMaxima, setPujaMaxima] = useState<number | null | undefined>(undefined);

  // Corrección 1.3 — estados post-oferta
  const [offerStatus, setOfferStatus] = useState<OfferStatus>('idle');
  const [offerMessage, setOfferMessage] = useState('');
  const lastMyBid = useRef<number>(0);
  const statusFadeAnim = useRef(new Animated.Value(0)).current;

  const stompClient = useRef<Client | null>(null);
  const listRef = useRef<FlatList>(null);
  const timeLeft = useCountdown(fechaFin);
  const priceScale = useRef(new Animated.Value(1)).current;

  // Price bounce animation
  useEffect(() => {
    if (currentPrice === 0) return;
    Animated.sequence([
      Animated.timing(priceScale, { toValue: 1.1, duration: 120, useNativeDriver: true }),
      Animated.spring(priceScale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [currentPrice]);

  // Status banner fade in/out
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

  // Show banner then auto-dismiss after `ms`
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

  // ── Step 1: REST connect ──────────────────────────────────────────────────
  const initialize = useCallback(async () => {
    try {
      setInitError(null);
      setInitLoading(true);

      let conexionData: ConectarResponse;

      {
        const [conectarRes, subastaRes] = await Promise.all([
          axios.post<ConectarResponse>(
            `${API_BASE_URL}/subastas/${subastaId}/conectar`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          ),
          axios.get<{ mayorOfertaActual?: number; precioBase: number; fechaFin: string }>(
            `${API_BASE_URL}/subastas/${subastaId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          ),
        ]);
        conexionData = {
          ...conectarRes.data,
          mayorOfertaActual:
            conectarRes.data.mayorOfertaActual ??
            subastaRes.data.mayorOfertaActual ??
            subastaRes.data.precioBase,
        };
        setFechaFin(subastaRes.data.fechaFin);
      }

      const { mayorOfertaActual, numeroPostor: postor, pujaMinima: min, pujaMaxima: max, historialPujas } = conexionData;

      setCurrentPrice(mayorOfertaActual);
      setNumeroPostor(postor);
      if (min !== undefined) setPujaMinima(min);
      if (max !== undefined) setPujaMaxima(max);          // null = sin límite
      if (historialPujas && historialPujas.length > 0) {
        const sorted = [...historialPujas].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        setBids(sorted);
      }

    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'No se pudo conectar a la subasta.';
      setInitError(msg);
    } finally {
      setInitLoading(false);
    }
  }, [subastaId, token]);

  // ── Step 2: WebSocket STOMP ───────────────────────────────────────────────
  const connectWs = useCallback(() => {
    setStatus('connecting');

    const client = new Client({
      brokerURL: `${API_BASE_URL.replace(/^http/, 'ws')}/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setStatus('connected');

        // Subscribe to public bids topic
        client.subscribe(`/topic/auctions/${subastaId}/bids`, (msg) => {
          try {
            const puja = JSON.parse(msg.body) as {
              numeroPostor?: number | string;
              importe?: number;
              monto?: number;
              timestamp?: string;
              fechaHora?: string;
            };
            const amount = puja.importe ?? puja.monto ?? 0;
            const newBid: Bid = {
              id: `${Date.now()}-${Math.random()}`,
              numeroPostor: puja.numeroPostor ?? '?',
              importe: amount,
              timestamp: puja.timestamp ?? puja.fechaHora ?? new Date().toISOString(),
            };
            setBids((prev) => [newBid, ...prev]);
            setCurrentPrice((prev) => Math.max(prev, amount));

            // Corrección 1.3 — estado SUPERADA
            // Si el bid entrante supera mi última puja y es de otro postor → notificar
            setNumeroPostor((myPostor) => {
              if (
                myPostor !== null &&
                puja.numeroPostor !== myPostor &&
                amount > lastMyBid.current &&
                lastMyBid.current > 0
              ) {
                triggerOfferStatus('superada', '¡Tu oferta fue superada!', 4000);
              }
              return myPostor;
            });
          } catch {
            // Malformed message — ignore
          }
        });

        // Subscribe to private error queue
        client.subscribe('/user/queue/errors', (msg) => {
          try {
            const err = JSON.parse(msg.body) as { message?: string };
            Alert.alert('Error en subasta', err.message ?? 'Error desconocido.');
          } catch {
            Alert.alert('Error en subasta', msg.body ?? 'Error desconocido.');
          }
        });
      },
      onDisconnect: () => setStatus('disconnected'),
      onStompError: () => setStatus('error'),
      onWebSocketError: () => setStatus('error'),
    });

    client.activate();
    stompClient.current = client;
  }, [subastaId, token, triggerOfferStatus]);

  useEffect(() => {
    initialize();
    connectWs();

    return () => {
      axios
        .post(
          `${API_BASE_URL}/subastas/${subastaId}/desconectar`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .catch(() => {});
      stompClient.current?.deactivate();
    };
  }, [initialize, connectWs, subastaId, token]);

  // ── Puja handling ─────────────────────────────────────────────────────────
  const handleBid = () => {
    const amount = parseFloat(bidAmount.replace(',', '.'));

    // Estado 5: MONTO_INVALIDO — validación inline antes de enviar
    if (isNaN(amount) || amount <= 0) {
      triggerOfferStatus('invalido', 'Ingresá un monto válido mayor a 0.');
      return;
    }
    if (amount <= currentPrice) {
      triggerOfferStatus('invalido', `La oferta debe superar la actual: $ ${currentPrice.toLocaleString('es-AR')}`);
      return;
    }
    if (pujaMinima !== null && pujaMinima !== undefined && amount < pujaMinima) {
      triggerOfferStatus('invalido', `El monto mínimo permitido es $ ${pujaMinima.toLocaleString('es-AR')}`);
      return;
    }
    if (pujaMaxima !== null && pujaMaxima !== undefined && amount > pujaMaxima) {
      triggerOfferStatus('invalido', `El monto máximo permitido es $ ${pujaMaxima.toLocaleString('es-AR')}`);
      return;
    }

    if (!stompClient.current?.connected) {
      Alert.alert('Sin conexión', 'No estás conectado al servidor de subastas.');
      return;
    }

    // Estado 1: PROCESANDO
    triggerOfferStatus('procesando', '');

    try {
      stompClient.current!.publish({
        destination: `/app/auctions/${subastaId}/bid`,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId, importe: amount }),
      });
      lastMyBid.current = amount;
      setBidAmount('');
      triggerOfferStatus('aceptada', '¡Oferta enviada!', 2000);
    } catch {
      triggerOfferStatus('rechazada', 'No se pudo enviar la oferta.', 3000);
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    } catch {
      return iso;
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderBid = ({ item }: { item: Bid }) => (
    <View style={[styles.bidRow, item.numeroPostor === numeroPostor && styles.bidRowMine]}>
      <View style={[styles.bidPostorBadge, item.numeroPostor === numeroPostor && styles.bidPostorBadgeMine]}>
        <Text style={styles.bidPostorText}>#{item.numeroPostor}</Text>
      </View>
      <View style={styles.bidInfo}>
        <Text style={styles.bidAmount}>$ {item.importe.toLocaleString('es-AR')}</Text>
        <Text style={styles.bidTime}>{formatTime(item.timestamp)}</Text>
      </View>
      {item.numeroPostor === numeroPostor && (
        <Ionicons name="person-circle-outline" size={18} color={colors.accent} />
      )}
    </View>
  );

  // Banner config per status
  const bannerConfig: Record<Exclude<OfferStatus, 'idle'>, { bg: string; icon: React.ComponentProps<typeof Ionicons>['name']; label?: string }> = {
    procesando: { bg: colors.primary, icon: 'hourglass-outline' },
    aceptada: { bg: colors.success, icon: 'checkmark-circle-outline' },
    rechazada: { bg: colors.error, icon: 'close-circle-outline' },
    superada: { bg: '#E67E22', icon: 'trending-up-outline' },
    invalido: { bg: '#7F8C8D', icon: 'alert-circle-outline' },
  };

  const isOfferBlocked = offerStatus === 'procesando';

  // ── Loading / Error screens ───────────────────────────────────────────────
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

  if (initError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{initError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={initialize}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{itemName}</Text>
            <Text style={styles.headerTimer}>{timeLeft || '—'}</Text>
          </View>
          <View style={[
            styles.statusDot,
            status === 'connected' ? styles.dotGreen
              : status === 'connecting' ? styles.dotYellow
              : styles.dotRed,
          ]} />
        </View>

        {/* ── Precio actual + postor ── */}
        <View style={styles.priceSection}>
          <Text style={styles.ofertaLabel}>Oferta actual</Text>
          <Animated.View style={{ transform: [{ scale: priceScale }] }}>
            <Text style={styles.ofertaPrice}>$ {currentPrice.toLocaleString('es-AR')}</Text>
          </Animated.View>
          {numeroPostor !== null && (
            <Text style={styles.postorLabel}>Tu número de postor: #{numeroPostor}</Text>
          )}

          {/* Corrección 1.2 — rango de pujas */}
          {(pujaMinima !== null && pujaMinima !== undefined) && (
            <View style={styles.rangePill}>
              <Text style={styles.rangeText}>
                Mín:{'  '}
                <Text style={styles.rangeValue}>$ {pujaMinima.toLocaleString('es-AR')}</Text>
                {'   —   '}
                Máx:{'  '}
                <Text style={styles.rangeValue}>
                  {pujaMaxima != null ? `$ ${pujaMaxima.toLocaleString('es-AR')}` : 'Sin límite'}
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* ── Historial ── */}
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>Historial de ofertas</Text>
          {bids.length === 0 ? (
            <View style={styles.emptyBids}>
              <Ionicons name="megaphone-outline" size={36} color={colors.textSecondary} />
              <Text style={styles.emptyBidsText}>Sé el primero en ofertar</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={bids}
              keyExtractor={(item) => item.id}
              renderItem={renderBid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bidList}
              ItemSeparatorComponent={() => <View style={styles.bidSeparator} />}
            />
          )}
        </View>

        {/* ── Área de puja (Corrección 1.2 + 1.3) ── */}
        <View style={styles.inputArea}>
          {/* Fila input + botón */}
          <View style={styles.inputBar}>
            <TextInput
              style={[styles.bidInput, isOfferBlocked && styles.bidInputDisabled]}
              value={bidAmount}
              onChangeText={(v) => {
                setBidAmount(v);
                // Limpiar estado invalido al escribir
                if (offerStatus === 'invalido') dismissOfferStatus();
              }}
              placeholder={
                pujaMinima
                  ? `Mín. $ ${pujaMinima.toLocaleString('es-AR')}`
                  : `Mín. $ ${(currentPrice + 1).toLocaleString('es-AR')}`
              }
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              returnKeyType="done"
              editable={status === 'connected' && !isOfferBlocked}
            />
            <TouchableOpacity
              style={[
                styles.pujarBtn,
                offerStatus === 'aceptada' && styles.pujarBtnAceptada,
                (isOfferBlocked || status !== 'connected') && styles.pujarBtnDisabled,
              ]}
              onPress={handleBid}
              disabled={isOfferBlocked || status !== 'connected'}
              activeOpacity={0.8}
            >
              {offerStatus === 'procesando' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.pujarBtnText}>
                  {offerStatus === 'aceptada' ? '✓ Aceptada' : 'Pujar'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Banner de estado con fade */}
          {offerStatus !== 'idle' && (
            <Animated.View
              style={[
                styles.statusBanner,
                { opacity: statusFadeAnim, backgroundColor: bannerConfig[offerStatus].bg },
              ]}
            >
              {offerStatus === 'procesando' ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.statusBannerText}>Procesando oferta…</Text>
                </>
              ) : (
                <>
                  <Ionicons name={bannerConfig[offerStatus].icon} size={18} color="#fff" />
                  <Text style={styles.statusBannerText}>{offerMessage}</Text>
                  {offerStatus !== 'aceptada' && offerStatus !== 'superada' && (
                    <TouchableOpacity onPress={dismissOfferStatus} style={styles.bannerClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Animated.View>
          )}
        </View>

        {/* Disconnected banner */}
        {status !== 'connected' && (
          <View style={styles.disconnectedBanner}>
            <Ionicons name="wifi-outline" size={16} color="#fff" />
            <Text style={styles.disconnectedText}>
              {status === 'connecting' ? 'Conectando…' : 'Sin conexión — reconectando…'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AuctionRoomScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.textSecondary, marginTop: spacing.sm },
  errorText: { color: colors.textSecondary, textAlign: 'center', marginHorizontal: spacing.xl },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  retryText: { color: '#fff', fontWeight: '600' },

  // Header
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerCenter: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerTimer: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dotGreen: { backgroundColor: '#27AE60' },
  dotYellow: { backgroundColor: '#F5A623' },
  dotRed: { backgroundColor: '#E74C3C' },

  // Price section
  priceSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  ofertaLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  ofertaPrice: { color: colors.accent, fontSize: 42, fontWeight: '700', marginTop: 2 },
  postorLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: spacing.xs },

  // Range pill (corrección 1.2)
  rangePill: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
  },
  rangeText: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  rangeValue: { color: '#fff', fontWeight: '600' },

  // History
  historySection: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  bidList: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  bidRowMine: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  bidPostorBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 48,
    alignItems: 'center',
  },
  bidPostorBadgeMine: { backgroundColor: colors.accent },
  bidPostorText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bidInfo: { flex: 1 },
  bidAmount: { fontSize: 16, fontWeight: '700', color: colors.text },
  bidTime: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bidSeparator: { height: spacing.sm },
  emptyBids: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  emptyBidsText: { color: colors.textSecondary },

  // Input area (corrección 1.2 + 1.3)
  inputArea: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  bidInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bidInputDisabled: { opacity: 0.5 },
  pujarBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 90,
    alignItems: 'center',
  },
  pujarBtnAceptada: { backgroundColor: colors.success },
  pujarBtnDisabled: { opacity: 0.5 },
  pujarBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Status banner (corrección 1.3)
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  statusBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bannerClose: { padding: 2 },

  // Disconnected
  disconnectedBanner: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  disconnectedText: { color: '#fff', fontSize: 12, fontWeight: '500' },
});
