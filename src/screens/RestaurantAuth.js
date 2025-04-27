import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/AppStyles';
import { restaurantAuth } from '../services/AuthService';

const RestaurantAuth = () => {
  const navigation = useNavigation();
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [restaurantPassword, setRestaurantPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation des inputs
  const validateInputs = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!restaurantEmail.trim()) {
      errors.email = "L'email est requis.";
    } else if (!emailRegex.test(restaurantEmail)) {
      errors.email = "Veuillez entrer un email valide.";
    }

    if (!restaurantPassword.trim()) {
      errors.password = 'Le mot de passe est requis.';
    } else if (restaurantPassword.length < 6) {
      errors.password = 'Minimum 6 caractères.';
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fonction d'authentification du restaurant
  const handleValidateRestaurant = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      console.log('Envoi des données:', { email: restaurantEmail, password: restaurantPassword });
      const response = await restaurantAuth({ email: restaurantEmail, password: restaurantPassword });
      console.log('Réponse du serveur:', response);

      // Naviguer vers l'écran de login
      navigation.navigate('Login', { restaurantName: response.restaurant?.name || 'Restaurant' });
    } catch (error) {
      console.error('Erreur complète:', error);
      let errorMessage = 'Une erreur est survenue. Réessayez plus tard.';
      
      // Gestion d'erreur basée sur le code d'erreur
      if (error.message.includes('401')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Service d\'authentification non disponible. Contactez l\'administrateur.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Erreur serveur.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Problème de connexion au serveur. Vérifiez votre réseau.';
      }
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loginTitle}>Authentification Restaurant</Text>
      <TextInput
        style={[styles.input, errors.email && { borderColor: 'red' }]}
        placeholder="Email du restaurant"
        value={restaurantEmail}
        onChangeText={setRestaurantEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, errors.password && { borderColor: 'red' }]}
          placeholder="Mot de passe du restaurant"
          secureTextEntry={!showPassword}
          value={restaurantPassword}
          onChangeText={setRestaurantPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#E50914" />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading && { opacity: 0.7 }]}
        onPress={handleValidateRestaurant}
        disabled={isLoading}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Chargement...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Valider</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default RestaurantAuth;