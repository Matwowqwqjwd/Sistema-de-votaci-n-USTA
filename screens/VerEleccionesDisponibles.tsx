import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Alert,
  Dimensions,
  ScrollView 
} from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function VerEleccionesDisponibles() {
  const [elecciones, setElecciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [eleccionSeleccionada, setEleccionSeleccionada] = useState<any>(null);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [eleccionesVotadas, setEleccionesVotadas] = useState<number[]>([]);
  const [votingLoading, setVotingLoading] = useState(false);

  // Obtener el usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      let usuarioJSON = localStorage.getItem('usuario');
      if (!usuarioJSON && typeof window === 'undefined') {
        usuarioJSON = await AsyncStorage.getItem('usuario');
      }
      if (usuarioJSON) {
        const usuario = JSON.parse(usuarioJSON);
        setUserId(usuario.id);
      }
    };
    fetchUser();
  }, []);

  // Traer elecciones y votos del usuario
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Traer elecciones activas
      const { data: eleccionesData, error } = await supabase
        .from('eleccions')
        .select('*')
        .eq('estado', 'activa')
        .order('fecha_inicio', { ascending: false });
      if (!error) setElecciones(eleccionesData || []);

      // Traer votos del usuario
      if (userId) {
        const { data: votosData } = await supabase
          .from('votos')
          .select('eleccionid')
          .eq('userid', userId);
        setEleccionesVotadas((votosData || []).map((v: any) => v.eleccionid));
      }
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  // Traer candidatos de la elección seleccionada
  const abrirModalCandidatos = async (eleccion: any) => {
    // Si ya votó, no abrir el modal
    if (eleccionesVotadas.includes(eleccion.id)) {
      Alert.alert('Ya has votado en esta elección');
      return;
    }
    setEleccionSeleccionada(eleccion);
    setCandidatoSeleccionado(null);
    const { data, error } = await supabase
      .from('candidaturas')
      .select('id, propuesta, users(username, identificacion)')
      .eq('eleccionid', eleccion.id);
    if (!error) setCandidatos(data || []);
    setModalVisible(true);
  };

  // Votar por un candidato
  const votarPorCandidato = async () => {
    if (!candidatoSeleccionado) {
      Alert.alert('Selecciona un candidato');
      return;
    }
    if (!userId) {
      Alert.alert('No se pudo identificar el usuario');
      return;
    }

    setVotingLoading(true);

    // Verificar si ya votó en esta elección
    const { data: votoExistente } = await supabase
      .from('votos')
      .select('id')
      .eq('userid', userId)
      .eq('eleccionid', eleccionSeleccionada.id)
      .maybeSingle();

    if (votoExistente) {
      Alert.alert('Ya has votado en esta elección');
      setModalVisible(false);
      setVotingLoading(false);
      return;
    }

    // Registrar el voto
    const { error } = await supabase
      .from('votos')
      .insert([
        {
          userid: userId,
          eleccionid: eleccionSeleccionada.id,
          candidaturaid: candidatoSeleccionado.id,
        },
      ]);
    
    setVotingLoading(false);
    
    if (error) {
      Alert.alert('Error al votar');
    } else {
      Alert.alert('¡Voto registrado exitosamente!');
      setModalVisible(false);
      setEleccionesVotadas([...eleccionesVotadas, eleccionSeleccionada.id]);
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

  const renderElectionCard = ({ item }: { item: any }) => {
    const yaVoto = eleccionesVotadas.includes(item.id);
    
    return (
      <View style={styles.electionCard}>
        {/* Election Header */}
        <View style={styles.electionHeader}>
          <View style={styles.electionInfo}>
            <Text style={styles.electionTitle}>{item.nombre}</Text>
            <Text style={styles.electionDescription}>{item.descripcion}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: yaVoto ? '#059669' : '#ea580c' }
          ]}>
            <Text style={styles.statusIcon}>{yaVoto ? '✅' : '🗳️'}</Text>
            <Text style={styles.statusText}>
              {yaVoto ? 'VOTADO' : 'ACTIVA'}
            </Text>
          </View>
        </View>

        {/* Election Details */}
        <View style={styles.electionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🏛️</Text>
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

        {/* Vote Button */}
        <TouchableOpacity
          style={[
            styles.voteButton,
            yaVoto ? styles.voteButtonDisabled : styles.voteButtonActive
          ]}
          onPress={() => abrirModalCandidatos(item)}
          disabled={yaVoto}
        >
          <Text style={styles.voteButtonIcon}>
            {yaVoto ? '✅' : '🗳️'}
          </Text>
          <Text style={[
            styles.voteButtonText,
            yaVoto ? styles.voteButtonTextDisabled : styles.voteButtonTextActive
          ]}>
            {yaVoto ? 'Ya has votado' : 'Ver candidatos y votar'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🗳️</Text>
        </View>
        <Text style={styles.title}>Elecciones Disponibles</Text>
        <Text style={styles.subtitle}>
          Participa en las elecciones activas del sistema
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{elecciones.length}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{eleccionesVotadas.length}</Text>
          <Text style={styles.statLabel}>Votadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {elecciones.length - eleccionesVotadas.length}
          </Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>

      {/* Elections List */}
      <FlatList
        data={elecciones}
        keyExtractor={item => item.id.toString()}
        renderItem={renderElectionCard}
        refreshing={loading}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗳️</Text>
            <Text style={styles.emptyTitle}>No hay elecciones activas</Text>
            <Text style={styles.emptyMessage}>
              No se encontraron elecciones disponibles para votar
            </Text>
          </View>
        }
      />

      {/* Voting Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {eleccionSeleccionada?.nombre}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.votingInstructions}>
                <Text style={styles.instructionsIcon}>📋</Text>
                <Text style={styles.instructionsTitle}>Instrucciones de Votación</Text>
                <Text style={styles.instructionsText}>
                  Selecciona un candidato de la lista y confirma tu voto. 
                  Una vez confirmado, no podrás cambiar tu decisión.
                </Text>
              </View>

              <Text style={styles.candidatesTitle}>Candidatos Disponibles</Text>
              
              {candidatos.length === 0 ? (
                <View style={styles.emptyCandidates}>
                  <Text style={styles.emptyCandidatesIcon}>👤</Text>
                  <Text style={styles.emptyCandidatesText}>
                    No hay candidatos registrados para esta elección
                  </Text>
                </View>
              ) : (
                candidatos.map(candidato => (
                  <TouchableOpacity
                    key={candidato.id}
                    style={[
                      styles.candidateCard,
                      candidatoSeleccionado?.id === candidato.id && styles.candidateCardSelected,
                    ]}
                    onPress={() => setCandidatoSeleccionado(candidato)}
                  >
                    <View style={styles.candidateHeader}>
                      <View style={styles.candidateInfo}>
                        <Text style={styles.candidateName}>
                          {candidato.users?.username}
                        </Text>
                        <Text style={styles.candidateId}>
                          ID: {candidato.users?.identificacion}
                        </Text>
                      </View>
                      <View style={[
                        styles.candidateCheckbox,
                        candidatoSeleccionado?.id === candidato.id && styles.candidateCheckboxSelected
                      ]}>
                        {candidatoSeleccionado?.id === candidato.id && (
                          <Text style={styles.candidateCheckmark}>✓</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.candidateProposal}>
                      <Text style={styles.proposalLabel}>Propuesta:</Text>
                      <Text style={styles.proposalText}>{candidato.propuesta}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalVoteButton,
                  (!candidatoSeleccionado || votingLoading) && styles.modalVoteButtonDisabled
                ]}
                onPress={votarPorCandidato}
                disabled={!candidatoSeleccionado || votingLoading}
              >
                <Text style={styles.modalVoteIcon}>
                  {votingLoading ? '⏳' : '🗳️'}
                </Text>
                <Text style={styles.modalVoteText}>
                  {votingLoading ? 'Registrando...' : 'Confirmar Voto'}
                </Text>
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
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0ea5e9',
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
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  electionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  electionInfo: {
    flex: 1,
    marginRight: 16,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
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

  // Vote Button
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  voteButtonActive: {
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  voteButtonDisabled: {
    backgroundColor: '#374151',
  },
  voteButtonIcon: {
    fontSize: 20,
  },
  voteButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  voteButtonTextActive: {
    color: '#ffffff',
  },
  voteButtonTextDisabled: {
    color: '#9ca3af',
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
    lineHeight: 24,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
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

  // Voting Instructions
  votingInstructions: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  instructionsIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Candidates Section
  candidatesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  candidateCard: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#475569',
  },
  candidateCardSelected: {
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  candidateId: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  candidateCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateCheckboxSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  candidateCheckmark: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  candidateProposal: {
    marginTop: 8,
  },
  proposalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  proposalText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
  },

  // Empty Candidates
  emptyCandidates: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCandidatesIcon: {
    fontSize: 48,
    marginBottom: 16,
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
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 16,
  },
  modalVoteButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0ea5e9',
    gap: 8,
  },
  modalVoteButtonDisabled: {
    backgroundColor: '#64748b',
  },
  modalVoteIcon: {
    fontSize: 18,
  },
  modalVoteText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});