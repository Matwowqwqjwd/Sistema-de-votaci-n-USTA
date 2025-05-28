import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
import { Picker } from '@react-native-picker/picker';

type Usuario = {
  id: number;
  identificacion: string;
  username: string;
  role: 'ADMIN' | 'ADMINISTRATIVO' | 'CANDIDATO' | 'VOTANTE';
};

const { width } = Dimensions.get('window');

export default function GestionarUsuarios() {
  const [identificacion, setIdentificacion] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Usuario['role']>('ADMINISTRATIVO');
  const [adminValid, setAdminValid] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<Usuario['role']>('ADMINISTRATIVO');

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
      Alert.alert('⚠️ Todos los campos son obligatorios');
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
        Alert.alert('❌ Error creando usuario', error.message);
      } else {
        Alert.alert('✅ Usuario creado exitosamente');
        setIdentificacion('');
        setUsername('');
        setPassword('');
        setRole('ADMINISTRATIVO');
        cargarUsuarios();
      }
    } catch (e) {
      Alert.alert('❌ Error general', 'No se pudo crear el usuario');
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: number) => {
    // Obtén el usuario actual desde AsyncStorage
    const usuarioActualStr = await AsyncStorage.getItem('usuario');
    if (!usuarioActualStr) return;

    const usuarioActual = JSON.parse(usuarioActualStr);

    // Depuración: revisa si el usuario actual tiene el campo id
    console.log('Usuario actual:', usuarioActual, 'ID a eliminar:', id);

    // Si el usuario actual tiene id y coincide con el que se quiere eliminar, bloquea la acción
    if (usuarioActual.id && usuarioActual.id === id) {
      Alert.alert('⛔ Acción no permitida', 'No puedes eliminar tu propio perfil');
      return;
    }

    Alert.alert(
      'Eliminar usuario',
      '¿Estás seguro de que deseas eliminar este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Elimina el usuario en Supabase
              const { error } = await supabase.from('users').delete().eq('id', id);
              if (error) {
                Alert.alert('❌ Error eliminando usuario', error.message);
              } else {
                Alert.alert('✅ Usuario eliminado');
                cargarUsuarios();
              }
            } catch (e) {
              Alert.alert('❌ Error eliminando usuario', 'Error inesperado');
            }
          },
        },
      ]
    );
  };

  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setEditUsername(usuario.username);
    setEditRole(usuario.role);
    setEditModalVisible(true);
  };

  const handleEditUser = async () => {
    if (!usuarioEditando) return;
    const { error } = await supabase
      .from('users')
      .update({ username: editUsername, role: editRole })
      .eq('id', usuarioEditando.id);

    if (error) {
      Alert.alert('❌ Error editando usuario', error.message);
    } else {
      Alert.alert('✅ Usuario actualizado');
      setEditModalVisible(false);
      setUsuarioEditando(null);
      cargarUsuarios();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return '👑';
      case 'ADMINISTRATIVO': return '💼';
      case 'CANDIDATO': return '🏆';
      case 'VOTANTE': return '🗳️';
      default: return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#dc2626';
      case 'ADMINISTRATIVO': return '#7c3aed';
      case 'CANDIDATO': return '#ea580c';
      case 'VOTANTE': return '#0ea5e9';
      default: return '#64748b';
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
            Solo los administradores pueden gestionar usuarios.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>👥</Text>
        </View>
        <Text style={styles.title}>Gestión de Usuarios</Text>
        <Text style={styles.subtitle}>
          Administra todos los usuarios del sistema
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{usuarios.length}</Text>
          <Text style={styles.statLabel}>Total Usuarios</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {usuarios.filter(u => u.role === 'VOTANTE').length}
          </Text>
          <Text style={styles.statLabel}>Votantes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {usuarios.filter(u => u.role === 'CANDIDATO').length}
          </Text>
          <Text style={styles.statLabel}>Candidatos</Text>
        </View>
      </View>

      {/* Users List Section */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Usuarios Registrados</Text>
        
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {item.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.username}</Text>
                    <Text style={styles.userIdentification}>ID: {item.identificacion}</Text>
                  </View>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                  <Text style={styles.roleIcon}>{getRoleIcon(item.role)}</Text>
                  <Text style={styles.roleText}>{item.role}</Text>
                </View>
              </View>
              
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => abrirModalEditar(item)}
                >
                  <Text style={styles.editButtonIcon}>✏️</Text>
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteUser(item.id)}
                >
                  <Text style={styles.deleteButtonIcon}>🗑️</Text>
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Usuario</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Nombre de Usuario</Text>
                <View style={styles.modalInputContainer}>
                  <Text style={styles.modalInputIcon}>👤</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editUsername}
                    onChangeText={setEditUsername}
                    placeholder="Ingrese el nombre de usuario"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Rol del Usuario</Text>
                <View style={styles.rolePickerContainer}>
                  <Picker
                    selectedValue={editRole}
                    onValueChange={(itemValue) => setEditRole(itemValue)}
                    style={styles.rolePicker}
                    itemStyle={styles.rolePickerItem}
                  >
                    <Picker.Item label="👑 ADMIN" value="ADMIN" />
                    <Picker.Item label="💼 ADMINISTRATIVO" value="ADMINISTRATIVO" />
                    <Picker.Item label="🏆 CANDIDATO" value="CANDIDATO" />
                    <Picker.Item label="🗳️ VOTANTE" value="VOTANTE" />
                  </Picker>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleEditUser}
              >
                <Text style={styles.modalSaveIcon}>💾</Text>
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7c3aed',
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

  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },

  // List Section
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },

  // User Card Styles
  userCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userIdentification: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  roleIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  // User Actions
  userActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 12,
  },
  editButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 12,
  },
  deleteButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  modalContent: {
    padding: 24,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    paddingHorizontal: 16,
  },
  modalInputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  rolePickerContainer: {
    backgroundColor: '#334155',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    overflow: 'hidden',
  },
  rolePicker: {
    color: '#ffffff',
  },
  rolePickerItem: {
    fontSize: 16,
    color: '#ffffff',
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 16,
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  modalSaveIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});