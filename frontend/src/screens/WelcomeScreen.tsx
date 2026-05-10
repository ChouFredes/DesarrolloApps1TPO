import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { colors, spacing } from '../theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type Nav = StackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Text style={styles.bienvenidos}>Bienvenidos a</Text>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="gavel" size={40} color={colors.primary} />
            <View>
              <Text style={styles.vivo}>VIVO</Text>
              <Text style={styles.subastas}>SUBASTAS</Text>
            </View>
          </View>
        </View>
        <View style={styles.buttons}>
          <PrimaryButton title="Registrarse" onPress={() => navigation.navigate('RegisterStep1')} />
          <View style={{ height: spacing.md }} />
          <SecondaryButton title="Inicio de sesión" onPress={() => navigation.navigate('Login')} />
        </View>
        <View style={styles.socialArea}>
          <Text style={styles.or}>or</Text>
          <View style={styles.socialRow}>
            {[
              { icon: <FontAwesome name="facebook" size={24} color="#1877F2" /> },
              { icon: <AntDesign name="google" size={24} color="#EA4335" /> },
              { icon: <AntDesign name={'apple1' as any} size={24} color={colors.primary} /> },
            ].map((s, i) => (
              <TouchableOpacity key={i} style={styles.socialBtn}>{s.icon}</TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-around' },
  logoArea: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  bienvenidos: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vivo: { fontSize: 28, fontWeight: '800', color: colors.primary },
  subastas: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, letterSpacing: 3 },
  buttons: { paddingBottom: spacing.xl },
  socialArea: { alignItems: 'center', paddingBottom: spacing.xl },
  or: { color: colors.textSecondary, marginBottom: spacing.base },
  socialRow: { flexDirection: 'row', gap: spacing.base },
  socialBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
});
