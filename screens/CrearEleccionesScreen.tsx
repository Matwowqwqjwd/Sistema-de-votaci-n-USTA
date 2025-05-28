import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { showMessage } from 'react-native-flash-message';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

export default function CrearEleccionesScreen() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const tiposRepresentacion = ['facultad', 'semestre', 'comite'];
  const [tipoRepresentacion, setTipoRepresentacion] = useState('facultad');
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const estados = ['activa', 'finalizada', 'programada'];
  const [estado, setEstado] = useState('activa');
  const [adminValid, setAdminValid] = useState(false);

  // Para mostrar los pickers
  const [showInicio, setShowInicio] = useState(false);
  const [showFin, setShowFin] = useState(false);

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

  const handleCreateEleccion = async () => {
    if (
      !nombre ||
      !descripcion ||
      !tipoRepresentacion ||
      !fechaInicio ||
      !fechaFin ||
      !estado
    ) {
      showMessage({
        message: '⚠️ Todos los campos son obligatorios',
        type: 'warning',
        icon: 'warning',
      });
      return;
    }

    try {
      const { error } = await supabase.from('eleccions').insert([
        {
          nombre,
          descripcion,
          tipo_representacion: tipoRepresentacion,
          fecha_inicio: fechaInicio.toISOString().slice(0, 19).replace('T', ' '),
          fecha_fin: fechaFin.toISOString().slice(0, 19).replace('T', ' '),
          estado,
        },
      ]);

      if (error) {
        showMessage({
          message: '❌ Error creando elección',
          description: error.message,
          type: 'danger',
          icon: 'danger',
        });
      } else {
        showMessage({
          message: '✅ Elección creada exitosamente',
          type: 'success',
          icon: 'success',
        });

        setNombre('');
        setDescripcion('');
        setTipoRepresentacion('facultad');
        setFechaInicio(null);
        setFechaFin(null);
        setEstado('activa');
      }
    } catch (e) {
      showMessage({
        message: '❌ Error general',
        description: 'No se pudo crear la elección',
        type: 'danger',
        icon: 'danger',
      });
      console.error(e);
    }
  };

  const getRepresentationIcon = (tipo: string) => {
    switch (tipo) {
      case 'facultad': return '🏛️';
      case 'semestre': return '📚';
      case 'comite': return '👥';
      default: return '📋';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'activa': return '🟢';
      case 'finalizada': return '🔴';
      case 'programada': return '🟡';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activa': return '#059669';
      case 'finalizada': return '#dc2626';
      case 'programada': return '#ea580c';
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
            Solo los administradores pueden crear elecciones.
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
          <Text style={styles.headerIconText}>🗳️</Text>
        </View>
        <Text style={styles.title}>Crear Elección</Text>
        <Text style={styles.subtitle}>
          Configure una nueva elección para el sistema
        </Text>
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
        {/* Basic Information Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de la Elección</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📝</Text>
              <TextInput
                placeholder="Ingrese el nombre de la elección"
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripción</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📄</Text>
              <TextInput
                placeholder="Describa el propósito de la elección"
                style={[styles.input, styles.textArea]}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* Representation Type Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Tipo de Representación</Text>
          <Text style={styles.sectionDescription}>
            Seleccione el nivel de representación para esta elección
          </Text>
          
          <View style={styles.optionsGrid}>
            {tiposRepresentacion.map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.optionCard,
                  tipoRepresentacion === tipo ? styles.optionCardSelected : styles.optionCardUnselected,
                ]}
                onPress={() => setTipoRepresentacion(tipo)}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionIcon}>{getRepresentationIcon(tipo)}</Text>
                  <Text style={[
                    styles.optionText,
                    tipoRepresentacion === tipo ? styles.optionTextSelected : styles.optionTextUnselected,
                  ]}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </Text>
                  <View style={[
                    styles.optionCheckbox,
                    tipoRepresentacion === tipo ? styles.optionCheckboxSelected : styles.optionCheckboxUnselected
                  ]}>
                    {tipoRepresentacion === tipo && <Text style={styles.optionCheckmark}>✓</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Programación</Text>
          <Text style={styles.sectionDescription}>
            Configure las fechas de inicio y fin de la elección
          </Text>

          <View style={styles.dateRow}>
            <View style={styles.dateGroup}>
              <Text style={styles.inputLabel}>Fecha de Inicio</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>📅</Text>
                  <input
                    type="datetime-local"
                    style={{
                      ...styles.input,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: 16,
                    }}
                    value={fechaInicio ? fechaInicio.toISOString().slice(0, 16) : ''}
                    onChange={e => setFechaInicio(e.target.value ? new Date(e.target.value) : null)}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowInicio(true)}
                  >
                    <Text style={styles.dateButtonIcon}>📅</Text>
                    <Text style={[
                      styles.dateButtonText,
                      { color: fechaInicio ? '#ffffff' : '#94a3b8' }
                    ]}>
                      {fechaInicio
                        ? fechaInicio.toLocaleString()
                        : 'Seleccionar fecha'}
                    </Text>
                  </TouchableOpacity>
                  {showInicio && (
                    <DateTimePicker
                      value={fechaInicio || new Date()}
                      mode="datetime"
                      display="default"
                      onChange={(_, date) => {
                        setShowInicio(false);
                        if (date) setFechaInicio(date);
                      }}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.inputLabel}>Fecha de Fin</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>📅</Text>
                  <input
                    type="datetime-local"
                    style={{
                      ...styles.input,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: 16,
                    }}
                    value={fechaFin ? fechaFin.toISOString().slice(0, 16) : ''}
                    onChange={e => setFechaFin(e.target.value ? new Date(e.target.value) : null)}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowFin(true)}
                  >
                    <Text style={styles.dateButtonIcon}>📅</Text>
                    <Text style={[
                      styles.dateButtonText,
                      { color: fechaFin ? '#ffffff' : '#94a3b8' }
                    ]}>
                      {fechaFin
                        ? fechaFin.toLocaleString()
                        : 'Seleccionar fecha'}
                    </Text>
                  </TouchableOpacity>
                  {showFin && (
                    <DateTimePicker
                      value={fechaFin || new Date()}
                      mode="datetime"
                      display="default"
                      onChange={(_, date) => {
                        setShowFin(false);
                        if (date) setFechaFin(date);
                      }}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Estado de la Elección</Text>
          <Text style={styles.sectionDescription}>
            Defina el estado inicial de la elección
          </Text>
          
          <View style={styles.statusGrid}>
            {estados.map((est) => (
              <TouchableOpacity
                key={est}
                style={[
                  styles.statusCard,
                  estado === est ? styles.statusCardSelected : styles.statusCardUnselected,
                  { borderColor: estado === est ? getStatusColor(est) : '#475569' }
                ]}
                onPress={() => setEstado(est)}
              >
                <View style={styles.statusContent}>
                  <Text style={styles.statusIcon}>{getStatusIcon(est)}</Text>
                  <Text style={[
                    styles.statusText,
                    estado === est ? styles.statusTextSelected : styles.statusTextUnselected,
                  ]}>
                    {est.charAt(0).toUpperCase() + est.slice(1)}
                  </Text>
                  <View style={[
                    styles.statusCheckbox,
                    estado === est ? { backgroundColor: getStatusColor(est) } : styles.statusCheckboxUnselected
                  ]}>
                    {estado === est && <Text style={styles.statusCheckmark}>✓</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateEleccion}>
            <View style={styles.createButtonContent}>
              <Text style={styles.createButtonIcon}>🗳️</Text>
              <Text style={styles.createButtonText}>Crear Elección</Text>
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
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#ea580c',
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
    lineHeight: 20,
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
  textArea: {
    paddingTop: 16,
    textAlignVertical: 'top',
  },

  // Options Grid Styles
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    borderColor: '#ea580c',
  },
  optionCardUnselected: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  optionTextUnselected: {
    color: '#94a3b8',
  },
  optionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCheckboxSelected: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  optionCheckboxUnselected: {
    backgroundColor: 'transparent',
    borderColor: '#64748b',
  },
  optionCheckmark: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },

  // Date Styles
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateGroup: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
  },

  // Status Grid Styles
  statusGrid: {
    gap: 12,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  statusCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusCardUnselected: {
    backgroundColor: '#334155',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  statusTextSelected: {
    color: '#ffffff',
  },
  statusTextUnselected: {
    color: '#94a3b8',
  },
  statusCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCheckboxUnselected: {
    backgroundColor: 'transparent',
    borderColor: '#64748b',
  },
  statusCheckmark: {
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