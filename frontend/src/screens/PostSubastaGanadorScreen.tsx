import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';

type RouteType = RouteProp<HomeStackParamList, 'PostSubastaGanador'>;

interface CompraDetalle {
  id: number;
  descripcionProducto: string;
  importe: number;
  comision: number;
  costoEnvio: number;
  totalAPagar: number;
  retiroPersonal: boolean;
}

interface MedioPago {
  id: number;
  tipo: string;
  moneda: string;
  estado: string;
}

export function PostSubastaGanadorScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { compraId } = route.params;
  const { token } = useAuthStore();

  const [compra, setCompra] = useState<CompraDetalle | null>(null);
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [medioPagoId, setMedioPagoId] = useState<number | null>(null);
  const [modalidadEntrega, setModalidadEntrega] = useState<'envio' | 'retiroPersonal'>('envio');
  const [loading, setLoading] = useState(true);
  const [pagando, setPagando] = useState(false);

  // Animations
  const bannerScale = useRef(new Animated.Value(0.8)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const trophyPulse = useRef(new Animated.Value(1)).current;

  // Animated borders for delivery options
  const envioAnim = useRef(new Animated.Value(0)).current;
  const retiroAnim = useRef(new Animated.Value(0)).current;

  // Run banner entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(bannerScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bannerOpacity, bannerScale]);

  // Trophy continuous pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(trophyPulse, { toValue: 1.05, duration: 700, useNativeDriver: true }),
        Animated.timing(trophyPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [trophyPulse]);

  // Animate delivery option selection
  useEffect(() => {
    Animated.timing(envioAnim, {
      toValue: modalidadEntrega === 'envio' ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    Animated.timing(retiroAnim, {
      toValue: modalidadEntrega === 'retiroPersonal' ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [modalidadEntrega, envioAnim, retiroAnim]);

  const fetchData = useCallback(async () => {
    try {
      const [compraRes, mediosRes] = await Promise.all([
        axios.get<CompraDetalle>(`${API_BASE_URL}/compras/${compraId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<MedioPago[]>(`${API_BASE_URL}/usuarios/me/medios-de-pago`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setCompra(compraRes.data);
      const verificados = mediosRes.data.filter(m => m.estado === 'VERIFICADO');
      setMedios(verificados);
      if (verificados.length > 0) setMedioPagoId(verificados[0].id);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el detalle de la compra.');
    } finally {
      setLoading(false);
    }
  }, [compraId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePagar = async () => {
    if (!medioPagoId) { Alert.alert('Error', 'Seleccioná un medio de pago'); return; }
    if (modalidadEntrega === 'retiroPersonal') {
      Alert.alert(
        'Aviso de seguro',
        'Al elegir retiro personal perdés la cobertura del seguro del artículo. ¿Confirmar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => ejecutarPago(true) },
        ]
      );
    } else {
      ejecutarPago(false);
    }
  };

  const ejecutarPago = async (confirmaLoss: boolean) => {
    setPagando(true);
    try {
      await axios.post(`${API_BASE_URL}/compras/${compraId}/pagar`, {
        medioPagoId,
        modalidadEntrega,
        confirmaLossDeSeguros: confirmaLoss,
      }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('¡Pago exitoso!', 'Tu compra fue registrada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo procesar el pago.');
    } finally {
      setPagando(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!compra) return null;

  const envioBorderColor = envioAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accent],
  });
  const retiroBorderColor = retiroAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accent],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ganaste la subasta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Winner banner — animated entrance */}
        <Animated.View
          style={[
            styles.winnerBanner,
            { transform: [{ scale: bannerScale }], opacity: bannerOpacity },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: trophyPulse }] }}>
            <Ionicons name="trophy" size={44} color={colors.accent} />
          </Animated.View>
          <Text style={styles.winnerTitle}>¡Felicitaciones!</Text>
          <Text style={styles.winnerSub}>{compra.descripcionProducto}</Text>
        </Animated.View>

        {/* Desglose */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle del pago</Text>
          <DesgloseLine label="Importe pujado" value={compra.importe} />
          <DesgloseLine label="Comisión" value={compra.comision} />
          <DesgloseLine label="Costo de envío" value={compra.costoEnvio} />
          <View style={styles.divider} />
          <DesgloseLine label="Total a pagar" value={compra.totalAPagar} highlight />
        </View>

        {/* Entrega — animated borders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modalidad de entrega</Text>
          <Animated.View style={[styles.opcionEntregaBase, { borderColor: envioBorderColor }]}>
            <TouchableOpacity
              style={styles.opcionInner}
              onPress={() => setModalidadEntrega('envio')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="home"
                size={20}
                color={modalidadEntrega === 'envio' ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.opcionText, modalidadEntrega === 'envio' && styles.opcionTextActive]}>
                Envío a domicilio
              </Text>
              {modalidadEntrega === 'envio' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.opcionEntregaBase, { borderColor: retiroBorderColor }]}>
            <TouchableOpacity
              style={styles.opcionInner}
              onPress={() => setModalidadEntrega('retiroPersonal')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="walk"
                size={20}
                color={modalidadEntrega === 'retiroPersonal' ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.opcionText, modalidadEntrega === 'retiroPersonal' && styles.opcionTextActive]}>
                Retiro personal
              </Text>
              {modalidadEntrega === 'retiroPersonal' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {modalidadEntrega === 'retiroPersonal' && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={colors.error} />
              <Text style={styles.warningText}>
                El retiro personal implica la pérdida de cobertura del seguro.
              </Text>
            </View>
          )}
        </View>

        {/* Medio de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medio de pago</Text>
          {medios.length === 0
            ? <Text style={styles.noMedios}>No tenés medios de pago verificados.</Text>
            : medios.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.medioItem, medioPagoId === m.id && styles.medioSelected]}
                onPress={() => setMedioPagoId(m.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="card"
                  size={18}
                  color={medioPagoId === m.id ? colors.accent : colors.textSecondary}
                />
                <Text style={styles.medioText}>{m.tipo} — {m.moneda}</Text>
                {medioPagoId === m.id && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                )}
              </TouchableOpacity>
            ))
          }
        </View>

        <TouchableOpacity
          style={[styles.pagarBtn, pagando && styles.pagarBtnDisabled]}
          onPress={handlePagar}
          disabled={pagando}
          activeOpacity={0.85}
        >
          {pagando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.pagarText}>Confirmar pago</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DesgloseLine({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  if (highlight) {
    return (
      <View style={styles.highlightRow}>
        <Text style={styles.desgloseHighLabel}>{label}</Text>
        <Text style={styles.desgloseHighValue}>
          $ {value?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.desgloseLine}>
      <Text style={styles.desgloseLabel}>{label}</Text>
      <Text style={styles.desgloseValue}>
        $ {value?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

export default PostSubastaGanadorScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl, gap: spacing.lg },

  // Winner banner
  winnerBanner: {
    alignItems: 'center',
    backgroundColor: '#1A2E4A',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  winnerTitle: { fontSize: 26, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 },
  winnerSub: { fontSize: 14, color: '#C8D6E5', textAlign: 'center', marginTop: spacing.xs },

  // Sections
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    gap: spacing.sm,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },

  // Desglose lines
  desgloseLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  desgloseLabel: { fontSize: 14, color: colors.textSecondary },
  desgloseValue: { fontSize: 14, fontWeight: '600', color: colors.text },

  // Highlight row for "Total a pagar"
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.4)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  desgloseHighLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  desgloseHighValue: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },

  // Delivery options — Animated.View wrapper
  opcionEntregaBase: {
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  opcionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  opcionText: { flex: 1, fontSize: 14, color: colors.text },
  opcionTextActive: { fontWeight: '600', color: colors.text },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  warningText: { flex: 1, fontSize: 12, color: colors.error },

  // Medios de pago
  medioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medioSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(245,166,35,0.06)',
  },
  medioText: { flex: 1, fontSize: 14, color: colors.text },
  noMedios: { fontSize: 13, color: colors.textSecondary },

  // Pay button
  pagarBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  pagarBtnDisabled: { opacity: 0.7 },
  pagarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
