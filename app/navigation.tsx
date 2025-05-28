import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
  Image
} from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import RegistrarVotante from '../screens/RegistrarVotante';
import GestionarUsuarios from '../screens/GestionarUsuarios';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CrearEleccionScreen from '../screens/CrearEleccionesScreen';
import EleccionesRegistradas from '../screens/EleccionesRegistradas';
import VerEleccionesDisponibles from '../screens/VerEleccionesDisponibles';
import VotacionesRealizadas from '../screens/VotacionesRealizadas';
import ResultadosElecciones from '../screens/ResultadosElecciones';
import EditarPerfil from '../screens/ProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';

const { height } = Dimensions.get('window');

const Stack = createStackNavigator();

function MenuPrincipal({
  navigation,
  rol,
  onLogout,
}: {
  navigation: any;
  rol: string | null;
  onLogout: () => void;
}) {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const getUserName = async () => {
      let usuarioJSON;
      if (Platform.OS === 'web') {
        usuarioJSON = localStorage.getItem('usuario');
      } else {
        usuarioJSON = await AsyncStorage.getItem('usuario');
      }
      if (usuarioJSON) {
        const usuario = JSON.parse(usuarioJSON);
        setUserName(usuario.username || 'Usuario');
      }
    };
    getUserName();
  }, []);

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'ADMIN': return '#dc2626';
      case 'VOTANTE': return '#059669';
      default: return '#64748b';
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'ADMIN': return '👑';
      case 'VOTANTE': return '🗳️';
      default: return '👤';
    }
  };

  const adminMenuItems = [
    {
      title: 'Registrar Candidato',
      subtitle: 'Agregar nuevos candidatos al sistema',
      icon: '👤',
      color: '#059669',
      screen: 'RegistrarCandidato'
    },
    {
      title: 'Registrar Votante',
      subtitle: 'Registrar nuevos votantes habilitados',
      icon: '🗳️',
      color: '#0ea5e9',
      screen: 'RegistrarVotante'
    },
    {
      title: 'Gestionar Usuarios',
      subtitle: 'Administrar usuarios del sistema',
      icon: '⚙️',
      color: '#dc2626',
      screen: 'GestionarUsuarios'
    },
    {
      title: 'Gestionar Elecciones',
      subtitle: 'Crear y configurar elecciones',
      icon: '🏛️',
      color: '#ea580c',
      screen: 'CrearEleccion'
    },
    {
      title: 'Elecciones Registradas',
      subtitle: 'Ver todas las elecciones del sistema',
      icon: '📋',
      color: '#7c3aed',
      screen: 'EleccionesRegistradas'
    }
  ];

  const voterMenuItems = [
    {
      title: 'Elecciones Disponibles',
      subtitle: 'Participar en elecciones activas',
      icon: '🗳️',
      color: '#0ea5e9',
      screen: 'VerEleccionesDisponibles'
    },
    {
      title: 'Mis Votaciones',
      subtitle: 'Historial de votaciones realizadas',
      icon: '📊',
      color: '#7c3aed',
      screen: 'VotacionesRealizadas'
    }
  ];

  const commonMenuItems = [
    {
      title: 'Resultados de Elecciones',
      subtitle: 'Consultar resultados oficiales',
      icon: '📈',
      color: '#059669',
      screen: 'ResultadosElecciones'
    }
,
    {
    title: 'Editar Perfil',
    subtitle: 'Modificar tus datos personales',
    icon: '📝',
    color: '#f59e42',
    screen: 'EditarPerfil'
  }
  ];

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.screen}
      style={[styles.menuItem, { borderLeftColor: item.color }]}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={[styles.menuItemIcon, { backgroundColor: item.color }]}>
        <Text style={styles.menuItemIconText}>{item.icon}</Text>
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.menuItemArrow}>
        <Text style={styles.menuItemArrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      {/* Background Gradient Effect */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
        <View style={styles.gradientCircle3} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
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

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Bienvenido</Text>
            <Text style={styles.userName}>{userName}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(rol) }]}>
              <Text style={styles.roleIcon}>{getRoleIcon(rol)}</Text>
              <Text style={styles.roleText}>
                {rol ? rol.toLowerCase() : 'invitado'}
              </Text>
            </View>
          </View>

          <View style={styles.systemInfo}>
            <Text style={styles.systemTitle}>Sistema de Votación</Text>
            <Text style={styles.systemSubtitle}>Universidad Santo Tomás - Sede Tunja</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {/* Admin Menu */}
          {rol === 'ADMIN' && (
            <View style={styles.menuSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>👑</Text>
                <Text style={styles.sectionTitle}>Panel de Administración</Text>
              </View>
              <View style={styles.menuGrid}>
                {adminMenuItems.map(renderMenuItem)}
              </View>
            </View>
          )}

          {/* Voter Menu */}
          {rol === 'VOTANTE' && (
            <View style={styles.menuSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🗳️</Text>
                <Text style={styles.sectionTitle}>Portal del Votante</Text>
              </View>
              <View style={styles.menuGrid}>
                {voterMenuItems.map(renderMenuItem)}
              </View>
            </View>
          )}

          {/* Common Menu */}
          <View style={styles.menuSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📊</Text>
              <Text style={styles.sectionTitle}>Información Pública</Text>
            </View>
            <View style={styles.menuGrid}>
              {commonMenuItems.map(renderMenuItem)}
            </View>
          </View>

          {/* System Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Estado del Sistema</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🏛️</Text>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Elecciones</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={styles.statNumber}>150</Text>
                <Text style={styles.statLabel}>Usuarios</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Disponibilidad</Text>
              </View>
            </View>
          </View>

          {/* Logout Section */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Universidad Santo Tomás
          </Text>
          <Text style={styles.footerVersion}>Sistema Electoral v2.0.1</Text>
        </View>

        {/* Quita esto en producción, solo es para probar el scroll */}
        {/* <View style={{ height: 600 }} /> */}
      </ScrollView>
    </View>
  );
}

export default function Navigation({ onLogout }: { onLogout: () => void }) {
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    const obtenerRol = async () => {
      let usuarioJSON;

      if (Platform.OS === 'web') {
        usuarioJSON = localStorage.getItem('usuario');
      } else {
        usuarioJSON = await AsyncStorage.getItem('usuario');
      }

      if (usuarioJSON) {
        const usuario = JSON.parse(usuarioJSON);
        setRol(usuario.role);
      }
    };

    obtenerRol();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MenuPrincipal"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1e293b',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        <Stack.Screen
          name="MenuPrincipal"
          options={{
            title: 'Panel Principal',
            headerShown: false
          }}
        >
          {(props) => <MenuPrincipal {...props} rol={rol} onLogout={onLogout} />}
        </Stack.Screen>

        {/* Admin Screens */}
        {rol === 'ADMIN' && (
          <>
            <Stack.Screen
              name="Inicio"
              component={HomeScreen}
              options={{ title: 'Panel de Control' }}
            />
            <Stack.Screen
              name="RegistrarCandidato"
              component={UserManagementScreen}
              options={{ title: 'Registrar Candidato' }}
            />
            <Stack.Screen
              name="RegistrarVotante"
              component={RegistrarVotante}
              options={{ title: 'Registrar Votante' }}
            />
            <Stack.Screen
              name="GestionarUsuarios"
              component={GestionarUsuarios}
              options={{ title: 'Gestionar Usuarios' }}
            />
            <Stack.Screen
              name="CrearEleccion"
              component={CrearEleccionScreen}
              options={{ title: 'Gestionar Elecciones' }}
            />
            <Stack.Screen
              name="EleccionesRegistradas"
              component={EleccionesRegistradas}
              options={{ title: 'Elecciones Registradas' }}
            />
          </>
        )}

        {/* Voter Screens */}
        {rol === 'VOTANTE' && (
          <>
            <Stack.Screen
              name="VerEleccionesDisponibles"
              component={VerEleccionesDisponibles}
              options={{ title: 'Elecciones Disponibles' }}
            />
            <Stack.Screen
              name="VotacionesRealizadas"
              component={VotacionesRealizadas}
              options={{ title: 'Mis Votaciones' }}
            />
          </>
        )}

   

        {/* Common Screens */}
        <Stack.Screen
          name="ResultadosElecciones"
          component={ResultadosElecciones}
          options={{ title: 'Resultados Elecciones' }}
        />
        <Stack.Screen
          name="EditarPerfil"
          component={ProfileScreen}
          options={{ title: 'Editar Perfil' }}
        />

   

        
      </Stack.Navigator>

    
      
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
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
    top: height * 0.4,
    right: -200,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(234, 88, 12, 0.06)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    minHeight: height + 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 58,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    zIndex: -1,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  roleIcon: {
    fontSize: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  systemInfo: {
    alignItems: 'center',
  },
  systemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  systemSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  menuGrid: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemIconText: {
    fontSize: 20,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  menuItemArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemArrowText: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: '300',
  },
  statsSection: {
    marginBottom: 32,
  },
  statsHeader: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
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
  logoutSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
});