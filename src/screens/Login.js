import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { styles } from '../styles/AppStyles';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import io from 'socket.io-client';

// Server URLs
const SERVER_URL = 'https://server.eatorder.fr:8000';
const LOCAL_SERVER_URL = Platform.OS === 'android' && !Platform.isPad ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const STORAGE_KEYS = {
  SELECTED_STORE_ID: 'selectedStoreId',
  LAST_EMAIL: 'lastEmail',
  USER_TOKEN: 'userToken',
  USER_ROLE: 'userRole',
  USER_ID: 'userId',
  SELECTED_SERVER: 'selectedServer',
};

const STORE_IDS = [
  '6787a808bf529e8ce963a350',
  '67d7fd4a1dca285cd9d0b38d',
  '67e13a9c0ce924cc4a0e0dae',
  '67e13ae10ce924cc4a0e0e0a',
];

const USER_STORE_MAPPING = {
  'user1': ['6787a808bf529e8ce963a350', '67d7fd4a1dca285cd9d0b38d'],
  'user2': ['67e13a9c0ce924cc4a0e0dae', '67e13ae10ce924cc4a0e0e0a'],
  'manager1': ['6787a808bf529e8ce963a350', '67d7fd4a1dca285cd9d0b38d', '67e13a9c0ce924cc4a0e0dae', '67e13ae10ce924cc4a0e0e0a'],
};

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState([]);
  const [userStores, setUserStores] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStores, setIsFetchingStores] = useState(false);

  const fetchStoreNames = async () => {
    setIsFetchingStores(true);
    try {
      const storePromises = STORE_IDS.map((storeId) =>
        axios.get(`${SERVER_URL}/client/store/${storeId}`)
          .then(res => ({ id: storeId, name: res.data.name || `Store ${storeId}` }))
          .catch(() => ({ id: storeId, name: `Store ${storeId}` }))
      );
      const storeData = await Promise.all(storePromises);
      setStores(storeData);
      setUserStores(storeData);
    } catch (err) {
      console.error('Error fetching stores:', err);
      Alert.alert('Erreur', 'Impossible de charger les magasins.');
    } finally {
      setIsFetchingStores(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.LAST_EMAIL);
        const savedStoreId = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_STORE_ID);
        if (savedEmail) setEmail(savedEmail);
        if (savedStoreId && STORE_IDS.includes(savedStoreId)) setSelectedStore(savedStoreId);
        await fetchStoreNames();
      } catch (err) {
        console.error('Error loading user data:', err);
        Alert.alert('Erreur', 'Impossible de charger les données utilisateur.');
      }
    };
    loadUserData();
  }, []);

  const validateInputs = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email requis.';
    if (!password.trim()) errs.password = 'Mot de passe requis.';
    else if (password.length < 6) errs.password = '6 caractères min.';
    if (!selectedStore) errs.store = 'Sélectionner un magasin.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      let user, token, serverUrl;

      // Try local server for Staff and Expéditeur
      try {
        console.log('Attempting login on local server:', LOCAL_SERVER_URL);
        const response = await axios.post(`${LOCAL_SERVER_URL}/api/login`, { email, password });
        if (!response.data || !response.data.user || !response.data.token) {
          throw new Error('Invalid response structure from local server');
        }
        user = response.data.user;
        token = response.data.token;
        serverUrl = LOCAL_SERVER_URL;
        console.log('Local server login successful:', user);
      } catch (localError) {
        console.log('Local server login failed:', localError.message);
        if (localError.response?.status === 401) {
          console.log('401 Unauthorized: Invalid credentials on local server');
          // Try eatorder server for Owner
          try {
            console.log('Attempting login on eatorder server:', SERVER_URL);
            const response = await axios.post(`${SERVER_URL}/manager/login-`, { email, password });
            if (!response.data || !response.data.user || !response.data.token) {
              throw new Error('Invalid response structure from eatorder server');
            }
            user = response.data.user;
            token = response.data.token;
            serverUrl = SERVER_URL;
            console.log('Eatorder server login successful:', user);
          } catch (eatorderError) {
            console.error('Eatorder server login failed:', eatorderError.message);
            if (eatorderError.response?.status === 404) {
              throw new Error('Endpoint de connexion eatorder non trouvé. Vérifiez l\'URL du serveur.');
            } else if (eatorderError.response?.status === 401) {
              throw new Error('Identifiants invalides pour le rôle Owner.');
            }
            throw new Error(
              eatorderError.response?.data?.message ||
              eatorderError.message ||
              'Échec de la connexion aux deux serveurs.'
            );
          }
        } else {
          throw new Error(
            localError.response?.data?.message ||
            localError.message ||
            'Échec de la connexion au serveur local.'
          );
        }
      }

      const userId = user._id;
      const userRole = user.role.toLowerCase().replace('é', 'e'); // Normalize role (e.g., expéditeur -> expediteur)

      // Validate store access
      const allowedStores = USER_STORE_MAPPING[userId] || stores.map(s => s.id);
      if (!allowedStores.includes(selectedStore)) {
        throw new Error('Magasin non autorisé.');
      }

      // Store user data and server URL
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_TOKEN, token],
        [STORAGE_KEYS.USER_ROLE, user.role],
        [STORAGE_KEYS.USER_ID, userId],
        [STORAGE_KEYS.SELECTED_STORE_ID, selectedStore],
        [STORAGE_KEYS.LAST_EMAIL, email],
        [STORAGE_KEYS.SELECTED_SERVER, serverUrl],
      ]);

      // Initialize WebSocket connection
      const socket = io(serverUrl, {
        transports: ['websocket'],
        query: { storeId: selectedStore, userId },
        auth: { token },
      });
      socket.on('connect', () => {
        console.log('Socket connecté:', socket.id);
      });
      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      const storeName = stores.find(s => s.id === selectedStore)?.name || 'Unknown Store';

      // Navigate based on role
      if (userRole === 'owner' || email === 'testing-store@eatorder.fr') {
        Alert.alert('Bienvenue', `${user.name} (Owner) - ${storeName}`);
        navigation.replace('OrderView', { storeId: selectedStore });
      } else if (userRole === 'staff') {
        Alert.alert('Bienvenue', `${user.name} (Staff) - ${storeName}`);
        navigation.replace('StaffHome', {
          chefId: userId,
          storeId: selectedStore,
        });
      } else if (userRole === 'expediteur') {
        Alert.alert('Bienvenue', `${user.name} (Expéditeur) - ${storeName}`);
        navigation.replace('ExpediteurView', { storeId: selectedStore });
      } else {
        throw new Error('Rôle non supporté.');
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Erreur', err.message || 'Connexion impossible. Vérifiez vos identifiants ou la connexion serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loginTitle}>Connexion</Text>
      <Text style={styles.restaurantSubtitle}>Restaurant: company-demo</Text>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Magasin:</Text>
        <View style={[styles.input, errors.store && { borderColor: 'red' }]}>
          <Picker
            selectedValue={selectedStore}
            onValueChange={(val) => setSelectedStore(val)}
            style={{ height: 50 }}
            enabled={!isFetchingStores}
          >
            <Picker.Item label="Choisir un magasin" value="" />
            {userStores.map(store => (
              <Picker.Item key={store.id} label={store.name} value={store.id} />
            ))}
          </Picker>
        </View>
        {errors.store && <Text style={styles.errorText}>{errors.store}</Text>}
        {isFetchingStores && <ActivityIndicator color="#E50914" />}
      </View>

      <TextInput
        style={[styles.input, errors.email && { borderColor: 'red' }]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, errors.password && { borderColor: 'red' }]}
          placeholder="Mot de passe"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#E50914" />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
        <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;