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
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

type Nav = StackNavigationProp<ProfileStackParamList, 'MetodosDePago'>;

type MedioTipo = 'CUENTA_BANCARIA' | 'TARJETA_CREDITO' | 'CHEQUE_CERTIFICADO';

interface MedioDePago {
  id: number;
  tipo: MedioTipo;
  banco?: string;
  titular?: string;
  numeroCuenta?: string;
  numeroTarjeta?: string;
  cbu?: string;
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

  return (
    <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.85} style={styles.cardTouchable}>
      <View
        style={[
          styles.paymentCard,
          { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: cardColor },
        ]}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.cardBankName}>{medio.banco ?? label}</Text>
          <MaterialCommunityIcons name="credit-card-outline" size={18} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={styles.cardAccountNumber}>{accountDisplay}</Text>
        <Text style={styles.cardHolder} numberOfLines={1}>
          {medio.titular ?? '—'}
        </Text>
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
      const res = await fetch(`${API_BASE_URL}/usuarios/${user.id}/medios-de-pago`, {
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
              await fetch(`${API_BASE_URL}/usuarios/${user!.id}/medios-de-pago/${medio.id}`, {
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
