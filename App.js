import React, { createContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { styles } from './src/styles/AppStyles';

import RestaurantAuth from './src/screens/RestaurantAuth';
import Login from './src/screens/Login';
import StaffHome from './src/screens/StaffHome';
import UserManagement from './src/screens/UserManagement';
import CategoryAssignment from './src/screens/CategoryAssignment';
import MenuManagement from './src/screens/MenuManagement';
import ResetPassword from './src/screens/ResetPassword';
import OrderView from './src/screens/OrderView';
import AddProductScreen from './src/screens/AddProductScreen';

const Stack = createStackNavigator();
export const AuthContext = createContext();

export default function App() {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    role: null,
    storeId: null,
  });
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('RestaurantAuth');

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');
        const storeId = await AsyncStorage.getItem('selectedStoreId');

        if (token && role && storeId) {
          setAuthState({ token, role: role.toLowerCase(), user: null, storeId });
          setInitialRoute(role.toLowerCase() === 'manager' ? 'OrderView' : 'StaffHome');
        } else {
          // Si l'utilisateur n'est pas authentifié ou aucun magasin n'est sélectionné, rediriger vers RestaurantAuth
          setAuthState({ token: null, role: null, user: null, storeId: null });
          setInitialRoute('RestaurantAuth');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        Alert.alert('Erreur', 'Une erreur est survenue lors de la vérification de votre session.');
        setAuthState({ token: null, role: null, user: null, storeId: null });
        setInitialRoute('RestaurantAuth');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (loading) {
    return (
      <View style={styles.appContainer}>
        <Text style={styles.appTitle}>EatOrder KDS</Text>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ authState, setAuthState }}>
      <View style={styles.appContainer}>
        <Text style={styles.appTitle}>EatOrder KDS</Text>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RestaurantAuth" component={RestaurantAuth} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
            <Stack.Screen name="UserManagement" component={UserManagement} />
            <Stack.Screen name="CategoryAssignment" component={CategoryAssignment} />
            <Stack.Screen name="MenuManagement" component={MenuManagement} />
            <Stack.Screen name="AddProductScreen" component={AddProductScreen} />
            <Stack.Screen name="StaffHome" component={StaffHome} />
            <Stack.Screen name="OrderView" component={OrderView} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </AuthContext.Provider>
  );
}