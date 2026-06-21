import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { spacing } from '../theme';

const W = {
  bg: '#0F1F35',
  surface: '#0A1626',
  card: '#0D1E33',
  input: '#152C44',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
  inactive: 'rgba(225,225,225,0.3)',
  error: '#FF6B6B',
};


export function RegisterStep1Screen() {
  const navigation = useNavigation<any>();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [pais, setPais] = useState('');
  const [dni, setDni] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!nombre || !apellido || !domicilio || !pais || !dni) {
      setError('Completá todos los campos');
      return;
    }
    if (!accepted) {
      setError('Aceptá los términos y condiciones');
      return;
    }
    setError('');
    navigation.navigate('RegisterPassword', {
      nombre,
      apellido,
      domicilio,
      pais,
      dni,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="chevron-back" size={28} color={W.text} />
          </TouchableOpacity>
          <Text style={styles.title}>¡Nos alegra conocerte!</Text>
          <Text style={styles.subtitle}>Registrate para poder ofertar</Text>
          <View style={{ height: spacing.xl }} />
          <InputField label="Ingresá tu nombre" value={nombre} onChangeText={setNombre} />
          <InputField label="Ingresá tu apellido" value={apellido} onChangeText={setApellido} />
          <InputField label="Domicilio" value={domicilio} onChangeText={setDomicilio} />
          <InputField label="País" value={pais} onChangeText={setPais} />
          <InputField label="DNI" value={dni} onChangeText={setDni} keyboardType="numeric" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title="Siguiente" onPress={handleNext} />
          <TouchableOpacity style={styles.termsRow} onPress={() => setAccepted(!accepted)}>
            <View style={[styles.checkbox, accepted && styles.checked]}>
              {accepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              Al marcar esta opción, usted acepta los{' '}
              <Text style={styles.link}>términos</Text> y{' '}
              <Text style={styles.link}>condiciones</Text>.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sellerLink}
            onPress={() => navigation.navigate('RegisterVendedor')}
            activeOpacity={0.7}
          >
            <Ionicons name="briefcase-outline" size={16} color={W.accent} />
            <Text style={styles.sellerLinkText}>
              ¿Querés vender? <Text style={styles.link}>Registrate como vendedor</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default RegisterStep1Screen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  container: { flexGrow: 1, padding: spacing.xl },
  back: { marginBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: W.text },
  subtitle: { fontSize: 14, color: W.textSub, marginTop: 4, marginBottom: spacing.xl },
  error: { color: W.error, fontSize: 13, marginBottom: spacing.base },
  label: {
    color: W.textSub,
    fontSize: 14,
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  sellerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: W.border,
    borderRadius: 8,
  },
  sellerLinkText: {
    fontSize: 13,
    color: W.textSub,
  },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.base, gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2,
    borderColor: '#00EADF', justifyContent: 'center', alignItems: 'center',
  },
  checked: { backgroundColor: '#00EADF' },
  termsText: { flex: 1, fontSize: 12, color: W.textSub },
  link: { color: '#00EADF' },
});
