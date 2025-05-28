import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert, 
  Modal, 
  TextInput, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { showMessage } from 'react-native-flash-message';

const { width } = Dimensions.get('window');

export default function EleccionesRegistradas() {
  // Estados para elecciones
  const [elecciones, setElecciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para edición
  const [modalVisible, setModalVisible] = useState(false);
  const [eleccionEdit, setEleccionEdit] = useState<any>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editEstado, setEditEstado] = useState('');

  // Opciones válidas
  const tiposRepresentacion = ['facultad', 'semestre', 'comite'];
  const estados = ['activa', 'finalizada', 'programada'];

  // Estados para candidaturas
  const [modalCandidatos, setModalCandidatos] = useState(false);
  const [usuariosCandidatos, setUsuariosCandidatos] = useState<any[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [propuesta, setPropuesta] = useState('');
  const [candidatosEleccion, setCandidatosEleccion] = useState<any[]>([]);
  const [eleccionActual, setEleccionActual] = useState<any>(null);

  // Cargar elecciones
  const fetchElecciones = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('eleccions').select('*').order('fecha_inicio', { ascending: false });
    if (error) {
      showMessage({ message: 'Error cargando elecciones', type: 'danger' });
    } else {
      setElecciones(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchElecciones();
  }, []);

  // Eliminar elección
  const eliminarEleccion = async (id: number) => {
    Alert.alert(
      'Eliminar',
      '¿Seguro que deseas eliminar esta elección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('eleccions').delete().eq('id', id);
            if (error) {
              showMessage({ message: 'Error eliminando', type: 'danger' });
            } else {
              showMessage({ message: 'Elección eliminada', type: 'success' });
              fetchElecciones();
            }
          }
        }
      ]
    );
  };

  // Abrir modal de edición
  const editarEleccion = (eleccion: any) => {
    setEleccionEdit(eleccion);
    setEditNombre(eleccion.nombre);
    setEditDescripcion(eleccion.descripcion);
    setEditTipo(eleccion.tipo_representacion);
    setEditEstado(eleccion.estado);
    setModalVisible(true);
  };

  // Guardar cambios de edición
  const guardarEdicion = async () => {
    if (!editNombre || !editDescripcion || !editTipo || !editEstado) {
      showMessage({ message: 'Todos los campos son obligatorios', type: 'warning' });
      return;
    }
    const { error } = await supabase
      .from('eleccions')
      .update({
        nombre: editNombre,
        descripcion: editDescripcion,
        tipo_representacion: editTipo,
        estado: editEstado,
      })
      .eq('id', eleccionEdit.id);

    if (error) {
      showMessage({ message: 'Error actualizando', type: 'danger' });
    } else {
      showMessage({ message: 'Elección actualizada', type: 'success' });
      setModalVisible(false);
      fetchElecciones();
    }
  };

  // Cargar usuarios con rol candidato (tabla users)
  const fetchUsuariosCandidatos = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, identificacion')
      .eq('role', 'CANDIDATO');
    if (!error) setUsuariosCandidatos(data || []);
  };

  // Cargar candidaturas de la elección seleccionada (join con users)
  const fetchCandidatosEleccion = async (eleccionId: number) => {
    const { data, error } = await supabase
      .from('candidaturas')
      .select('id, userid, propuesta, users(username, identificacion)')
      .eq('eleccionid', eleccionId);
    if (!error) setCandidatosEleccion(data || []);
  };

  // Abrir modal de candidatos
  const abrirModalCandidatos = async (eleccion: any) => {
    setEleccionActual(eleccion);
    setUsuarioSeleccionado('');
    setPropuesta('');
    await fetchUsuariosCandidatos();
    await fetchCandidatosEleccion(eleccion.id);
    setModalCandidatos(true);
  };

  // Agregar candidatura a la elección
  const agregarCandidato = async () => {
    if (!usuarioSeleccionado || !propuesta) {
      showMessage({ message: 'Selecciona un usuario y escribe una propuesta', type: 'warning' });
      return;
    }
    const { error } = await supabase
      .from('candidaturas')
      .insert([{ eleccionid: eleccionActual.id, userid: usuarioSeleccionado, propuesta }]);
    if (error) {
      showMessage({ message: 'Error agregando candidato', type: 'danger' });
    } else {
      showMessage({ message: 'Candidato agregado', type: 'success' });
      setUsuarioSeleccionado('');
      setPropuesta('');
      fetchCandidatosEleccion(eleccionActual.id);
    }
  };

  // Eliminar candidatura de la elección
  const eliminarCandidato = async (id: number) => {
    const { error } = await supabase.from('candidaturas').delete().eq('id', id);
    if (!error) {
      fetchCandidatosEleccion(eleccionActual.id);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'activa': return '🟢';
      case 'finalizada': return '🔴';
      case 'programada': return '🟡';
      default: return '⚪';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render de cada tarjeta de elección
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.electionCard}>
      <View style={styles.electionHeader}>
        <View style={styles.electionInfo}>
          <Text style={styles.electionTitle}>{item.nombre}</Text>
          <Text style={styles.electionDescription}>{item.descripcion}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(item.estado)}</Text>
          <Text style={styles.statusText}>{item.estado.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.electionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>{getRepresentationIcon(item.tipo_representacion)}</Text>
          <Text style={styles.detailLabel}>Tipo:</Text>
          <Text style={styles.detailValue}>{item.tipo_representacion}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailLabel}>Inicio:</Text>
          <Text style={styles.detailValue}>{formatDate(item.fecha_inicio)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🏁</Text>
          <Text style={styles.detailLabel}>Fin:</Text>
          <Text style={styles.detailValue}>{formatDate(item.fecha_fin)}</Text>
        </View>
      </View>

      <View style={styles.electionActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => editarEleccion(item)}>
          <Text style={styles.editButtonIcon}>✏️</Text>
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.candidatesButton} onPress={() => abrirModalCandidatos(item)}>
          <Text style={styles.candidatesButtonIcon}>👥</Text>
          <Text style={styles.candidatesButtonText}>Candidatos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarEleccion(item.id)}>
          <Text style={styles.deleteButtonIcon}>🗑️</Text>
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>📊</Text>
        </View>
        <Text style={styles.title}>Elecciones Registradas</Text>
        <Text style={styles.subtitle}>
          Gestiona todas las elecciones del sistema
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{elecciones.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {elecciones.filter(e => e.estado === 'activa').length}
          </Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {elecciones.filter(e => e.estado === 'programada').length}
          </Text>
          <Text style={styles.statLabel}>Programadas</Text>
        </View>
      </View>

      {/* Elections List */}
      <FlatList
        data={elecciones}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchElecciones}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No hay elecciones</Text>
            <Text style={styles.emptyMessage}>No se han registrado elecciones aún</Text>
          </View>
        }
      />

      {/* Modal de edición */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Elección</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Nombre de la Elección</Text>
                <View style={styles.modalInputContainer}>
                  <Text style={styles.modalInputIcon}>📝</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Nombre de la elección"
                    value={editNombre}
                    onChangeText={setEditNombre}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Descripción</Text>
                <View style={styles.modalInputContainer}>
                  <Text style={styles.modalInputIcon}>📄</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    placeholder="Descripción de la elección"
                    value={editDescripcion}
                    onChangeText={setEditDescripcion}
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Tipo de Representación</Text>
                <View style={styles.optionsContainer}>
                  {tiposRepresentacion.map(tipo => (
                    <TouchableOpacity
                      key={tipo}
                      style={[
                        styles.optionButton,
                        editTipo === tipo ? styles.optionButtonSelected : styles.optionButtonUnselected,
                      ]}
                      onPress={() => setEditTipo(tipo)}
                    >
                      <Text style={styles.optionIcon}>{getRepresentationIcon(tipo)}</Text>
                      <Text style={[
                        styles.optionText,
                        editTipo === tipo ? styles.optionTextSelected : styles.optionTextUnselected,
                      ]}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Estado</Text>
                <View style={styles.optionsContainer}>
                  {estados.map(est => (
                    <TouchableOpacity
                      key={est}
                      style={[
                        styles.optionButton,
                        editEstado === est ? styles.optionButtonSelected : styles.optionButtonUnselected,
                      ]}
                      onPress={() => setEditEstado(est)}
                    >
                      <Text style={styles.optionIcon}>{getStatusIcon(est)}</Text>
                      <Text style={[
                        styles.optionText,
                        editEstado === est ? styles.optionTextSelected : styles.optionTextUnselected,
                      ]}>
                        {est.charAt(0).toUpperCase() + est.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Fechas (Solo lectura)</Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>Inicio</Text>
                    <Text style={styles.dateValue}>{formatDate(eleccionEdit?.fecha_inicio || '')}</Text>
                  </View>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>Fin</Text>
                    <Text style={styles.dateValue}>{formatDate(eleccionEdit?.fecha_fin || '')}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={guardarEdicion}
              >
                <Text style={styles.modalSaveIcon}>💾</Text>
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de candidaturas */}
      <Modal
        visible={modalCandidatos}
        animationType="slide"
        transparent
        onRequestClose={() => setModalCandidatos(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Candidatos - {eleccionActual?.nombre}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalCandidatos(false)}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.candidateSection}>
                <Text style={styles.sectionTitle}>Agregar Candidato</Text>
                
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Seleccionar Usuario</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={usuarioSeleccionado}
                      onValueChange={setUsuarioSeleccionado}
                      style={styles.picker}
                    >
                      <Picker.Item label="Seleccione un usuario" value="" />
                      {usuariosCandidatos.map(u => (
                        <Picker.Item
                          key={u.id}
                          label={`${u.username} (${u.identificacion})`}
                          value={u.id}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Propuesta</Text>
                  <View style={styles.modalInputContainer}>
                    <Text style={styles.modalInputIcon}>💡</Text>
                    <TextInput
                      style={[styles.modalInput, styles.modalTextArea]}
                      placeholder="Describe la propuesta del candidato"
                      value={propuesta}
                      onChangeText={setPropuesta}
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.addCandidateButton} onPress={agregarCandidato}>
                  <Text style={styles.addCandidateIcon}>➕</Text>
                  <Text style={styles.addCandidateText}>Agregar Candidato</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.candidateSection}>
                <Text style={styles.sectionTitle}>Candidatos Registrados</Text>
                
                {candidatosEleccion.length === 0 ? (
                  <View style={styles.emptyCandidates}>
                    <Text style={styles.emptyCandidatesIcon}>👤</Text>
                    <Text style={styles.emptyCandidatesText}>No hay candidatos registrados</Text>
                  </View>
                ) : (
                  candidatosEleccion.map(c => (
                    <View key={c.id} style={styles.candidateCard}>
                      <View style={styles.candidateInfo}>
                        <Text style={styles.candidateName}>
                          {c.users?.username} ({c.users?.identificacion})
                        </Text>
                        <Text style={styles.candidateProposal}>{c.propuesta}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeCandidateButton}
                        onPress={() => eliminarCandidato(c.id)}
                      >
                        <Text style={styles.removeCandidateIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCloseButtonFull}
                onPress={() => setModalCandidatos(false)}
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
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

  // List Styles
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Election Card Styles
  electionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  electionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  electionInfo: {
    flex: 1,
    marginRight: 12,
  },
  electionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  electionDescription: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Election Details
  electionDetails: {
    marginBottom: 20,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginRight: 8,
    width: 50,
  },
  detailValue: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },

  // Election Actions
  electionActions: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 14,
    marginRight: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  candidatesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  candidatesButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  candidatesButtonText: {
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
    fontSize: 14,
    marginRight: 6,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
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
    maxWidth: 500,
    maxHeight: '90%',
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
    flex: 1,
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

  // Modal Input Styles
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
  modalTextArea: {
    paddingTop: 16,
    textAlignVertical: 'top',
  },

  // Options Styles
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0ea5e9',
  },
  optionButtonUnselected: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  optionTextUnselected: {
    color: '#94a3b8',
  },

  // Date Display
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateField: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },

  // Picker Styles
  pickerContainer: {
    backgroundColor: '#334155',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    overflow: 'hidden',
  },
  picker: {
    color: '#ffffff',
  },

  // Candidate Section
  candidateSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  addCandidateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  addCandidateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  addCandidateText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Candidate Card
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  candidateProposal: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  removeCandidateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeCandidateIcon: {
    fontSize: 16,
  },

  // Empty Candidates
  emptyCandidates: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCandidatesIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyCandidatesText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
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
  modalCloseButtonFull: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 16,
  },
});