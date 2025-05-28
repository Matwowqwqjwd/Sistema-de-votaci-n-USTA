"use client"

import { View, Text, StyleSheet, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useState, useEffect } from "react"
import { LinearGradient } from "expo-linear-gradient"

// Simulación de obtención de rol (puedes reemplazarlo por tu lógica real)
const getUserRole = async () => {
  return "admin"
}

export default function HomeScreen() {
  const navigation = useNavigation()
  const [rol, setRol] = useState<string>("")

  useEffect(() => {
    getUserRole().then(setRol)
  }, [])

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#17468c", "#3b6fb3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Image
          source={require("../assets/images.jpg")} // Cambia por tu logo
          style={styles.logo}
        />
        <Text style={styles.title}>Panel de Control</Text>
        <Text style={styles.subtitle}>Sistema de Votación - USTA Tunja</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bienvenido 👋</Text>
        <Text style={styles.cardText}>Accede a las funciones de acuerdo a tu rol.</Text>
        <View style={styles.rolContainer}>
          <Text style={styles.rolLabel}>Rol:</Text>
          <Text style={styles.rolValue}>{rol}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Aquí puedes agregar botones o menú del dashboard */}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8ff",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: 280,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#ffffffcc",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
    textShadowColor: "#00000033",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#e0ecff",
    marginTop: 4,
    opacity: 0.95,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 28,
    marginTop: -40,
    elevation: 8,
    shadowColor: "#17468c",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#17468c",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 16,
    color: "#5a6b80",
    marginBottom: 12,
    textAlign: "center",
  },
  rolContainer: {
    flexDirection: "row",
    backgroundColor: "#eaf0fa",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  rolLabel: {
    fontSize: 16,
    color: "#17468c",
    marginRight: 6,
    fontWeight: "500",
  },
  rolValue: {
    fontSize: 16,
    color: "#17468c",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
})
3