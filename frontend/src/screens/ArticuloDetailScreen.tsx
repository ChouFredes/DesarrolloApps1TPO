import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

// ponytail: paleta navy local (igual a la home) sobreescribe el theme cálido, sin tocar styles
const colors = {
  primary: '#00EADF', accent: '#00EADF', background: '#0F1F35', surface: '#0D1E33',
  text: '#E1E1E1', textSecondary: 'rgba(225,225,225,0.5)', border: 'rgba(0,234,223,0.2)',
  success: '#7ED957', error: '#FF6B6B',
};

type NavProp = StackNavigationProp<ProfileStackParamList, 'ArticuloDetalle'>;
type RouteProps = RouteProp<ProfileStackParamList, 'ArticuloDetalle'>;

const axiosInstance = axios;

type ArticuloEstado = string;

interface Articulo {
  id: number;
  nombre: string;
  descripcion: string;
  estado: ArticuloEstado;
  imagenUrl?: string;
  precioBasePropuesto?: number;
  comisionPropuesta?: number;
  categoria?: string;
  motivoRechazo?: string;
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

const CATEGORIES = [
  { label: 'Pokémon', value: 'pokemon' },
  { label: 'Máquinas Técnicas', value: 'maquinas_tecnicas' },
  { label: 'Pociones', value: 'pociones' },
  { label: 'Arte', value: 'arte' },
  { label: 'Electrónica', value: 'electronica' },
  { label: 'Inmuebles', value: 'inmuebles' },
  { label: 'Vehículos', value: 'vehiculos' },
  { label: 'Joyas', value: 'joyas' },
  { label: 'Antigüedades', value: 'antiguedades' },
  { label: 'Otros', value: 'otros' },
];

function StatusBadge({ estado }: { estado: ArticuloEstado }) {
  let bgColor = '#152C44';
  let textColor = colors.textSecondary;
  let label = estado;

  switch (estado) {
    case 'ACEPTADO':
    case 'aceptado_por_usuario':
      bgColor = '#152C44';
      textColor = colors.success;
      label = 'Propuesta Aceptada';
      break;
    case 'RECHAZADO':
    case 'rechazado':
      bgColor = '#152C44';
      textColor = colors.error;
      label = 'Rechazado Físicamente';
      break;
    case 'rechazado_por_usuario':
      bgColor = '#152C44';
      textColor = colors.error;
      label = 'Propuesta Rechazada';
      break;
    case 'PENDIENTE':
    case 'PENDIENTE_INSPECCION':
    case 'pendiente_inspeccion':
      bgColor = '#152C44';
      textColor = colors.textSecondary;
      label = 'Pendiente de Inspección';
      break;
    case 'inspeccion_aprobada':
      bgColor = '#152C44';
      textColor = '#F5C542';
      label = 'Inspección Aprobada';
      break;
    case 'propuesta_enviada':
      bgColor = '#152C44';
      textColor = '#B98CFF';
      label = 'Propuesta de Precio Recibida';
      break;
    case 'VENDIDO':
    case 'vendido':
      bgColor = '#152C44';
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

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editCategoria, setEditCategoria] = useState('');

  // Action loaders
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      setError(null);
      const [artRes, insRes, locRes] = await Promise.allSettled([
        axiosInstance.get<any>(`${API_BASE_URL}/articulos/${articuloId}`, { headers }),
        axiosInstance.get<any>(`${API_BASE_URL}/articulos/${articuloId}/poliza`, { headers }),
        axiosInstance.get<any>(`${API_BASE_URL}/articulos/${articuloId}/ubicacion`, { headers }),
      ]);

      if (artRes.status === 'fulfilled') {
        const data = artRes.value.data;
        const mappedArt: Articulo = {
          id: data.id,
          nombre: data.descripcion,
          descripcion: data.descripcionCompleta || data.descripcion,
          estado: data.estado,
          imagenUrl: data.imagenUrl ? (data.imagenUrl.startsWith('/') ? `${API_BASE_URL}${data.imagenUrl}` : data.imagenUrl) : undefined,
          precioBasePropuesto: data.precioBase,
          comisionPropuesta: data.comision,
          categoria: data.categoria,
          motivoRechazo: data.motivoRechazo,
        };
        setArticulo(mappedArt);
        
        // Pre-populate edit states
        setEditNombre(mappedArt.nombre || '');
        setEditDescripcion(mappedArt.descripcion || '');
        setEditCategoria(mappedArt.categoria || 'otros');
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
      } else {
        setInsurance(null);
      }

      if (locRes.status === 'fulfilled') {
        const data = locRes.value.data;
        setLocation({
          direccion: data.direccion,
          ciudad: data.deposito || 'Depósito',
        });
      } else {
        setLocation(null);
      }
    } catch {
      setError('No se pudo cargar el artículo.');
    } finally {
      setLoading(false);
    }
  }, [articuloId, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAceptarPropuesta = async () => {
    Alert.alert(
      'Confirmar Aceptación',
      '¿Estás de acuerdo con el precio base y comisión propuestos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Aceptar',
          onPress: async () => {
            setActionLoading(true);
            try {
              await axiosInstance.post(
                `${API_BASE_URL}/articulos/${articuloId}/aceptar-precio`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('✓ Propuesta Aceptada', 'El artículo ahora avanzará en el proceso de subasta.');
              loadData();
            } catch (err: any) {
              const msg = err?.response?.data?.mensaje || 'Error al aceptar la propuesta.';
              Alert.alert('Error', msg);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRechazarPropuesta = async () => {
    Alert.alert(
      'Confirmar Rechazo',
      '¿Deseas rechazar la propuesta? Si la rechazás, podés proponer cambios modificando los datos del artículo para su re-evaluación.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, Rechazar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await axiosInstance.post(
                `${API_BASE_URL}/articulos/${articuloId}/rechazar-precio`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Rechazada', 'Propuesta rechazada. El artículo se encuentra habilitado para edición.');
              loadData();
            } catch (err: any) {
              const msg = err?.response?.data?.mensaje || 'Error al rechazar la propuesta.';
              Alert.alert('Error', msg);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleGuardarCambios = async () => {
    if (!editNombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }
    setActionLoading(true);
    try {
      await axiosInstance.put(
        `${API_BASE_URL}/articulos/${articuloId}`,
        {
          descripcionCatalogo: editNombre.trim(),
          descripcionCompleta: editDescripcion.trim(),
          categoria: editCategoria,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        '✓ Cambios Guardados',
        'El artículo ha sido modificado y se envió nuevamente a revisión por el administrador.'
      );
      setIsEditing(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al actualizar el artículo.';
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

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

  if (isEditing) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.editContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setIsEditing(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Editar Artículo</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.editScrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.editForm}>
                <Text style={styles.editLabel}>Nombre / Descripción Corta</Text>
                <TextInput
                  style={styles.editInput}
                  value={editNombre}
                  onChangeText={setEditNombre}
                  placeholder="Ej: Anillo de oro"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Descripción Detallada</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={editDescripcion}
                  onChangeText={setEditDescripcion}
                  placeholder="Describa el artículo en detalle, su estado, procedencia..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={5}
                />

                <Text style={styles.editLabel}>Categoría</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoriesScroll}
                  contentContainerStyle={{ paddingRight: spacing.lg }}
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = editCategoria === cat.value;
                    return (
                      <TouchableOpacity
                        key={cat.value}
                        style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                        onPress={() => setEditCategoria(cat.value)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelEditBtn]}
                    onPress={() => setIsEditing(false)}
                    disabled={actionLoading}
                  >
                    <Text style={[styles.actionBtnText, styles.cancelEditBtnText]}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn]}
                    onPress={handleGuardarCambios}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={[styles.actionBtnText, styles.saveBtnText]}>Guardar y Enviar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
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

        {/* Tarjeta de propuesta de cotización (si corresponde) */}
        {articulo.estado === 'propuesta_enviada' && (
          <View style={styles.proposalCard}>
            <View style={styles.proposalHeader}>
              <Ionicons name="pricetag-outline" size={22} color="#673AB7" />
              <Text style={styles.proposalCardTitle}>Propuesta de Cotización</Text>
            </View>
            <Text style={styles.proposalCardSubtitle}>
              La empresa ha evaluado tu artículo y propone los siguientes valores para la subasta:
            </Text>
            
            <View style={styles.proposalDetails}>
              <View style={styles.proposalRow}>
                <Text style={styles.proposalLabel}>Precio Base</Text>
                <Text style={styles.proposalValue}>$ {articulo.precioBasePropuesto?.toLocaleString('es-AR')}</Text>
              </View>
              <View style={styles.proposalRow}>
                <Text style={styles.proposalLabel}>Comisión Cobrada</Text>
                <Text style={styles.proposalValue}>$ {articulo.comisionPropuesta?.toLocaleString('es-AR')}</Text>
              </View>
            </View>

            <View style={styles.proposalActions}>
              <TouchableOpacity
                style={[styles.proposalBtn, styles.acceptProposalBtn]}
                onPress={handleAceptarPropuesta}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.acceptProposalText}>Aceptar Propuesta</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.proposalBtn, styles.rejectProposalBtn]}
                onPress={handleRechazarPropuesta}
                disabled={actionLoading}
              >
                <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                <Text style={styles.rejectProposalText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tarjeta de artículo rechazado o propuesta rechazada */}
        {(articulo.estado === 'rechazado' || articulo.estado === 'rechazado_por_usuario') && (
          <View style={styles.rejectionCard}>
            <View style={styles.proposalHeader}>
              <Ionicons name="warning-outline" size={22} color={colors.error} />
              <Text style={[styles.proposalCardTitle, { color: colors.error }]}>
                {articulo.estado === 'rechazado' ? 'Artículo Rechazado Físicamente' : 'Propuesta Rechazada'}
              </Text>
            </View>
            
            {articulo.estado === 'rechazado' ? (
              <View style={styles.rejectionReasonContainer}>
                <Text style={styles.rejectionLabel}>Motivo especificado por el administrador:</Text>
                <Text style={styles.rejectionReasonText}>
                  {articulo.motivoRechazo || 'No se detalló un motivo.'}
                </Text>
              </View>
            ) : (
              <Text style={styles.rejectionExplanation}>
                Rechazaste la propuesta de cotización de la empresa. Podés sugerir cambios editando los detalles del artículo.
              </Text>
            )}

            <TouchableOpacity
              style={styles.modifyBtn}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color="#0A1626" />
              <Text style={styles.modifyBtnText}>Modificar Artículo / Pedir Cambios</Text>
            </TouchableOpacity>
          </View>
        )}

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
              <MaterialCommunityIcons name="file-document-outline" size={18} color="#0A1626" />
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
  retryText: { color: '#0A1626', fontWeight: '600' },
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
    paddingLeft: spacing.sm,
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
    color: '#0A1626',
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnTextSecondary: {
    color: colors.primary,
  },

  // Proposal card styles
  proposalCard: {
    backgroundColor: '#0D1E33',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#B98CFF',
    borderLeftWidth: 3,
    borderLeftColor: '#B98CFF',
    ...shadows.card,
    gap: spacing.sm,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  proposalCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B98CFF',
  },
  proposalCardSubtitle: {
    fontSize: 13,
    color: '#B98CFF',
    lineHeight: 18,
  },
  proposalDetails: {
    backgroundColor: '#0A1626',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.xs,
    gap: spacing.xs,
  },
  proposalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proposalLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  proposalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  proposalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  proposalBtn: {
    flex: 1,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  acceptProposalBtn: {
    backgroundColor: colors.success,
  },
  acceptProposalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  rejectProposalBtn: {
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: '#0D1E33',
  },
  rejectProposalText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },

  // Rejection styles
  rejectionCard: {
    backgroundColor: '#0D1E33',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
    ...shadows.card,
    gap: spacing.sm,
  },
  rejectionReasonContainer: {
    backgroundColor: '#0A1626',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 14,
    color: colors.error,
    lineHeight: 18,
    fontWeight: '500',
  },
  rejectionExplanation: {
    fontSize: 13,
    color: '#FF6B6B',
    lineHeight: 18,
  },
  modifyBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    ...shadows.card,
    marginTop: spacing.xs,
  },
  modifyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A1626',
  },

  // Edit form styles
  editContainer: {
    flex: 1,
  },
  editScrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  editForm: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    gap: spacing.md,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  editTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoriesScroll: {
    marginVertical: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  categoryPillSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryPillTextSelected: {
    color: '#0A1626',
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
  },
  saveBtn: {
    backgroundColor: colors.success,
  },
  saveBtnText: {
    color: '#fff',
  },
  cancelEditBtn: {
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    backgroundColor: 'transparent',
  },
  cancelEditBtnText: {
    color: colors.textSecondary,
  },
});
