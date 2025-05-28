import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const json = await AsyncStorage.getItem('usuario');
        if (json) {
          const usuario = JSON.parse(json);
          setUserId(usuario.id);
          setUserName(usuario.username || 'Usuario');
          setUserRole(usuario.role || 'USUARIO');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  const showMessage = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setMensajeExito(message);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const guardarPerfilEnBD = async () => {
    if (!userId || !nombres || !apellidos || !edad || !genero) {
      Alert.alert('⚠️ Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const { data: existentes, error: errorSelect } = await supabase
        .from('userprofiles')
        .select('id')
        .eq('user_id', userId);

      if (errorSelect) {
        console.error('Error buscando perfil:', errorSelect);
        throw errorSelect;
      }

      let error;
      if (existentes && existentes.length > 0) {
        const idPerfil = existentes[0].id;
        ({ error } = await supabase
          .from('userprofiles')
          .update({
            nombres,
            apellidos,
            edad: parseInt(edad, 10),
            genero,
          })
          .eq('id', idPerfil));
        showMessage('✅ Perfil actualizado correctamente');
      } else {
        ({ error } = await supabase
          .from('userprofiles')
          .insert([{
            user_id: userId,
            nombres,
            apellidos,
            edad: parseInt(edad, 10),
            genero,
          }]));
        showMessage('✅ Perfil creado correctamente');
      }

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }
      
      setHasProfile(true);
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo guardar el perfil en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPerfilEnBD = async () => {
    if (!userId) {
      Alert.alert('❌ Error', 'No se encontró el usuario.');
      return;
    }

    Alert.alert(
      '⚠️ Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar tu perfil? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('userprofiles')
                .delete()
                .eq('user_id', userId);
              
              if (error) {
                console.error('Error al eliminar perfil:', error);
                throw error;
              }
              
              showMessage('🗑️ Perfil eliminado correctamente');
              setNombres('');
              setApellidos('');
              setEdad('');
              setGenero('');
              setHasProfile(false);
            } catch (error) {
              Alert.alert('❌ Error', 'No se pudo eliminar el perfil en la base de datos.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const cargarPerfilEnBD = async () => {
    if (!userId) {
      Alert.alert('❌ Error', 'No se encontró el usuario.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('userprofiles')
        .select('nombres, apellidos, edad, genero, user_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error al cargar perfil:', error);
        Alert.alert('❌ Error', 'No se pudo cargar el perfil.');
        return;
      }

      const perfil = data && data.length > 0
        ? data.find((p) => p.user_id === userId)
        : null;

      if (!perfil) {
        showMessage('ℹ️ No hay perfil registrado. Puedes crear uno nuevo.', 'info');
        setNombres('');
        setApellidos('');
        setEdad('');
        setGenero('');
        setHasProfile(false);
        return;
      }

      setNombres(perfil.nombres || '');
      setApellidos(perfil.apellidos || '');
      setEdad(perfil.edad ? perfil.edad.toString() : '');
      setGenero(perfil.genero || '');
      setHasProfile(true);
      showMessage('✏️ Perfil cargado para edición', 'info');
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#dc2626';
      case 'VOTANTE': return '#059669';
      default: return '#64748b';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'crown';
      case 'VOTANTE': return 'vote';
      default: return 'account';
    }
  };

  // Load profile on component mount
  useEffect(() => {
    if (userId) {
      cargarPerfilEnBD();
    }
  }, [userId]);

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
          <View style={styles.profileIconContainer}>
            <View style={styles.profileIcon}>
              <Icon name="account-circle" size={48} color="#ffffff" />
            </View>
            <View style={styles.profileIconGlow} />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userRole) }]}>
              <Icon name={getRoleIcon(userRole)} size={16} color="#ffffff" />
              <Text style={styles.roleText}>{userRole}</Text>
            </View>
          </View>

          <Text style={styles.headerTitle}>Gestión de Perfil</Text>
          <Text style={styles.headerSubtitle}>
            Administra tu información personal
          </Text>
        </View>

        {/* Success/Info Message */}
        {mensajeExito !== '' && (
          <View style={styles.messageContainer}>
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{mensajeExito}</Text>
            </View>
          </View>
        )}

        {/* Profile Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Icon name="form-textbox" size={24} color="#4f46e5" />
            <Text style={styles.formTitle}>Información Personal</Text>
          </View>

          <View style={styles.formContent}>
            {/* Names Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombres</Text>
              <View style={styles.inputContainer}>
                <Icon name="account" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  placeholder="Ingresa tus nombres"
                  style={styles.input}
                  value={nombres}
                  onChangeText={setNombres}
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Surnames Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellidos</Text>
              <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  placeholder="Ingresa tus apellidos"
                  style={styles.input}
                  value={apellidos}
                  onChangeText={setApellidos}
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Age Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Edad</Text>
              <View style={styles.inputContainer}>
                <Icon name="calendar" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  placeholder="Ingresa tu edad"
                  style={styles.input}
                  value={edad}
                  onChangeText={setEdad}
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                  maxLength={3}
                />
              </View>
            </View>

            {/* Gender Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Género</Text>
              <View style={styles.pickerContainer}>
                <Icon name="gender-male-female" size={20} color="#64748b" style={styles.pickerIcon} />
                <Picker
                  selectedValue={genero}
                  onValueChange={setGenero}
                  style={styles.picker}
                  dropdownIconColor="#64748b"
                >
                  <Picker.Item label="Selecciona tu género..." value="" />
                  <Picker.Item label="Masculino" value="masculino" />
                  <Picker.Item label="Femenino" value="femenino" />
                  <Picker.Item label="Otro" value="otro" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton, loading && styles.buttonDisabled]} 
            onPress={guardarPerfilEnBD}
            disabled={loading}
          >
            <Icon 
              name={loading ? "loading" : "content-save"} 
              size={20} 
              color="#ffffff" 
            />
            <Text style={styles.actionButtonText}>
              {hasProfile ? 'Actualizar Perfil' : 'Guardar Perfil'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.loadButton, loading && styles.buttonDisabled]} 
            onPress={cargarPerfilEnBD}
            disabled={loading}
          >
            <Icon 
              name={loading ? "loading" : "refresh"} 
              size={20} 
              color="#ffffff" 
            />
            <Text style={styles.actionButtonText}>Recargar Perfil</Text>
          </TouchableOpacity>

          {hasProfile && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton, loading && styles.buttonDisabled]} 
              onPress={eliminarPerfilEnBD}
              disabled={loading}
            >
              <Icon 
                name={loading ? "loading" : "delete"} 
                size={20} 
                color="#ffffff" 
              />
              <Text style={styles.actionButtonText}>Eliminar Perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Status */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusCard,
            { borderLeftColor: hasProfile ? '#059669' : '#ea580c' }
          ]}>
            <Icon 
              name={hasProfile ? "check-circle" : "information"} 
              size={24} 
              color={hasProfile ? '#059669' : '#ea580c'} 
            />
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {hasProfile ? 'Perfil Configurado' : 'Perfil Pendiente'}
              </Text>
              <Text style={styles.statusMessage}>
                {hasProfile 
                  ? 'Tu perfil está completo y actualizado'
                  : 'Completa tu perfil para una mejor experiencia'
                }
              </Text>
            </View>
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
    marginBottom: 32,
  },
  profileIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  profileIconGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 58,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    zIndex: -1,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Message Container
  messageContainer: {
    marginBottom: 24,
  },
  messageCard: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 12,
    padding: 16,
  },
  messageText: {
    color: '#10b981',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },

  // Form Container
  formContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  formContent: {
    gap: 20,
  },

  // Input Styles
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },

  // Picker Styles
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    paddingLeft: 16,
    height: 52,
  },
  pickerIcon: {
    marginRight: 12,
  },
  picker: {
    flex: 1,
    color: '#ffffff',
    height: 52,
  },

  // Action Buttons
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: '#059669',
  },
  loadButton: {
    backgroundColor: '#0ea5e9',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  buttonDisabled: {
    backgroundColor: '#64748b',
    shadowOpacity: 0.05,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Status Container
  statusContainer: {
    marginBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    gap: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});