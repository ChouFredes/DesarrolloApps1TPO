import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

// ponytail: paleta navy local (igual a la home) sobreescribe el theme cálido, sin tocar styles
const colors = {
  primary: '#00EADF', accent: '#00EADF', background: '#0F1F35', surface: '#0D1E33',
  text: '#E1E1E1', textSecondary: 'rgba(225,225,225,0.5)', border: 'rgba(0,234,223,0.2)',
  success: '#7ED957', error: '#FF6B6B',
};

type Nav = StackNavigationProp<any, any>;

type MedioTipo = 'CUENTA_BANCARIA' | 'TARJETA_CREDITO' | 'CHEQUE_CERTIFICADO';

interface MedioDePago {
  id: number;
  tipo: MedioTipo;
  banco?: string;
  titular?: string;
  numeroCuenta?: string;
  numeroTarjeta?: string;
  cbu?: string;
  estado?: string; // 'VERIFICADO' | 'PENDIENTE_VERIFICACION' | 'RECHAZADO'
  descripcion?: string;
}

// Solid base colors (midpoint of the intended gradients)
const CARD_COLORS: Record<MedioTipo, string> = {
  CUENTA_BANCARIA: '#245482',
  TARJETA_CREDITO: '#12a0a0',
  CHEQUE_CERTIFICADO: '#3b3b74',
};

const CARD_LABELS: Record<MedioTipo, string> = {
  CUENTA_BANCARIA: 'Cuenta Bancaria',
  TARJETA_CREDITO: 'Tarjeta de Crédito',
  CHEQUE_CERTIFICADO: 'Cheque Certificado',
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

function maskNumber(num?: string): string {
  if (!num) return '****';
  const clean = num.replace(/\s/g, '');
  if (clean.length <= 6) return clean;
  return `${clean.slice(0, 4)}*****${clean.slice(-2)}`;
}

interface PaymentCardProps {
  medio: MedioDePago;
  onLongPress: () => void;
}

function PaymentCard({ medio, onLongPress }: PaymentCardProps) {
  const cardColor = CARD_COLORS[medio.tipo] ?? '#333';
  const label = CARD_LABELS[medio.tipo] ?? medio.tipo;
  const accountDisplay = maskNumber(medio.numeroCuenta ?? medio.numeroTarjeta ?? medio.cbu);
  const isPendiente = medio.estado === 'PENDIENTE_VERIFICACION';

  return (
    <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.85} style={styles.cardTouchable}>
      <View
        style={[
          styles.paymentCard,
          { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: isPendiente ? '#555' : cardColor },
        ]}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.cardBankName}>{medio.banco ?? label}</Text>
          <MaterialCommunityIcons name="credit-card-outline" size={18} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={styles.cardAccountNumber}>{accountDisplay}</Text>
        <View style={styles.cardBottomRow}>
          <Text style={styles.cardHolder} numberOfLines={1}>
            {medio.titular ?? (medio.descripcion ?? '—')}
          </Text>
          {isPendiente && (
            <View style={styles.pendienteBadge}>
              <Text style={styles.pendienteBadgeText}>Pendiente</Text>
            </View>
          )}
          {!isPendiente && medio.estado === 'VERIFICADO' && (
            <View style={styles.verificadoBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface EmptySlotProps {
  onPress: () => void;
}

function EmptySlot({ onPress }: EmptySlotProps) {
  return (
    <TouchableOpacity
      style={[styles.emptySlot, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="add" size={32} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const MAX_SLOTS = 4;

export function MetodosDePagoScreen() {
  const navigation = useNavigation<Nav>();
  const { token, user } = useAuthStore();
  const [medios, setMedios] = useState<MedioDePago[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedios = useCallback(async () => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/me/medios-de-pago`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setMedios(Array.isArray(data) ? data : []);
    } catch {
      setMedios([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMedios();
    }, [fetchMedios])
  );

  const handleDelete = (medio: MedioDePago) => {
    Alert.alert(
      'Eliminar método de pago',
      '¿Estás seguro que querés eliminar este método de pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_BASE_URL}/usuarios/me/medios-de-pago/${medio.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              setMedios((prev) => prev.filter((m) => m.id !== medio.id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el método de pago.');
            }
          },
        },
      ]
    );
  };

  // Build grid slots: fill with existing medios then add empty slots up to MAX_SLOTS
  const slots: Array<MedioDePago | null> = [
    ...medios.slice(0, MAX_SLOTS),
    ...Array(Math.max(0, MAX_SLOTS - medios.length)).fill(null),
  ];

  const rows: Array<Array<MedioDePago | null>> = [];
  for (let i = 0; i < slots.length; i += 2) {
    rows.push([slots[i], slots[i + 1] ?? null]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métodos de pago</Text>
        <View style={styles.headerSide} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Aviso si hay medios pendientes */}
          {medios.some((m) => m.estado === 'PENDIENTE_VERIFICACION') && (
            <View style={styles.pendienteInfo}>
              <Ionicons name="information-circle-outline" size={18} color="#F5C542" />
              <Text style={styles.pendienteInfoText}>
                Uno o más métodos de pago están pendientes de verificación por el administrador. Mientras no estén aprobados, no podrás pujar en subastas.
              </Text>
            </View>
          )}
          <Text style={styles.hint}>Mantené presionada una tarjeta para eliminarla</Text>
          <FlatList
            data={rows}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            renderItem={({ item: row }) => (
              <View style={styles.gridRow}>
                {row.map((slot, idx) =>
                  slot ? (
                    <PaymentCard
                      key={slot.id}
                      medio={slot}
                      onLongPress={() => handleDelete(slot)}
                    />
                  ) : (
                    <EmptySlot
                      key={`empty-${idx}`}
                      onPress={() => navigation.navigate('AgregarMedioPago')}
                    />
                  )
                )}
              </View>
            )}
            contentContainerStyle={styles.gridContent}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

export default MetodosDePagoScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSide: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardTouchable: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  paymentCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBankName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  cardAccountNumber: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
  },
  cardHolder: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    flex: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendienteBadge: {
    backgroundColor: '#D97706',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  pendienteBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  verificadoBadge: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendienteInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#0D1E33',
    borderLeftWidth: 3,
    borderLeftColor: '#F5C542',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  pendienteInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#F5C542',
    lineHeight: 18,
  },
  emptySlot: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    borderStyle: 'dashed',
  },
});
