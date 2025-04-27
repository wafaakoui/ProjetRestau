import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { styles } from '../styles/AppStyles';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { restaurantAuth } from '../services/AuthService';

const API_URL = 'https://server.eatorder.fr:8000';
const STORAGE_KEYS = {
  SELECTED_STORE_ID: 'selectedStoreId',
  LAST_EMAIL: 'lastEmail',
  USER_TOKEN: 'userToken',
  USER_ROLE: 'userRole',
  USER_ID: 'userId',
};

// Hardcoded store IDs
const STORE_IDS = [
  '6787a808bf529e8ce963a350',
  '67d7fd4a1dca285cd9d0b38d',
  '67e13a9c0ce924cc4a0e0dae',
  '67e13ae10ce924cc4a0e0e0a',
];

// User-store mapping (replace with actual user IDs and authorized stores)
const USER_STORE_MAPPING = {
  'user1': ['6787a808bf529e8ce963a350', '67d7fd4a1dca285cd9d0b38d'],
  'user2': ['67e13a9c0ce924cc4a0e0dae', '67e13ae10ce924cc4a0e0e0a'],
  'manager1': ['6787a808bf529e8ce963a350', '67d7fd4a1dca285cd9d0b38d', '67e13a9c0ce924cc4a0e0dae', '67e13ae10ce924cc4a0e0e0a'],
  // Add actual user IDs here
};

const Login = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const restaurantName =  'company-demo';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState([]);
  const [userStores, setUserStores] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStores, setIsFetchingStores] = useState(false);

  // Fetch store names from server
  const fetchStoreNames = async () => {
    setIsFetchingStores(true);
    try {
      const storeDetailsPromises = STORE_IDS.map((storeId) =>
        axios.get(`${API_URL}/client/store/${storeId}`, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000, // Increased timeout to 10 seconds
        }).then((response) => {
          console.log(`Succès pour magasin ${storeId}:`, response.data);
          return {
            id: storeId,
            name: response.data.name || `Store ${storeId}`,
          };
        }).catch((error) => {
          console.error(`Erreur lors de la récupération du magasin ${storeId}:`, error.message);
          return { id: storeId, name: `Store ${storeId}` }; // Fallback name
        })
      );
      const storeData = await Promise.all(storeDetailsPromises);
      const validStores = storeData.filter((store) => store.name !== `Store ${store.id}`); // Optional: filter out failed fetches
      setStores(storeData);
      setUserStores(storeData); // Initially set to all stores
    } catch (error) {
      console.error('Erreur lors de la récupération des magasins:', error);
      Alert.alert('Erreur', 'Impossible de charger les noms des magasins. Utilisation des noms par défaut.');
      const fallbackStores = STORE_IDS.map((id) => ({ id, name: `Store ${id}` }));
      setStores(fallbackStores);
      setUserStores(fallbackStores);
    } finally {
      setIsFetchingStores(false);
    }
  };

  // Load user data and fetch stores on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load saved email
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.LAST_EMAIL);
        if (savedEmail) setEmail(savedEmail);

        // Load previously selected store
        const savedStoreId = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_STORE_ID);
        if (savedStoreId && STORE_IDS.includes(savedStoreId)) {
          setSelectedStore(savedStoreId);
        }

        // Fetch store names
        await fetchStoreNames();
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        Alert.alert('Erreur', 'Impossible de charger les données initiales.');
      }
    };
    loadUserData();
  }, []);

  // Validate inputs
  const validateInputs = () => {
    const errors = {};
    if (!email.trim()) errors.email = "L'email est requis.";
    if (!password.trim()) errors.password = 'Le mot de passe est requis.';
    else if (password.length < 6) errors.password = 'Le mot de passe doit comporter au moins 6 caractères.';
    if (!selectedStore) errors.store = 'Veuillez sélectionner un magasin.';
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      // Authenticate user
      const authResponse = await restaurantAuth({ email, password });
      const { user, token } = authResponse;

      // Log user ID for debugging
      console.log('Authenticated User ID:', user._id);

      // Get user-specific stores
      const authorizedStoreIds = USER_STORE_MAPPING[user._id] || stores.map(store => store.id);
      if (authorizedStoreIds.length === 0) {
        throw new Error('Aucun magasin associé à cet utilisateur.');
      }
      const userSpecificStores = stores.filter((store) => authorizedStoreIds.includes(store.id));
      if (!userSpecificStores.some((store) => store.id === selectedStore)) {
        throw new Error('Magasin sélectionné non autorisé pour cet utilisateur.');
      }
      setUserStores(userSpecificStores);

      // Save user data to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, user.role);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, user._id);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_STORE_ID, selectedStore);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);

      // Redirect based on role
      const selectedStoreData = userSpecificStores.find((store) => store.id === selectedStore);
      if (user.role.toLowerCase() === 'manager' || email === 'testing-store@eatorder.fr') {
        Alert.alert('Succès', `Bienvenue, ${user.name} (Manager) au magasin ${selectedStoreData.name}`);
        navigation.replace('OrderView', { storeId: selectedStore });
      } else if (user.role.toLowerCase() === 'staff') {
        const staffResponse = await axios.post(`${API_URL}/usermanager/login`, {
          email,
          password,
          storeId: selectedStore,
        });

        if (staffResponse.status === 200 && staffResponse.data.token && staffResponse.data.user) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, staffResponse.data.token);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, staffResponse.data.user.role);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, staffResponse.data.user._id.toString());

          Alert.alert('Succès', `Bienvenue, ${staffResponse.data.user.name} (Staff) au magasin ${selectedStoreData.name}`);
          navigation.replace('StaffHome', { chefId: staffResponse.data.user._id, storeId: selectedStore });
        } else {
          throw new Error(staffResponse.data.error || 'Échec de l\'authentification staff.');
        }
      } 
      else if (user.role.toLowerCase() === 'expéditeur' || user.role.toLowerCase() === 'expediteur') {
        // Redirection pour les expéditeurs
        Alert.alert('Succès', `Bienvenue, ${user.name} (Expéditeur) au magasin ${selectedStoreData.name}`);
        navigation.replace('ExpediteurView', { storeId: selectedStore });
      } else {
        throw new Error('Rôle non autorisé pour cette application.');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      Alert.alert('Erreur', error.message || 'Impossible de se connecter au serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loginTitle}>Connexion</Text>
      <Text style={styles.restaurantSubtitle}>Restaurant: {restaurantName}</Text>

      {/* Sélecteur de magasin */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Sélectionner un magasin:</Text>
        <View style={[styles.input, errors.store && { borderColor: 'red' }]}>
          <Picker
            selectedValue={selectedStore}
            onValueChange={(itemValue) => setSelectedStore(itemValue)}
            style={{ height: 50, width: '100%' }}
            enabled={!isFetchingStores}
          >
            <Picker.Item label="Sélectionner un magasin" value="" />
            {userStores.map((store) => (
              <Picker.Item key={store.id} label={store.name} value={store.id} />
            ))}
          </Picker>
        </View>
        {errors.store && <Text style={styles.errorText}>{errors.store}</Text>}
        {isFetchingStores && <ActivityIndicator color="#E50914" style={{ marginTop: 10 }} />}
        {stores.length === 0 && !isFetchingStores && (
          <Text style={styles.errorText}>Aucun magasin disponible.</Text>
        )}
      </View>

      <TextInput
        style={[styles.input, errors.email && { borderColor: 'red' }]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
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
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#E50914" />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading || stores.length === 0 ? { opacity: 0.7 } : {}]}
        onPress={handleLogin}
        disabled={isLoading || stores.length === 0}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
        <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;