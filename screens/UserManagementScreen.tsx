import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
import { showMessage } from 'react-native-flash-message';

// Tipado de usuario
type Usuario = {
  id: number;
  identificacion: string;
  username: string;
  role: 'CANDIDATO';
};

const { width } = Dimensions.get('window');

export default function UserManagementScreen() {
  const [identificacion, setIdentificacion] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Usuario['role']>('CANDIDATO');
  const [adminValid, setAdminValid] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    const verificarRol = async () => {
      const usuario = await AsyncStorage.getItem('usuario');
      if (usuario) {
        const parsed = JSON.parse(usuario);
        setAdminValid(parsed.role === 'ADMIN');
      }
    };
    verificarRol();
  }, []);

  const cargarUsuarios = async () => {
    const { data, error } = await supabase.from('users').select('id, identificacion, username, role');
    if (!error && data) {
      setUsuarios(data as Usuario[]);
    }
  };

  useEffect(() => {
    if (adminValid) {
      cargarUsuarios();
    }
  }, [adminValid]);

  const handleCreateUser = async () => {
    if (!identificacion || !username || !password || !role) {
      showMessage({
        message: '⚠️ Todos los campos son obligatorios',
        type: 'warning',
      });
      return;
    }

    try {
      const hashed = await bcrypt.hash(password, 10);
      const { error } = await supabase.from('users').insert([{
        identificacion,
        username,
        password_hash: hashed,
        role,
      }]);

      if (error) {
        showMessage({
          message: '❌ Error creando usuario',
          description: error.message,
          type: 'danger',
        });
      } else {
        showMessage({
          message: '✅ Usuario creado exitosamente',
          type: 'success',
        });
        setIdentificacion('');
        setUsername('');
        setPassword('');
        setRole('CANDIDATO');
        cargarUsuarios();
      }
    } catch (e) {
      showMessage({
        message: '❌ Error general',
        description: 'No se pudo crear el usuario',
        type: 'danger',
      });
      console.error(e);
    }
  };

  if (!adminValid) {
    return (
      <View style={styles.accessDeniedContainer}>
        <View style={styles.accessDeniedCard}>
          <View style={styles.accessDeniedIcon}>
            <Text style={styles.accessDeniedIconText}>🔒</Text>
          </View>
          <Text style={styles.accessDeniedTitle}>Acceso Restringido</Text>
          <Text style={styles.accessDeniedMessage}>
            No tienes permisos para acceder a esta sección.
          </Text>
          <Text style={styles.accessDeniedSubtext}>
            Solo los administradores pueden registrar candidatos.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>👤</Text>
        </View>
        <Text style={styles.title}>Registrar Candidato</Text>
        <Text style={styles.subtitle}>
          Complete la información del nuevo candidato
        </Text>
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de Identificación</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🆔</Text>
              <TextInput
                placeholder="Ingrese el número de identificación"
                style={styles.input}
                value={identificacion}
                onChangeText={setIdentificacion}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de Usuario</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👨‍💼</Text>
              <TextInput
                placeholder="Ingrese el nombre de usuario"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                placeholder="Ingrese una contraseña segura"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Configuración de Rol</Text>
          
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>Tipo de Usuario</Text>
            <Text style={styles.roleDescription}>
              Seleccione el rol que tendrá este usuario en el sistema
            </Text>
            
            <View style={styles.roleContainer}>
              {['CANDIDATO'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleCard,
                    role === r ? styles.roleCardSelected : styles.roleCardUnselected,
                  ]}
                  onPress={() => setRole(r as Usuario['role'])}
                >
                  <View style={styles.roleCardContent}>
                    <View style={[
                      styles.roleIconContainer,
                      role === r ? styles.roleIconSelected : styles.roleIconUnselected
                    ]}>
                      <Text style={styles.roleIcon}>🏆</Text>
                    </View>
                    <View style={styles.roleTextContainer}>
                      <Text style={[
                        styles.roleTitle,
                        role === r ? styles.roleTitleSelected : styles.roleTitleUnselected,
                      ]}>
                        {r}
                      </Text>
                      <Text style={[
                        styles.roleSubtitle,
                        role === r ? styles.roleSubtitleSelected : styles.roleSubtitleUnselected,
                      ]}>
                        Participante en elecciones
                      </Text>
                    </View>
                    <View style={[
                      styles.roleCheckbox,
                      role === r ? styles.roleCheckboxSelected : styles.roleCheckboxUnselected
                    ]}>
                      {role === r && <Text style={styles.roleCheckmark}>✓</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateUser}>
            <View style={styles.createButtonContent}>
              <Text style={styles.createButtonIcon}>➕</Text>
              <Text style={styles.createButtonText}>Crear Candidato</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // Access Denied Styles
  accessDeniedContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  accessDeniedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  accessDeniedIconText: {
    fontSize: 36,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  accessDeniedMessage: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  accessDeniedSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Header Styles
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headerIconText: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Form Card Styles
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  formSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 20,
  },

  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
  },

  // Role Selection Styles
  roleSection: {
    marginTop: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 20,
  },
  roleContainer: {
    gap: 12,
  },
  roleCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  roleCardSelected: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderColor: '#4f46e5',
  },
  roleCardUnselected: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleIconSelected: {
    backgroundColor: '#4f46e5',
  },
  roleIconUnselected: {
    backgroundColor: '#475569',
  },
  roleIcon: {
    fontSize: 24,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleTitleSelected: {
    color: '#ffffff',
  },
  roleTitleUnselected: {
    color: '#94a3b8',
  },
  roleSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleSubtitleSelected: {
    color: '#a78bfa',
  },
  roleSubtitleUnselected: {
    color: '#64748b',
  },
  roleCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCheckboxSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  roleCheckboxUnselected: {
    backgroundColor: 'transparent',
    borderColor: '#64748b',
  },
  roleCheckmark: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },

  // Action Button Styles
  actionSection: {
    marginTop: 8,
  },
  createButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
});