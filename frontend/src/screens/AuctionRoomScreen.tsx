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
}

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
      setTimeLeft(`${String(h).padStart(2,'0')}H ${String(m).padStart(2,'0')}M ${String(s).padStart(2,'0')}S`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);
  return timeLeft;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

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
  const [submitting, setSubmitting] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

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

  // Step 1: REST connect + fetch subasta details
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
        axios.get<{ mayorOfertaActual?: number; precioBase: number; fechaFin: string }>(
          `${API_BASE_URL}/subastas/${subastaId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ]);

      const { mayorOfertaActual: initialPrice, numeroPostor: postor } = conectarRes.data;
      setCurrentPrice(initialPrice ?? subastaRes.data.mayorOfertaActual ?? subastaRes.data.precioBase);
      setNumeroPostor(postor);
      setFechaFin(subastaRes.data.fechaFin);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'No se pudo conectar a la subasta.';
      setInitError(msg);
    } finally {
      setInitLoading(false);
    }
  }, [subastaId, token]);

  // Step 2: WebSocket STOMP
  const connectWs = useCallback(() => {
    setStatus('connecting');

    const client = new Client({
      brokerURL: 'ws://10.0.2.2:8080/ws',
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
  }, [subastaId, token]);

  useEffect(() => {
    initialize();
    connectWs();

    return () => {
      // Disconnect REST
      axios
        .post(
          `${API_BASE_URL}/subastas/${subastaId}/desconectar`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .catch(() => {});

      // Deactivate WebSocket
      stompClient.current?.deactivate();
    };
  }, [initialize, connectWs, subastaId, token]);

  const handleBid = () => {
    const amount = parseFloat(bidAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Importe inválido', 'Ingresá un monto mayor a 0.');
      return;
    }
    if (amount <= currentPrice) {
      Alert.alert('Oferta insuficiente', `La oferta debe superar la actual: $ ${currentPrice.toLocaleString()}`);
      return;
    }
    if (!stompClient.current?.connected) {
      Alert.alert('Sin conexión', 'No estás conectado al servidor de subastas.');
      return;
    }

    setSubmitting(true);
    try {
      stompClient.current.publish({
        destination: `/app/auctions/${subastaId}/bid`,
        body: JSON.stringify({ itemId, importe: amount }),
      });
      setBidAmount('');
    } catch {
      Alert.alert('Error', 'No se pudo enviar la oferta.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    } catch {
      return iso;
    }
  };

  const renderBid = ({ item }: { item: Bid }) => (
    <View style={styles.bidRow}>
      <View style={styles.bidPostorBadge}>
        <Text style={styles.bidPostorText}>#{item.numeroPostor}</Text>
      </View>
      <View style={styles.bidInfo}>
        <Text style={styles.bidAmount}>$ {item.importe.toLocaleString()}</Text>
        <Text style={styles.bidTime}>{formatTime(item.timestamp)}</Text>
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{itemName}</Text>
            <Text style={styles.headerTimer}>{timeLeft || '—'}</Text>
          </View>
          {/* Connection status indicator */}
          <View style={[styles.statusDot, status === 'connected' ? styles.dotGreen : status === 'connecting' ? styles.dotYellow : styles.dotRed]} />
        </View>

        {/* Current price */}
        <View style={styles.priceSection}>
          <Text style={styles.ofertaLabel}>Oferta actual</Text>
          <Animated.View style={{ transform: [{ scale: priceScale }] }}>
            <Text style={styles.ofertaPrice}>$ {currentPrice.toLocaleString()}</Text>
          </Animated.View>
          {numeroPostor !== null && (
            <Text style={styles.postorLabel}>Tu número de postor: #{numeroPostor}</Text>
          )}
        </View>

        {/* Bid history */}
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

        {/* Bid input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.bidInput}
            value={bidAmount}
            onChangeText={setBidAmount}
            placeholder={`Mínimo $ ${(currentPrice + 1).toLocaleString()}`}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            returnKeyType="done"
            editable={status === 'connected'}
          />
          <TouchableOpacity
            style={[
              styles.pujarBtn,
              (submitting || status !== 'connected') && styles.pujarBtnDisabled,
            ]}
            onPress={handleBid}
            disabled={submitting || status !== 'connected'}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.pujarBtnText}>Pujar</Text>
            )}
          </TouchableOpacity>
        </View>

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
  priceSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  ofertaLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  ofertaPrice: { color: colors.accent, fontSize: 42, fontWeight: '700', marginTop: 2 },
  postorLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: spacing.xs },
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
  bidPostorBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 48,
    alignItems: 'center',
  },
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
  inputBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  pujarBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 80,
    alignItems: 'center',
  },
  pujarBtnDisabled: { opacity: 0.5 },
  pujarBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
