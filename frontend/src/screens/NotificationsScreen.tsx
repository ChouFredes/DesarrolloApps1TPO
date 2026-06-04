import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { MOCK_NOTIFICACIONES } from '../mocks/data';

const DEV_MODE = true;

type NotificationType =
  | 'RESULTADO_COMPRA'
  | 'MULTA_PENDIENTE'
  | 'ARTICULO_ACEPTADO'
  | 'ARTICULO_RECHAZADO'
  | 'CUENTA_ACTIVADA'
  | 'PAGO_REQUERIDO'
  | 'BIEN_DEVUELTO';

interface Notificacion {
  id: number;
  tipo: NotificationType;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  fechaCreacion: string;
}

type Filter = 'todas' | 'no_leidas';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `hace ${diffD} d`;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

interface IconConfig {
  library: 'Ionicons' | 'MaterialCommunityIcons';
  name: string;
  bgColor: string;
  iconColor: string;
}

function getIconConfig(tipo: NotificationType): IconConfig {
  switch (tipo) {
    case 'RESULTADO_COMPRA':
      // Trofeo dorado — el usuario ganó
      return { library: 'Ionicons', name: 'trophy', bgColor: '#FFF8E7', iconColor: colors.accent };
    case 'MULTA_PENDIENTE':
      // Warning rojo
      return { library: 'Ionicons', name: 'warning', bgColor: '#FFEBEE', iconColor: colors.error };
    case 'ARTICULO_ACEPTADO':
      // Checkmark verde
      return { library: 'Ionicons', name: 'checkmark-circle', bgColor: '#E8F5E9', iconColor: colors.success };
    case 'ARTICULO_RECHAZADO':
      return { library: 'Ionicons', name: 'close-circle', bgColor: '#FFEBEE', iconColor: colors.error };
    case 'CUENTA_ACTIVADA':
      // Person-check azul/primario
      return { library: 'MaterialCommunityIcons', name: 'account-check', bgColor: '#E3F2FD', iconColor: colors.primary };
    case 'PAGO_REQUERIDO':
      return { library: 'MaterialCommunityIcons', name: 'cash', bgColor: '#FFF3E0', iconColor: colors.accent };
    case 'BIEN_DEVUELTO':
      return { library: 'MaterialCommunityIcons', name: 'package-variant', bgColor: '#F5F5F5', iconColor: colors.textSecondary };
    default:
      return { library: 'Ionicons', name: 'notifications', bgColor: '#F5F5F5', iconColor: colors.textSecondary };
  }
}

function NotifIcon({ tipo }: { tipo: NotificationType }) {
  const cfg = getIconConfig(tipo);
  return (
    <View style={[styles.iconCircle, { backgroundColor: cfg.bgColor }]}>
      {cfg.library === 'Ionicons' ? (
        <Ionicons name={cfg.name as any} size={22} color={cfg.iconColor} />
      ) : (
        <MaterialCommunityIcons name={cfg.name as any} size={22} color={cfg.iconColor} />
      )}
    </View>
  );
}

export function NotificationsScreen() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('todas');
  const [error, setError] = useState<string | null>(null);

  const cargarNotificaciones = useCallback((currentFilter: Filter) => {
    if (DEV_MODE) {
      const data = MOCK_NOTIFICACIONES as Notificacion[];
      const filtered = currentFilter === 'no_leidas' ? data.filter(n => !n.leida) : data;
      setNotificaciones(filtered);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    // Real fetch placeholder — reemplazar cuando el backend esté activo
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    cargarNotificaciones(filter);
  }, [filter, cargarNotificaciones]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarNotificaciones(filter);
  };

  const markAsRead = (notifId: number) => {
    // En DEV_MODE: sólo cambia estado local
    setNotificaciones(prev =>
      prev.map(n => n.id === notifId ? { ...n, leida: true } : n)
    );
  };

  const renderItem = ({ item }: { item: Notificacion }) => (
    <TouchableOpacity
      style={[styles.card, !item.leida && styles.cardUnread]}
      activeOpacity={0.7}
      onPress={() => markAsRead(item.id)}
    >
      <NotifIcon tipo={item.tipo} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.titulo}
        </Text>
        <Text style={styles.cardBody} numberOfLines={2}>
          {item.cuerpo}
        </Text>
      </View>
      <View style={styles.cardRight}>
        {!item.leida && <View style={styles.unreadDot} />}
        <Text style={styles.timestamp}>{formatDate(item.fechaCreacion)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {(['todas', 'no_leidas'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, filter === f && styles.pillActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
              {f === 'todas' ? 'Todas' : 'No leídas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => cargarNotificaciones(filter)}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={56} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No tenés notificaciones</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'no_leidas'
                  ? 'Todas tus notificaciones están leídas.'
                  : 'Cuando tengas novedades, aparecerán aquí.'}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      )}
    </SafeAreaView>
  );
}

export default NotificationsScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    ...shadows.card,
  },
  cardUnread: {
    backgroundColor: '#FFFBF5',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    flexShrink: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
