import axios from 'axios';

const API_BASE_URL = 'https://server.eatorder.fr:8000';

/**
 * Fonction d'authentification du login utilisateur
 * @param {Object} credentials - Les identifiants { email, password }
 * @returns {Promise<Object>} - Les données retournées par le serveur
 */
export const loginUser = async ({ email, password }) => {
  try {
    // Envoi de la requête POST pour la connexion de l'utilisateur
    const response = await axios.post(`${API_BASE_URL}/manager/login-`, {
      email,
      password,
    });

    if (response.status === 200) {
      console.log('Réponse du serveur:', response.data);
      localStorage.setItem('userToken', response.data.token); // Stocke le token dans le stockage local
      return response.data; // retourne token + user
    } else {
      throw new Error(`Erreur inattendue: ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      if (status === 404) {
        throw new Error('Erreur 404: Service de connexion non disponible. Vérifiez l\'URL du serveur.');
      } else if (status === 401) {
        throw new Error('Erreur 401: Email ou mot de passe incorrect.');
      } else if (status === 500) {
        throw new Error('Erreur serveur 500: Problème interne du serveur.');
      } else {
        throw new Error(`Erreur ${status}: ${message}`);
      }
    } else if (error.request) {
      throw new Error('Erreur réseau: Le serveur ne répond pas.');
    } else {
      throw new Error(`Erreur: ${error.message}`);
    }
  }
};
