import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';
import { getSocket } from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StationExpediteur = () => {
  const navigation = useNavigation();
  const [stations, setStations] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserExpediteur' },
    { title: 'Station', icon: 'tasks', screen: 'StationExpediteur' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuExpediteur' },
    { title: 'Order', icon: 'list', screen: 'ExpediteurView' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];

  const BASE_URL = 'http://localhost:3000';

  useEffect(() => {
    const setup = async () => {
      try {
        const savedStoreId = await AsyncStorage.getItem('selectedStoreId');
        if (savedStoreId) {
          setStoreId(savedStoreId);
        } else {
          console.error('Aucun magasin sélectionné');
          navigation.replace('Login');
          return;
        }

        const socket = await getSocket();
        if (!socket) {
          console.error('Connexion au serveur en temps réel non initialisée');
          return;
        }

        setSocketInstance(socket);
      } catch (error) {
        console.error('Erreur lors de la récupération du storeId ou du socket:', error);
        navigation.replace('Login');
      }
    };

    setup();
  }, []);

  useEffect(() => {
    if (storeId && socketInstance) {
      fetchStations();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      socketInstance.on('connect', () => {
        console.log('Socket.IO connected');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });

      socketInstance.on('stationAdded', (station) => {
        console.log('Station added via Socket.IO:', station);
        setStations((prev) => {
          if (prev.some((s) => s.id === station.id)) return prev;
          return [...prev, station];
        });
      });

      socketInstance.on('stationUpdated', (station) => {
        console.log('Station updated via Socket.IO:', station);
        setStations((prev) =>
          prev.map((s) => (s.id === station.id ? { ...s, name: station.name, is_paused: station.is_paused } : s))
        );
      });

      socketInstance.on('stationPaused', (station) => {
        console.log('Station paused status updated via Socket.IO:', station);
        setStations((prev) =>
          prev.map((s) => (s.id === station.id ? { ...s, is_paused: station.is_paused } : s))
        );
      });

      socketInstance.on('stationDeleted', ({ id }) => {
        console.log('Station deleted via Socket.IO:', id);
        setStations((prev) => prev.filter((s) => s.id !== id));
      });

      return () => {
        socketInstance.off('connect');
        socketInstance.off('connect_error');
        socketInstance.off('stationAdded');
        socketInstance.off('stationUpdated');
        socketInstance.off('stationPaused');
        socketInstance.off('stationDeleted');
      };
    }
  }, [storeId, socketInstance, fadeAnim]);

  const fetchStations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/getstations/${storeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log('Stations fetched:', data);
      setStations(data);
    } catch (error) {
      console.error('Error fetching stations:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!storeId) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Sidebar options={options} />
      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.header}>Stations Expéditeur</Text>
        </Animated.View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        <ScrollView style={styles.stationsList}>
          {stations.map((station) => (
            <View
              key={station.id}
              style={[styles.stationItem, station.is_paused && styles.stationPaused]}
            >
              <Text style={styles.stationText}>{station.name}</Text>
              <FontAwesome5
                name={station.is_paused ? 'toggle-off' : 'toggle-on'}
                size={20}
                color={station.is_paused ? '#dc3545' : '#28a745'}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const fontScale = width > 375 ? 1 : 0.9;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28 * fontScale,
    fontWeight: '700',
    color: '#E73E01',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1,
  },
  stationsList: {
    marginBottom: 20,
  },
  stationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E73E01',
  },
  stationPaused: {
    backgroundColor: '#D3D3D3',
  },
  stationText: {
    fontSize: 18 * fontScale,
    color: '#000000',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 18 * fontScale,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default StationExpediteur;