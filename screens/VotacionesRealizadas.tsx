import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Dimensions,
  ScrollView 
} from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function VotacionesRealizadas() {
  const [votos, setVotos] = useState<any[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Traer votos realizados por el usuario
  useEffect(() => {
    const fetchVotos = async () => {
      if (!userId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('votos')
        .select(`
          id,
          createdat,
          eleccionid,
          candidaturaid,
          eleccions (
            nombre,
            descripcion
          ),
          candidaturas (
            propuesta,
            users (
              username,
              identificacion
            )
          )
        `)
        .eq('userid', userId)
        .order('createdat', { ascending: false });
      if (!error) setVotos(data || []);
      setLoading(false);
    };
    fetchVotos();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getVoteNumber = (index: number) => {
    return votos.length - index;
  };

  const renderVoteCard = ({ item, index }: { item: any; index: number }) => {
    const formattedDate = formatDate(item.createdat);
    const voteNumber = getVoteNumber(index);

    return (
      <View style={styles.voteCard}>
        {/* Vote Header */}
        <View style={styles.voteHeader}>
          <View style={styles.voteNumberContainer}>
            <Text style={styles.voteNumberIcon}>🗳️</Text>
            <Text style={styles.voteNumber}>#{voteNumber}</Text>
          </View>
          <View style={styles.voteDateContainer}>
            <Text style={styles.voteDate}>{formattedDate.date}</Text>
            <Text style={styles.voteTime}>{formattedDate.time}</Text>
          </View>
        </View>

        {/* Election Information */}
        <View style={styles.electionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏛️</Text>
            <Text style={styles.sectionTitle}>Elección</Text>
          </View>
          <View style={styles.electionInfo}>
            <Text style={styles.electionName}>{item.eleccions?.nombre}</Text>
            <Text style={styles.electionDescription}>
              {item.eleccions?.descripcion}
            </Text>
          </View>
        </View>

        {/* Candidate Information */}
        <View style={styles.candidateSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>Candidato Seleccionado</Text>
          </View>
          <View style={styles.candidateInfo}>
            <View style={styles.candidateHeader}>
              <Text style={styles.candidateName}>
                {item.candidaturas?.users?.username}
              </Text>
              <View style={styles.candidateIdBadge}>
                <Text style={styles.candidateId}>
                  {item.candidaturas?.users?.identificacion}
                </Text>
              </View>
            </View>
            <View style={styles.proposalContainer}>
              <Text style={styles.proposalLabel}>Propuesta:</Text>
              <Text style={styles.proposalText}>
                {item.candidaturas?.propuesta}
              </Text>
            </View>
          </View>
        </View>

        {/* Vote Confirmation */}
        <View style={styles.confirmationSection}>
          <View style={styles.confirmationBadge}>
            <Text style={styles.confirmationIcon}>✅</Text>
            <Text style={styles.confirmationText}>Voto Registrado</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>📊</Text>
        </View>
        <Text style={styles.title}>Historial de Votaciones</Text>
        <Text style={styles.subtitle}>
          Consulta todas las votaciones que has realizado
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{votos.length}</Text>
          <Text style={styles.statLabel}>Votos Realizados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {new Set(votos.map(v => v.eleccionid)).size}
          </Text>
          <Text style={styles.statLabel}>Elecciones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>Participación</Text>
        </View>
      </View>

      {/* Votes List */}
      <FlatList
        data={votos}
        keyExtractor={item => item.id.toString()}
        renderItem={renderVoteCard}
        refreshing={loading}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗳️</Text>
            <Text style={styles.emptyTitle}>No has realizado votos</Text>
            <Text style={styles.emptyMessage}>
              Cuando participes en elecciones, tu historial aparecerá aquí
            </Text>
          </View>
        }
      />
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

  // Vote Card Styles
  voteCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },

  // Vote Header
  voteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  voteNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  voteNumberIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  voteNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  voteDateContainer: {
    alignItems: 'flex-end',
  },
  voteDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  voteTime: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Section Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
  },

  // Election Section
  electionSection: {
    marginBottom: 20,
  },
  electionInfo: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  electionName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  electionDescription: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 22,
  },

  // Candidate Section
  candidateSection: {
    marginBottom: 20,
  },
  candidateInfo: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  candidateIdBadge: {
    backgroundColor: '#7c3aed',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  candidateId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  proposalContainer: {
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

  // Confirmation Section
  confirmationSection: {
    alignItems: 'center',
  },
  confirmationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  confirmationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  confirmationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
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
    paddingHorizontal: 20,
  },
});