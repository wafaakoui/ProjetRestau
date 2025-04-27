import io from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'https://server.eatorder.fr:8000';

console.log('Socket.IO Server URL:', SERVER_URL);

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  forceNew: true,
});

socket.on('connect', () => {
  console.log('Connecté au serveur Socket.IO sur', SERVER_URL);
});

socket.on('disconnect', () => {
  console.log('Déconnecté du serveur Socket.IO');
});

socket.on('connect_error', (error) => {
  console.error('Erreur de connexion Socket.IO:', error.message);
});

socket.on('reconnect_attempt', (attempt) => {
  console.log('Tentative de reconnexion Socket.IO, essai:', attempt);
});

export default socket;