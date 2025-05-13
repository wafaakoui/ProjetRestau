import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'https://server.eatorder.fr:8000';

console.log('Socket.IO Server URL:', SERVER_URL);

let socket = null;
let socketPromise = null;

const initializeSocket = async () => {
  if (socket) {
    return socket; // Return existing socket if already initialized
  }

  try {
    const token = await AsyncStorage.getItem('userToken');

    socket = io(SERVER_URL, {
      transports: ['websocket'],
      secure: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('🟢 Connecté à Socket.IO sur', SERVER_URL);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Déconnecté du serveur Socket.IO');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket.IO:', error.message);
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('♻️ Tentative de reconnexion Socket.IO, essai:', attempt);
    });

    return socket;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du socket:', error);
    socket = null;
    throw error;
  }
};

// Initialize the socket when the app starts
export const initSocket = () => {
  if (!socketPromise) {
    socketPromise = initializeSocket();
  }
  return socketPromise;
};

// Get the socket instance (wait for initialization if needed)
export const getSocket = async () => {
  if (!socketPromise) {
    await initSocket();
  }
  await socketPromise; // Ensure socket is initialized
  return socket;
};

// Optionally, export a method to disconnect the socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketPromise = null;
    console.log('Socket.IO disconnected and reset');
  }
};