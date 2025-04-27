import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BaseUrl pour le serveur distant
const BaseUrl = 'https://server.eatorder.fr:8000'; // Remplace par https si ton serveur utilise SSL

/**
 * Fonction d'authentification du restaurant
 * @param {Object} credentials - Les identifiants { email, password }
 * @returns {Promise<Object>} - Les données retournées par le serveur
 */
export const restaurantAuth = async ({ email, password }) => {
  try {
    // Envoi de la requête POST pour l'authentification
    const response = await axios.post(`${BaseUrl}/manager/login-`, {
      email,
      password
    });

    // Si la réponse est OK (status 200)
    if (response.status === 200) {
      // Vérifier si c'est sur la plateforme web ou Android
      const storageMethod = Platform.OS === 'web' ? localStorage : AsyncStorage;

      // Stocke le token dans le stockage approprié
      await storageMethod.setItem('AuthToken', response.data.token);

      return response.data; // On retourne les données de la réponse
    } else {
      throw new Error(`Erreur inattendue: ${response.status}`);
    }
  } catch (error) {
    // Gestion d'erreur avec des messages détaillés
    if (error.response) {
      // Si le serveur a répondu mais avec une erreur HTTP
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      throw new Error(`Erreur ${status}: ${message}`);
    } else if (error.request) {
      // Si aucune réponse n'a été reçue (erreur réseau)
      throw new Error('Network Error: Le serveur ne répond pas.');
    } else {
      // Si une autre erreur s'est produite
      throw new Error(`Erreur: ${error.message}`);
    }
  }
};
