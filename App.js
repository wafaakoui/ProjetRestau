"use client"

import React, { createContext, useEffect, useState } from "react"
import { View, Text, ActivityIndicator, Alert } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { styles } from "./src/styles/AppStyles"
import { initSocket } from "./src/services/socket" // Import socket initialization

// Import all screen components
import RestaurantAuth from "./src/screens/RestaurantAuth"
import Login from "./src/screens/Login"
import StaffHome from "./src/screens/StaffHome"
import UserManagement from "./src/screens/UserManagement"
import Station from "./src/screens/Station"
import MenuManagement from "./src/screens/MenuManagement"
import ResetPassword from "./src/screens/ResetPassword"
import OrderView from "./src/screens/OrderView"
import AddProductScreen from "./src/screens/AddProductScreen"
import ExpediteurView from "./src/screens/ExpediteurView"
import MenuExpediteur from "./src/screens/MenuExpediteur"
import AddProductExpediteur from "./src/screens/AddProductExpediteur"
import UserExpediteur from "./src/screens/UserExpediteur"
import StationExpediteur from "./src/screens/StationExpediteur"
import Dashboard from "./src/screens/Dashboard"

const Stack = createStackNavigator()
export const AuthContext = createContext()

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.appContainer}>
          <Text style={styles.appTitle}>Erreur</Text>
          <Text style={{ color: "red", textAlign: "center" }}>
            Une erreur est survenue: {this.state.error?.message || "Unknown error"}
          </Text>
        </View>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    role: null,
    storeId: null,
  })
  const [loading, setLoading] = useState(true)
  const [initialRoute, setInitialRoute] = useState("RestaurantAuth")

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize socket at app start
        await initSocket()

        // Check authentication status
        const token = await AsyncStorage.getItem("userToken")
        const role = await AsyncStorage.getItem("userRole")
        const storeId = await AsyncStorage.getItem("selectedStoreId")

        if (token && role && storeId) {
          setAuthState({ token, role: role.toLowerCase(), user: null, storeId })
          if (role.toLowerCase() === "owner") {
            setInitialRoute("Dashboard") // Changé pour démarrer sur le Dashboard
          } else if (role.toLowerCase() === "staff") {
            setInitialRoute("StaffHome")
          } else if (role.toLowerCase() === "expediteur") {
            setInitialRoute("ExpediteurView")
          } else {
            setInitialRoute("RestaurantAuth")
          }
        } else {
          setAuthState({ token: null, role: null, user: null, storeId: null })
          setInitialRoute("RestaurantAuth")
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation de l'application:", error)
        Alert.alert("Erreur", "Une erreur est survenue lors de l'initialisation de l'application.")
        setAuthState({ token: null, role: null, user: null, storeId: null })
        setInitialRoute("RestaurantAuth")
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (loading) {
    return (
      <View style={styles.appContainer}>
        <Text style={styles.appTitle}>EatOrder KDS</Text>
        <ActivityIndicator size="large" color="#E73E01" />
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ authState, setAuthState }}>
        <View style={styles.appContainer}>
          <Text style={styles.appTitle}>EatOrder KDS</Text>
          <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
              <Stack.Screen name="RestaurantAuth" component={RestaurantAuth} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="ResetPassword" component={ResetPassword} />
              <Stack.Screen name="UserManagement" component={UserManagement} />
              <Stack.Screen name="Station" component={Station} />
              <Stack.Screen name="MenuManagement" component={MenuManagement} />
              <Stack.Screen name="AddProductScreen" component={AddProductScreen} />
              <Stack.Screen name="StaffHome" component={StaffHome} />
              <Stack.Screen name="OrderView" component={OrderView} />
              <Stack.Screen name="ExpediteurView" component={ExpediteurView} />
              <Stack.Screen name="MenuExpediteur" component={MenuExpediteur} />
              <Stack.Screen name="AddProductExpediteur" component={AddProductExpediteur} />
              <Stack.Screen name="UserExpediteur" component={UserExpediteur} />
              <Stack.Screen name="StationExpediteur" component={StationExpediteur} />
              <Stack.Screen name="Dashboard" component={Dashboard} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </AuthContext.Provider>
    </ErrorBoundary>
  )
}
