import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Dimensions, 
  ScrollView,
  TouchableOpacity 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const chartColors = ['#4f46e5', '#059669', '#ea580c', '#dc2626', '#7c3aed', '#0ea5e9', '#f59e0b'];

export default function ResultadosElecciones() {
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    const fetchResultados = async () => {
      setLoading(true);
      // Traer todas las elecciones
      const { data: elecciones, error: errorElecciones } = await supabase
        .from('eleccions')
        .select('id, nombre, descripcion, estado')
        .order('fecha_inicio', { ascending: false });

      if (errorElecciones || !elecciones) {
        setResultados([]);
        setLoading(false);
        return;
      }

      // Para cada elección, traer sus candidatos y contar votos
      const resultadosConVotos = await Promise.all(
        elecciones.map(async (eleccion: any) => {
          // Traer candidatos de la elección
          const { data: candidatos } = await supabase
            .from('candidaturas')
            .select('id, propuesta, users(username, identificacion)')
            .eq('eleccionid', eleccion.id);

          // Para cada candidato, contar votos
          const candidatosConVotos = await Promise.all(
            (candidatos || []).map(async (candidato: any) => {
              const { count } = await supabase
                .from('votos')
                .select('id', { count: 'exact', head: true })
                .eq('candidaturaid', candidato.id);
              return {
                ...candidato,
                votos: count || 0,
              };
            })
          );

          // Calcular total de votos
          const totalVotos = candidatosConVotos.reduce((sum, c) => sum + c.votos, 0);

          return {
            ...eleccion,
            candidatos: candidatosConVotos,
            totalVotos,
          };
        })
      );

      setResultados(resultadosConVotos);
      setLoading(false);
    };

    fetchResultados();
  }, []);

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

  const getWinner = (candidatos: any[]) => {
    if (candidatos.length === 0) return null;
    return candidatos.reduce((prev, current) => 
      (prev.votos > current.votos) ? prev : current
    );
  };

  const renderElectionCard = ({ item }: { item: any }) => {
    const winner = getWinner(item.candidatos);
    const hasVotes = item.totalVotos > 0;

    // Datos para los gráficos
    const barData = {
      labels: item.candidatos.map((c: any) => 
        c.users?.username?.substring(0, 8) + '...' || 'Sin nombre'
      ),
      datasets: [
        {
          data: item.candidatos.map((c: any) => c.votos),
        },
      ],
    };

    const pieData = item.candidatos.map((c: any, idx: number) => ({
      name: c.users?.username || 'Sin nombre',
      votos: c.votos,
      color: chartColors[idx % chartColors.length],
      legendFontColor: '#e2e8f0',
      legendFontSize: 12,
    }));

    return (
      <View style={styles.electionCard}>
        {/* Election Header */}
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

        {/* Election Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.candidatos.length}</Text>
            <Text style={styles.statLabel}>Candidatos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.totalVotos}</Text>
            <Text style={styles.statLabel}>Total Votos</Text>
          </View>
          {winner && (
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>🏆</Text>
              <Text style={styles.statLabel}>Ganador</Text>
            </View>
          )}
        </View>

        {/* Winner Section */}
        {winner && hasVotes && (
          <View style={styles.winnerSection}>
            <View style={styles.winnerCard}>
              <View style={styles.winnerIcon}>
                <Text style={styles.winnerIconText}>👑</Text>
              </View>
              <View style={styles.winnerInfo}>
                <Text style={styles.winnerTitle}>Candidato Ganador</Text>
                <Text style={styles.winnerName}>
                  {winner.users?.username} ({winner.users?.identificacion})
                </Text>
                <Text style={styles.winnerVotes}>{winner.votos} votos</Text>
              </View>
            </View>
          </View>
        )}

        {/* Candidates List */}
        <View style={styles.candidatesSection}>
          <Text style={styles.sectionTitle}>Resultados por Candidato</Text>
          
          {item.candidatos.length === 0 ? (
            <View style={styles.emptyCandidates}>
              <Text style={styles.emptyCandidatesIcon}>👤</Text>
              <Text style={styles.emptyCandidatesText}>No hay candidatos registrados</Text>
            </View>
          ) : (
            item.candidatos
              .sort((a: any, b: any) => b.votos - a.votos)
              .map((candidato: any, index: number) => (
                <View key={candidato.id} style={styles.candidateCard}>
                  <View style={styles.candidateRank}>
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  </View>
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>
                      {candidato.users?.username} ({candidato.users?.identificacion})
                    </Text>
                    <Text style={styles.candidateProposal}>{candidato.propuesta}</Text>
                  </View>
                  <View style={styles.candidateVotes}>
                    <Text style={styles.votesNumber}>{candidato.votos}</Text>
                    <Text style={styles.votesLabel}>votos</Text>
                    {item.totalVotos > 0 && (
                      <Text style={styles.votesPercentage}>
                        {((candidato.votos / item.totalVotos) * 100).toFixed(1)}%
                      </Text>
                    )}
                  </View>
                </View>
              ))
          )}
        </View>

        {/* Charts Section */}
        {item.candidatos.length > 0 && hasVotes && (
          <View style={styles.chartsSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>Visualización de Resultados</Text>
              <View style={styles.chartToggle}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    selectedView === 'bar' ? styles.toggleButtonActive : styles.toggleButtonInactive
                  ]}
                  onPress={() => setSelectedView('bar')}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    selectedView === 'bar' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
                  ]}>
                    📊 Barras
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    selectedView === 'pie' ? styles.toggleButtonActive : styles.toggleButtonInactive
                  ]}
                  onPress={() => setSelectedView('pie')}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    selectedView === 'pie' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
                  ]}>
                    🥧 Circular
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.chartContainer}>
              {selectedView === 'bar' ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={barData}
                    width={Math.max(width - 80, 80 * item.candidatos.length)}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#1e293b',
                      backgroundGradientFrom: '#1e293b',
                      backgroundGradientTo: '#334155',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                      labelColor: () => '#e2e8f0',
                      style: { borderRadius: 12 },
                      propsForLabels: {
                        fontSize: 12,
                      },
                    }}
                    style={styles.chart}
                    fromZero
                    showValuesOnTopOfBars
                  />
                </ScrollView>
              ) : (
                <PieChart
                  data={pieData}
                  width={width - 80}
                  height={200}
                  chartConfig={{
                    color: () => '#e2e8f0',
                  }}
                  accessor="votos"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              )}
            </View>
          </View>
        )}

        {/* No Votes Message */}
        {item.candidatos.length > 0 && !hasVotes && (
          <View style={styles.noVotesSection}>
            <Text style={styles.noVotesIcon}>🗳️</Text>
            <Text style={styles.noVotesTitle}>Sin votos registrados</Text>
            <Text style={styles.noVotesMessage}>
              Esta elección aún no tiene votos registrados
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>📈</Text>
        </View>
        <Text style={styles.title}>Resultados de Elecciones</Text>
        <Text style={styles.subtitle}>
          Consulta los resultados oficiales de todas las elecciones
        </Text>
      </View>

      {/* Results List */}
      <FlatList
        data={resultados}
        keyExtractor={item => item.id.toString()}
        renderItem={renderElectionCard}
        refreshing={loading}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No hay resultados</Text>
            <Text style={styles.emptyMessage}>
              No se han registrado elecciones con resultados aún
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
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#059669',
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
    marginBottom: 20,
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
    fontSize: 22,
    fontWeight: '800',
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
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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

  // Winner Section
  winnerSection: {
    marginBottom: 24,
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 16,
    padding: 20,
  },
  winnerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  winnerIconText: {
    fontSize: 28,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  winnerVotes: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },

  // Candidates Section
  candidatesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  candidateRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  candidateProposal: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  candidateVotes: {
    alignItems: 'flex-end',
  },
  votesNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  votesLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  votesPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4f46e5',
    marginTop: 4,
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

  // Charts Section
  chartsSection: {
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#4f46e5',
  },
  toggleButtonInactive: {
    backgroundColor: 'transparent',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  toggleButtonTextInactive: {
    color: '#94a3b8',
  },
  chartContainer: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },

  // No Votes Section
  noVotesSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#334155',
    borderRadius: 16,
  },
  noVotesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noVotesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  noVotesMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
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
});