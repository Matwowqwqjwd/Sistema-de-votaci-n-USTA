import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  Image, 
  TouchableOpacity,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('⚠️ Campos requeridos', 'Por favor ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      Alert.alert('❌ Usuario no encontrado', 'Verifica tus datos.');
      setLoading(false);
      return;
    }

    const esValido = await bcrypt.compare(password, user.password_hash);
    if (!esValido) {
      Alert.alert('❌ Contraseña incorrecta');
      setLoading(false);
      return;
    }

    await AsyncStorage.setItem('usuario', JSON.stringify(user));
    Alert.alert('Bienvenido');
    setLoading(false);
    navigation.replace();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Background Gradient Effect */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
        <View style={styles.gradientCircle3} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../assets/images.jpg')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <View style={styles.logoGlow} />
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.universityName}>Universidad Santo Tomás</Text>
            <Text style={styles.campusName}>Sede Tunja</Text>
            <View style={styles.divider} />
            <Text style={styles.systemTitle}>Sistema de Votaciones</Text>
            <Text style={styles.systemSubtitle}>Acceso Seguro al Portal Electoral</Text>
          </View>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>
            <Text style={styles.formSubtitle}>Ingresa tus credenciales para continuar</Text>
          </View>

          <View style={styles.formContent}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Usuario</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Icon name="account-circle" size={24} color="#4f46e5" />
                </View>
                <TextInput
                  placeholder="Ingresa tu nombre de usuario"
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Icon name="lock" size={24} color="#4f46e5" />
                </View>
                <TextInput
                  placeholder="Ingresa tu contraseña"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPass(!showPass)}
                >
                  <Icon 
                    name={showPass ? 'eye-off' : 'eye'} 
                    size={22} 
                    color="#64748b" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <View style={styles.loginButtonContent}>
                {loading ? (
                  <Icon name="loading" size={22} color="#ffffff" />
                ) : (
                  <Icon name="login" size={22} color="#ffffff" />
                )}
                <Text style={styles.loginButtonText}>
                  {loading ? 'Verificando...' : 'Ingresar al Sistema'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Icon name="shield-check" size={16} color="#059669" />
              <Text style={styles.securityText}>
                Conexión segura y cifrada
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerTitle}>Sistema Electoral Institucional</Text>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Universidad Santo Tomás - Todos los derechos reservados
            </Text>
            <Text style={styles.footerVersion}>Versión 2.0.1</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  
  // Background Effects
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  gradientCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
  },
  gradientCircle3: {
    position: 'absolute',
    top: height * 0.3,
    right: -200,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(234, 88, 12, 0.06)',
  },

  // Scroll Content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 4,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 70,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    zIndex: -1,
  },
  titleContainer: {
    alignItems: 'center',
  },
  universityName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  campusName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 16,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#4f46e5',
    borderRadius: 2,
    marginBottom: 16,
  },
  systemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 8,
    textAlign: 'center',
  },
  systemSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Form Container
  formContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Form Content
  formContent: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#475569',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },

  // Login Button
  loginButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#64748b',
    shadowOpacity: 0.1,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  footerContent: {
    alignItems: 'center',
    gap: 8,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerVersion: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
});