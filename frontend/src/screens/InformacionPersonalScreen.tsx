import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, borderRadius } from '../theme';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

type Nav = StackNavigationProp<ProfileStackParamList, 'InformacionPersonal'>;

interface FormData {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

function Avatar({ nombre, apellido, size = 90 }: { nombre: string; apellido: string; size?: number }) {
  const initials = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  return (
    <View style={styles.avatarWrapper}>
      <View
        style={[
          styles.avatarCircle,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.avatarInitials, { fontSize: size * 0.35 }]}>{initials}</Text>
      </View>
      <View style={styles.cameraBadge}>
        <Ionicons name="camera" size={14} color={colors.surface} />
      </View>
    </View>
  );
}

export function InformacionPersonalScreen() {
  const navigation = useNavigation<Nav>();
  const { token, user, setUser } = useAuthStore();
  const [form, setForm] = useState<FormData>({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/usuarios/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setForm({
          nombre: data.nombre ?? user.nombre ?? '',
          apellido: data.apellido ?? user.apellido ?? '',
          telefono: data.telefono ?? '',
          email: data.email ?? '',
        });
      })
      .catch(() => {
        setForm({
          nombre: user.nombre ?? '',
          apellido: user.apellido ?? '',
          telefono: '',
          email: '',
        });
      })
      .finally(() => setLoading(false));
  }, [user?.id, token]);

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido';
    if (!form.apellido.trim()) errs.apellido = 'El apellido es requerido';
    if (!form.email.trim()) errs.email = 'El email es requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al guardar');
      const updated = await res.json();
      setUser({ id: updated.id, nombre: updated.nombre, apellido: updated.apellido, categoria: user?.categoria ?? '' });
      Alert.alert('Éxito', 'Datos actualizados correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los cambios. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Información Personal</Text>
        <View style={styles.headerSide} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Avatar nombre={form.nombre || 'U'} apellido={form.apellido || '?'} size={90} />
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <InputField
                label="Nombre"
                value={form.nombre}
                onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                error={errors.nombre}
                autoCapitalize="words"
              />
              <InputField
                label="Apellido"
                value={form.apellido}
                onChangeText={(v) => setForm((f) => ({ ...f, apellido: v }))}
                error={errors.apellido}
                autoCapitalize="words"
              />
              <InputField
                label="Teléfono"
                value={form.telefono}
                onChangeText={(v) => setForm((f) => ({ ...f, telefono: v }))}
                error={errors.telefono}
                keyboardType="phone-pad"
              />
              <InputField
                label="Email"
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Save button */}
            <View style={styles.buttonContainer}>
              <PrimaryButton
                title="Guardar Cambios"
                onPress={handleSave}
                loading={saving}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

export default InformacionPersonalScreen;

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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.base,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.surface,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
