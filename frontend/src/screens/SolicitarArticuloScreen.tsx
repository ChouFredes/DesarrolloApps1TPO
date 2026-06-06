import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

interface MedioPago {
  id: number;
  tipo: string;
  alias?: string;
  numero?: string;
}

const MIN_PHOTOS = 6;

export function SolicitarArticuloScreen() {
  const navigation = useNavigation();
  const { token, user } = useAuthStore();

  const [descripcion, setDescripcion] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  const [cuentaDestinoId, setCuentaDestinoId] = useState<number | null>(null);
  const [mediosDePago, setMediosDePago] = useState<MedioPago[]>([]);
  const [loadingMedios, setLoadingMedios] = useState(true);
  const [fotos, setFotos] = useState<string[]>([]);
  const [declaracion, setDeclaracion] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchMedios = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get<MedioPago[]>(
          `${API_BASE_URL}/usuarios/me/medios-de-pago`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMediosDePago(res.data);
        if (res.data.length > 0) setCuentaDestinoId(res.data[0].id);
      } catch {
        // silently fail, user can still submit if they pick nothing
      } finally {
        setLoadingMedios(false);
      }
    };
    fetchMedios();
  }, [token, user]);

  const pickPhoto = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para adjuntar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setFotos((prev) => {
        const next = [...prev];
        if (index < next.length) {
          next[index] = uri;
        } else {
          next.push(uri);
        }
        return next;
      });
    }
  };

  const removePhoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!descripcion.trim()) newErrors.descripcion = 'La descripción es requerida.';
    if (!valorEstimado.trim() || isNaN(Number(valorEstimado)) || Number(valorEstimado) <= 0) {
      newErrors.valorEstimado = 'Ingresá un valor estimado válido.';
    }
    if (!cuentaDestinoId) newErrors.cuenta = 'Seleccioná una cuenta destino.';
    if (fotos.length < MIN_PHOTOS) {
      newErrors.fotos = `Debés adjuntar al menos ${MIN_PHOTOS} fotos.`;
    }
    if (!declaracion) newErrors.declaracion = 'Debés aceptar la declaración de propiedad.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/articulos/solicitar`,
        {
          descripcion: descripcion.trim(),
          valorEstimado: Number(valorEstimado),
          cuentaDestinoId,
          declaracionPropiedad: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        'Solicitud enviada',
        'Tu artículo fue enviado para revisión. Te notificaremos cuando sea procesado.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.detalle ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        'Ocurrió un error al enviar la solicitud. Intente nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const slots = Array.from({ length: Math.max(MIN_PHOTOS, fotos.length + 1) });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar Artículo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Descripción */}
        <Text style={styles.label}>Descripción</Text>
        <InputField
          label="Describí tu artículo..."
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={4}
          containerStyle={styles.textAreaContainer}
          error={errors.descripcion}
        />

        {/* Valor estimado */}
        <Text style={styles.label}>Valor estimado ($)</Text>
        <InputField
          label="Ej: 50000"
          value={valorEstimado}
          onChangeText={setValorEstimado}
          keyboardType="numeric"
          error={errors.valorEstimado}
        />

        {/* Cuenta destino */}
        <Text style={styles.label}>Cuenta destino</Text>
        {loadingMedios ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginBottom: spacing.base }} />
        ) : mediosDePago.length === 0 ? (
          <View style={styles.noMediosCard}>
            <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.noMediosText}>No tenés medios de pago registrados.</Text>
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            {mediosDePago.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.pickerOption, cuentaDestinoId === m.id && styles.pickerOptionActive]}
                onPress={() => setCuentaDestinoId(m.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={cuentaDestinoId === m.id ? colors.accent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.pickerOptionText,
                    cuentaDestinoId === m.id && styles.pickerOptionTextActive,
                  ]}
                >
                  {m.alias ?? m.tipo} {m.numero ? `••${m.numero.slice(-4)}` : ''}
                </Text>
                {cuentaDestinoId === m.id && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.cuenta ? <Text style={styles.errorMsg}>{errors.cuenta}</Text> : null}

        {/* Fotos */}
        <View style={styles.fotosHeader}>
          <Text style={styles.label}>Fotos del artículo</Text>
          <Text style={styles.fotosCount}>
            {fotos.length}/{MIN_PHOTOS} mínimo
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fotosRow}
        >
          {slots.map((_, index) => {
            const uri = fotos[index];
            const isAdd = !uri;
            return (
              <View key={index} style={styles.fotoSlot}>
                {isAdd ? (
                  <TouchableOpacity style={styles.fotoPlaceholder} onPress={() => pickPhoto(index)} activeOpacity={0.7}>
                    <Ionicons name="add" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.fotoPreviewContainer}>
                    <Image source={{ uri }} style={styles.fotoPreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(index)} activeOpacity={0.7}>
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
        {errors.fotos ? <Text style={styles.errorMsg}>{errors.fotos}</Text> : null}

        {/* Declaración */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setDeclaracion(!declaracion)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, declaracion && styles.checkboxChecked]}>
            {declaracion && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkLabel}>
            Declaro ser el propietario del artículo y acepto los{' '}
            <Text style={styles.checkLabelLink}>términos y condiciones</Text>
          </Text>
        </TouchableOpacity>
        {errors.declaracion ? <Text style={styles.errorMsg}>{errors.declaracion}</Text> : null}

        {/* Submit */}
        <PrimaryButton
          title="Enviar solicitud"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default SolicitarArticuloScreen;

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
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  textAreaContainer: {
    marginBottom: spacing.md,
  },
  noMediosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.card,
  },
  noMediosText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.base,
    overflow: 'hidden',
    ...shadows.card,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOptionActive: {
    backgroundColor: '#FFF8EE',
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pickerOptionTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  errorMsg: {
    fontSize: 12,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  fotosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fotosCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  fotosRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    paddingRight: spacing.base,
  },
  fotoSlot: {
    width: 90,
    height: 90,
  },
  fotoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  fotoPreviewContainer: {
    width: 90,
    height: 90,
    position: 'relative',
  },
  fotoPreview: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checkLabelLink: {
    color: colors.accent,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: spacing.lg,
  },
});
