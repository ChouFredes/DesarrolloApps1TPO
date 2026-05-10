import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
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

type Nav = StackNavigationProp<ProfileStackParamList, 'AgregarMedioPago'>;

type TipoMedio = 'CUENTA_BANCARIA' | 'TARJETA_CREDITO' | 'CHEQUE_CERTIFICADO';

interface SegmentTab {
  key: TipoMedio;
  label: string;
}

const TABS: SegmentTab[] = [
  { key: 'CUENTA_BANCARIA', label: 'Cuenta Bancaria' },
  { key: 'TARJETA_CREDITO', label: 'Tarjeta' },
  { key: 'CHEQUE_CERTIFICADO', label: 'Cheque' },
];

interface CuentaBancariaForm {
  cbu: string;
  banco: string;
  moneda: 'ARS' | 'USD';
}

interface TarjetaForm {
  numeroTarjeta: string;
  titular: string;
  vencimiento: string;
}

interface ChequeForm {
  monto: string;
  banco: string;
}

type FormErrors = Record<string, string>;

export function AgregarMedioPagoScreen() {
  const navigation = useNavigation<Nav>();
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TipoMedio>('CUENTA_BANCARIA');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [cuentaForm, setCuentaForm] = useState<CuentaBancariaForm>({
    cbu: '',
    banco: '',
    moneda: 'ARS',
  });
  const [tarjetaForm, setTarjetaForm] = useState<TarjetaForm>({
    numeroTarjeta: '',
    titular: '',
    vencimiento: '',
  });
  const [chequeForm, setChequeForm] = useState<ChequeForm>({
    monto: '',
    banco: '',
  });

  const clearErrors = () => setErrors({});

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (activeTab === 'CUENTA_BANCARIA') {
      if (!cuentaForm.cbu.trim()) errs.cbu = 'El CBU es requerido';
      if (!cuentaForm.banco.trim()) errs.banco = 'El banco es requerido';
    } else if (activeTab === 'TARJETA_CREDITO') {
      if (!tarjetaForm.numeroTarjeta.trim()) errs.numeroTarjeta = 'El número es requerido';
      if (!tarjetaForm.titular.trim()) errs.titular = 'El titular es requerido';
      if (!tarjetaForm.vencimiento.trim()) errs.vencimiento = 'El vencimiento es requerido';
    } else if (activeTab === 'CHEQUE_CERTIFICADO') {
      if (!chequeForm.monto.trim()) errs.monto = 'El monto es requerido';
      if (!chequeForm.banco.trim()) errs.banco = 'El banco es requerido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = () => {
    if (activeTab === 'CUENTA_BANCARIA') {
      return { tipo: activeTab, ...cuentaForm };
    } else if (activeTab === 'TARJETA_CREDITO') {
      return { tipo: activeTab, ...tarjetaForm };
    } else {
      return { tipo: activeTab, ...chequeForm, monto: parseFloat(chequeForm.monto) || 0 };
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user?.id || !token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/${user.id}/medios-de-pago`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error('Error');
      Alert.alert('Éxito', 'Método de pago agregado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo agregar el método de pago. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (tab: TipoMedio) => {
    setActiveTab(tab);
    clearErrors();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar método de pago</Text>
        <View style={styles.headerSide} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Segmented Control */}
          <View style={styles.segmentContainer}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.segmentTab,
                  activeTab === tab.key && styles.segmentTabActive,
                ]}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentTabText,
                    activeTab === tab.key && styles.segmentTabTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {activeTab === 'CUENTA_BANCARIA' && (
              <>
                <InputField
                  label="CBU / CVU"
                  value={cuentaForm.cbu}
                  onChangeText={(v) => setCuentaForm((f) => ({ ...f, cbu: v }))}
                  error={errors.cbu}
                  keyboardType="numeric"
                />
                <InputField
                  label="Banco"
                  value={cuentaForm.banco}
                  onChangeText={(v) => setCuentaForm((f) => ({ ...f, banco: v }))}
                  error={errors.banco}
                  autoCapitalize="words"
                />
                {/* Currency selector */}
                <Text style={styles.selectorLabel}>Moneda</Text>
                <View style={styles.currencyRow}>
                  {(['ARS', 'USD'] as const).map((currency) => (
                    <TouchableOpacity
                      key={currency}
                      style={[
                        styles.currencyOption,
                        cuentaForm.moneda === currency && styles.currencyOptionActive,
                      ]}
                      onPress={() => setCuentaForm((f) => ({ ...f, moneda: currency }))}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.currencyOptionText,
                          cuentaForm.moneda === currency && styles.currencyOptionTextActive,
                        ]}
                      >
                        {currency === 'ARS' ? 'Pesos (ARS)' : 'Dólares (USD)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {activeTab === 'TARJETA_CREDITO' && (
              <>
                <InputField
                  label="Número de tarjeta"
                  value={tarjetaForm.numeroTarjeta}
                  onChangeText={(v) => setTarjetaForm((f) => ({ ...f, numeroTarjeta: v }))}
                  error={errors.numeroTarjeta}
                  keyboardType="numeric"
                  maxLength={19}
                />
                <InputField
                  label="Titular"
                  value={tarjetaForm.titular}
                  onChangeText={(v) => setTarjetaForm((f) => ({ ...f, titular: v }))}
                  error={errors.titular}
                  autoCapitalize="characters"
                />
                <InputField
                  label="Vencimiento (MM/AA)"
                  value={tarjetaForm.vencimiento}
                  onChangeText={(v) => setTarjetaForm((f) => ({ ...f, vencimiento: v }))}
                  error={errors.vencimiento}
                  keyboardType="numeric"
                  maxLength={5}
                  placeholder="MM/AA"
                />
              </>
            )}

            {activeTab === 'CHEQUE_CERTIFICADO' && (
              <>
                <InputField
                  label="Monto"
                  value={chequeForm.monto}
                  onChangeText={(v) => setChequeForm((f) => ({ ...f, monto: v }))}
                  error={errors.monto}
                  keyboardType="decimal-pad"
                />
                <InputField
                  label="Banco"
                  value={chequeForm.banco}
                  onChangeText={(v) => setChequeForm((f) => ({ ...f, banco: v }))}
                  error={errors.banco}
                  autoCapitalize="words"
                />
              </>
            )}
          </View>

          {/* Save button */}
          <View style={styles.buttonContainer}>
            <PrimaryButton title="Guardar" onPress={handleSave} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AgregarMedioPagoScreen;

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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  segmentTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  segmentTabTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  currencyOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  currencyOptionActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}15`,
  },
  currencyOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  currencyOptionTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
