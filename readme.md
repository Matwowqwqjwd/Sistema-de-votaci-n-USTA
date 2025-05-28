# Paso a paso para crear el proyecto:



# Crea el proyecto con TypeScript
npx create-expo-app mi-proyecto-expo-ts -t expo-template-blank-typescript
# Esto va a crear una carpeta llamada mi-proyecto-expo-ts con TypeScript preconfigurado.

# abrir el proyecto en la terminal VSCode
cd mi-proyecto-expo-ts

# Ejecutar el proyecto
npm start

# archivos iniciales del proyecto
mi-proyecto-expo-ts/
├── App.tsx               ← Archivo principal de la app
├── tsconfig.json         ← Configuración de TypeScript
├── app.json              ← Configuración del proyecto Expo
├── assets/               ← Imágenes y recursos estáticos
└── ...


# resumen de la estructura del proyecto:
mi-proyecto-expo-ts/
├── App.tsx
├── app/                   ← Navegación (React Navigation)
│   └── navigation.tsx
├── components/            ← Componentes reutilizables
│   └── Header.tsx
├── constants/             ← Constantes como colores, textos, rutas
│   └── colors.ts
├── hooks/                 ← Hooks personalizados (custom hooks)
│   └── useCounter.ts
├── screens/               ← Vistas o pantallas
│   ├── HomeScreen.tsx
│   └── ProductScreen.tsx
├── assets/                ← Imágenes, fuentes, sonidos
├── tsconfig.json
├── package.json
├── app.json


# estructura formal del proyecto
MI-PROYECTO-EXPO-TS/
│
├── .expo/                        # Archivos internos de Expo (ocultos por defecto)
├── app/
│   ├── navigation.tsx           # Archivo para configurar la navegación (React Navigation)
│   ├── assets/                  # Carpeta para imágenes, íconos, etc.
│   ├── constants/               # Constantes reutilizables (colores, estilos, etc.)
│   ├── node_modules/            # Módulos instalados con npm
│   └── screens/                 # Pantallas de la aplicación
│       ├── HomeScreen.tsx       # Pantalla de inicio
│       ├── InventoryScreen.tsx  # Pantalla para el inventario
│       ├── ProductScreen.tsx    # Pantalla para productos
│       ├── ProfileScreen.tsx    # Pantalla de perfil de usuario
│
├── .gitignore                   # Archivos y carpetas a ignorar por Git
├── app.json                     # Configuración general del proyecto Expo
├── App.tsx                      # Componente raíz de la aplicación
├── index.ts                     # Punto de entrada principal
├── package-lock.json            # Versión exacta de dependencias instaladas
├── package.json                 # Dependencias y scripts del proyecto
├── readme.md                    # Documentación del proyecto
└── tsconfig.json                # Configuración del compilador TypeScript



# Configurar la navegación (React Navigation)
npx expo install @react-navigation/native
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-navigation/native-stack

# Bottom Tab Navigation CON EXPO Y TYPESCRIPT (menú inferior con pestañas o componente Header)
npx expo install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

#  instalar íconos
npx expo install @expo/vector-icons


