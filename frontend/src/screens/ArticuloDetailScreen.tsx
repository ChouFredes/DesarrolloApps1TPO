import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

type NavProp = StackNavigationProp<ProfileStackParamList, 'ArticuloDetalle'>;
type RouteProps = RouteProp<ProfileStackParamList, 'ArticuloDetalle'>;

type ArticuloEstado = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | string;

interface Articulo {
  id: number;
  nombre: string;
  descripcion: string;
  estado: ArticuloEstado;
  imagenUrl?: string;
}

interface InsuranceInfo {
  nroPoliza?: string;
  compania?: string;
  monto?: number;
  polizaUrl?: string;
}

interface LocationInfo {
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  latitud?: number;
  longitud?: number;
}

function StatusBadge({ estado }: { estado: ArticuloEstado }) {
  let bgColor = '#F5F5F5';
  let textColor = colors.textSecondary;
  let label = estado;

  switch (estado) {
    case 'ACEPTADO':
      bgColor = '#E8F5E9';
      textColor = colors.success;
      label = 'Aceptado';
      break;
    case 'RECHAZADO':
      bgColor = '#FFEBEE';
      textColor = colors.error;
      label = 'Rechazado';
      break;
    case 'PENDIENTE':
    case 'PENDIENTE_INSPECCION':
      bgColor = '#F5F5F5';
      textColor = colors.textSecondary;
      label = 'Pendiente';
      break;
    case 'VENDIDO':
      bgColor = '#E3F2FD';
      textColor = colors.primary;
      label = 'Vendido';
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function ArticuloDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { articuloId } = route.params;
  const { token } = useAuthStore();

  const [articulo, setArticulo] = useState<Articulo | null>(null);
  const [insurance, setInsurance] = useState<InsuranceInfo | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const load = async () => {
      try {
        setError(null);
        const [artRes, insRes, locRes] = await Promise.allSettled([
          axios.get<any>(`${API_BASE_URL}/articulos/${articuloId}`, { headers }),
          axios.get<any>(`${API_BASE_URL}/articulos/${articuloId}/poliza`, { headers }),
          axios.get<any>(`${API_BASE_URL}/articulos/${articuloId}/ubicacion`, { headers }),
        ]);

        if (artRes.status === 'fulfilled') {
          const data = artRes.value.data;
          setArticulo({
            id: data.id,
            nombre: data.descripcion,
            descripcion: data.descripcion,
            estado: data.estado,
            imagenUrl: data.imagenUrl ? (data.imagenUrl.startsWith('/') ? `${API_BASE_URL}${data.imagenUrl}` : data.imagenUrl) : undefined,
          });
        } else {
          setError('No se pudo cargar el artículo.');
        }

        if (insRes.status === 'fulfilled') {
          const data = insRes.value.data;
          setInsurance({
            nroPoliza: data.nroPoliza,
            compania: data.compania,
            monto: data.importe ? Number(data.importe) : undefined,
          });
        }

        if (locRes.status === 'fulfilled') {
          const data = locRes.value.data;
          setLocation({
            direccion: data.direccion,
            ciudad: data.deposito || 'Depósito',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [articuloId, token]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !articulo) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error ?? 'Artículo no encontrado.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{articulo.nombre}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status badge */}
        <View style={styles.statusRow}>
          <StatusBadge estado={articulo.estado} />
        </View>

        {/* Hero image */}
        <View style={styles.heroContainer}>
          {articulo.imagenUrl ? (
            <Image source={{ uri: articulo.imagenUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.heroPlaceholderText}>Sin imagen</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {articulo.descripcion ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>{articulo.descripcion}</Text>
          </View>
        ) : null}

        {/* Insurance info */}
        {insurance && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.accent} />
              <Text style={styles.sectionTitle}>Seguro</Text>
            </View>
            {insurance.nroPoliza && <InfoRow label="Número de póliza" value={insurance.nroPoliza} />}
            {insurance.compania && <InfoRow label="Compañía" value={insurance.compania} />}
            {insurance.monto != null && (
              <InfoRow label="Monto asegurado" value={`$ ${insurance.monto.toLocaleString('es-AR')}`} />
            )}
          </View>
        )}

        {/* Location info */}
        {location && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={colors.accent} />
              <Text style={styles.sectionTitle}>Ubicación</Text>
            </View>
            {location.direccion && <InfoRow label="Dirección" value={location.direccion} />}
            {location.ciudad && <InfoRow label="Ciudad" value={location.ciudad} />}
            {location.provincia && <InfoRow label="Provincia" value={location.provincia} />}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          {insurance && (
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Ver póliza</Text>
            </TouchableOpacity>
          )}
          {location && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} activeOpacity={0.8}>
              <Ionicons name="map-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>Ver ubicación</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ArticuloDetailScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
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
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  statusRow: {
    marginBottom: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.base,
    ...shadows.card,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroPlaceholderText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  actionBtnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnTextSecondary: {
    color: colors.primary,
  },
});
