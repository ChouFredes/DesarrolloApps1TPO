import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme';

// ── Types ──────────────────────────────────────────────────────────────────
export type WarningType =
  | 'sin_medio_pago'
  | 'categoria_insuficiente'
  | 'ya_conectado'
  | 'bloqueado_multa'
  | 'subasta_perdida'
  | 'puja_rechazada';

export interface WarningModalProps {
  visible: boolean;
  type: WarningType;
  onClose: () => void;
  onAction?: () => void;
  extraData?: {
    motivo?: string;
    ganadorNumero?: number;
    importeFinal?: number;
    multaImporte?: number;
  };
}

// ── Config per variant ─────────────────────────────────────────────────────
interface VariantConfig {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: (extra?: WarningModalProps['extraData']) => string;
  actionLabel?: string;
  closeLabel: string;
}

const VARIANT_CONFIG: Record<WarningType, VariantConfig> = {
  sin_medio_pago: {
    icon: 'card-outline',
    iconColor: colors.error,
    iconBg: '#FEE2E2',
    title: 'No podés pujar',
    description: () =>
      'No tenés un medio de pago verificado. Podés ver la subasta, pero el botón Pujar estará deshabilitado.',
    actionLabel: 'Ir a Medios de Pago',
    closeLabel: 'Cerrar',
  },
  categoria_insuficiente: {
    icon: 'lock-closed-outline',
    iconColor: colors.accent,
    iconBg: '#FFF3E0',
    title: 'Acceso restringido',
    description: () =>
      'Tu categoría de usuario no permite acceder a esta subasta. Mejorá tu categoría para participar.',
    closeLabel: 'Cerrar',
  },
  ya_conectado: {
    icon: 'swap-horizontal-outline',
    iconColor: colors.primary,
    iconBg: '#E3F2FD',
    title: 'Ya estás en una subasta',
    description: () =>
      'No podés conectarte a dos subastas simultáneamente. Salí de la subasta actual antes de unirte a otra.',
    closeLabel: 'Cerrar',
  },
  bloqueado_multa: {
    icon: 'warning-outline',
    iconColor: colors.error,
    iconBg: '#FEE2E2',
    title: 'Cuenta bloqueada',
    description: (extra) => {
      const importe = extra?.multaImporte
        ? `$ ${extra.multaImporte.toLocaleString('es-AR')}`
        : 'una multa';
      return `Tenés ${importe} pendiente. Tu cuenta estará restringida hasta que la abones.`;
    },
    actionLabel: 'Ver multas',
    closeLabel: 'Cerrar',
  },
  subasta_perdida: {
    icon: 'ribbon-outline',
    iconColor: colors.accent,
    iconBg: '#FFF8E7',
    title: 'Subasta finalizada',
    description: (extra) => {
      const postor = extra?.ganadorNumero != null ? `#${extra.ganadorNumero}` : 'otro postor';
      const importe = extra?.importeFinal
        ? `$ ${extra.importeFinal.toLocaleString('es-AR')}`
        : 'el precio final';
      return `El postor ${postor} ganó la subasta con ${importe}.`;
    },
    closeLabel: 'Cerrar',
  },
  puja_rechazada: {
    icon: 'close-circle-outline',
    iconColor: colors.error,
    iconBg: '#FEE2E2',
    title: 'Puja no aceptada',
    description: (extra) =>
      extra?.motivo ?? 'Tu puja no fue aceptada. Revisá el monto mínimo e intentá nuevamente.',
    actionLabel: 'Entendido',
    closeLabel: '',
  },
};

// ── Component ──────────────────────────────────────────────────────────────
export function WarningModal({
  visible,
  type,
  onClose,
  onAction,
  extraData,
}: WarningModalProps) {
  const cfg = VARIANT_CONFIG[type];

  // Entrance animation: scale 0.8 → 1 + fade in
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.8);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scale, opacity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.85, duration: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleAction = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.85, duration: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      onClose();
      onAction?.();
    });
  };

  // For 'puja_rechazada' the only button is 'Entendido' (acts as action/close)
  const hasSingleButton = type === 'puja_rechazada';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"   // we handle animation manually
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Overlay — tap outside to close */}
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[styles.card, { transform: [{ scale }], opacity }]}
          // Prevent taps inside the card from closing it
          onStartShouldSetResponder={() => true}
        >
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: cfg.iconBg }]}>
            <Ionicons name={cfg.icon as any} size={40} color={cfg.iconColor} />
          </View>

          {/* Text */}
          <Text style={styles.title}>{cfg.title}</Text>
          <Text style={styles.description}>{cfg.description(extraData)}</Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            {hasSingleButton ? (
              // Single "Entendido" button for puja_rechazada
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>{cfg.actionLabel}</Text>
              </TouchableOpacity>
            ) : (
              <>
                {cfg.actionLabel && onAction && (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={handleAction}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnPrimaryText}>{cfg.actionLabel}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnSecondaryText}>{cfg.closeLabel}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default WarningModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },

  // Icon circle
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  // Text
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Buttons
  buttons: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    paddingVertical: spacing.base,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
