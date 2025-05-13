import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Animated, Modal, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';
import { getSocket } from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Station = () => {
  const navigation = useNavigation();
  const [stations, setStations] = useState([]);
  const [newStationName, setNewStationName] = useState('');
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [storeId, setStoreId] = useState(null);
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: '',
    onConfirm: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);
  const [newStationPaused, setNewStationPaused] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const [modalAnim] = useState(new Animated.Value(0));

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserManagement' },
    { title: 'Station', icon: 'tasks', screen: 'CategoryAssignment' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuManagement' },
    { title: 'Order', icon: 'list', screen: 'OrderView' },
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
          setCustomAlert({
            visible: true,
            title: 'Erreur',
            message: 'Aucun magasin sélectionné. Veuillez vous reconnecter.',
            type: 'error',
            onConfirm: () => navigation.replace('Login'),
          });
          return;
        }

        const socket = await getSocket();
        if (!socket) {
          setCustomAlert({
            visible: true,
            title: 'Erreur',
            message: 'Connexion au serveur en temps réel non initialisée.',
            type: 'error',
          });
          return;
        }

        setSocketInstance(socket);
      } catch (error) {
        console.error('Erreur lors de la récupération du storeId ou du socket:', error);
        setCustomAlert({
          visible: true,
          title: 'Erreur',
          message: 'Impossible de charger le magasin ou le socket. Veuillez vous reconnecter.',
          type: 'error',
          onConfirm: () => navigation.replace('Login'),
        });
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
        setCustomAlert({
          visible: true,
          title: 'Erreur',
          message: 'Impossible de se connecter au serveur en temps réel.',
          type: 'error',
        });
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

  // Rafraîchir les stations chaque fois que la page est revisitée
  useFocusEffect(
    React.useCallback(() => {
      if (storeId) {
        fetchStations();
      }
    }, [storeId])
  );

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
      setStations(data); // Mettre à jour l'état avec les données exactes de la DB
    } catch (error) {
      console.error('Error fetching stations:', error.message);
      setCustomAlert({
        visible: true,
        title: 'Erreur',
        message: `Impossible de charger les stations: ${error.message}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const animateModal = (visible) => {
    Animated.spring(modalAnim, {
      toValue: visible ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const addStation = async () => {
    if (!newStationName.trim()) {
      setCustomAlert({
        visible: true,
        title: 'Erreur',
        message: 'Veuillez entrer un nom valide.',
        type: 'error',
      });
      return;
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const tempId = `temp-${Date.now()}`;
      const newStation = { id: tempId, name: newStationName.trim(), storeid: storeId, is_paused: newStationPaused };
      setStations((prev) => [...prev, newStation]);

      const response = await fetch(`${BASE_URL}/owner/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newStationName.trim(),
          storeid: storeId,
          is_paused: newStationPaused, // Assurer que l'état pausée est envoyé
        }),
      });

      if (!response.ok) {
        setStations((prev) => prev.filter((s) => s.id !== tempId));
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const createdStation = await response.json();
      console.log('Station created:', createdStation); // Log pour débogage
      setStations((prev) =>
        prev.map((s) => (s.id === tempId ? { ...createdStation, is_paused: createdStation.is_paused } : s))
      );

      setNewStationName('');
      setNewStationPaused(false);
      setIsAddingStation(false);
      setCustomAlert({
        visible: true,
        title: 'Succès',
        message: 'Station ajoutée avec succès !',
        type: 'success',
      });
    } catch (error) {
      console.error('Error adding station:', error.message);
      setCustomAlert({
        visible: true,
        title: 'Erreur',
        message: `Échec de l'ajout de la station: ${error.message}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeStation = (station) => {
    setCustomAlert({
      visible: true,
      title: 'Suppression',
      message: `Voulez-vous vraiment supprimer "${station.name}" ?`,
      type: 'warning',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          setStations((prev) => prev.filter((s) => s.id !== station.id));

          const token = await AsyncStorage.getItem('userToken');
          const response = await fetch(`${BASE_URL}/owner/stations/${station.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            setStations((prev) => [...prev, station]);
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          setCustomAlert({ visible: false });
          setCustomAlert({
            visible: true,
            title: 'Succès',
            message: `"${station.name}" supprimée avec succès !`,
            type: 'success',
          });
        } catch (error) {
          console.error('Error deleting station:', error.message);
          setCustomAlert({
            visible: true,
            title: 'Erreur',
            message: `Échec de la suppression: ${error.message}`,
            type: 'error',
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const togglePauseStation = async (station) => {
    setIsLoading(true);
    try {
      const newPausedState = !station.is_paused;
      setStations((prev) =>
        prev.map((s) => (s.id === station.id ? { ...s, is_paused: newPausedState } : s))
      );

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/owner/stations/${station.id}/pause`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_paused: newPausedState }),
      });

      if (!response.ok) {
        setStations((prev) =>
          prev.map((s) => (s.id === station.id ? { ...s, is_paused: station.is_paused } : s))
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedStation = await response.json();
      setStations((prev) =>
        prev.map((s) => (s.id === station.id ? { ...s, is_paused: updatedStation.is_paused } : s))
      );

      setCustomAlert({
        visible: true,
        title: 'Succès',
        message: `"${station.name}" ${updatedStation.is_paused ? 'est en pause' : 'a repris'}`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error toggling pause status:', error.message);
      setCustomAlert({
        visible: true,
        title: 'Erreur',
        message: `Échec de la mise en pause/reprise: ${error.message}`,
        type: 'error',
      });
      setStations((prev) =>
        prev.map((s) => (s.id === station.id ? { ...s, is_paused: station.is_paused } : s))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (station) => {
    setSelectedStation(station);
    setEditedName(station.name);
    setEditModalVisible(true);
    animateModal(true);
  };

  const closeEditModal = () => {
    animateModal(false);
    setTimeout(() => setEditModalVisible(false), 300);
  };

  const updateStation = async () => {
    if (!editedName.trim()) {
      setCustomAlert({
        visible: true,
        title: 'Erreur',
        message: 'Le nom ne peut pas être vide',
        type: 'error',
      });
      return;
    }
    setIsLoading(true);
    try {
      setStations((prev) =>
        prev.map((s) =>
          s.id === selectedStation.id ? { ...s, name: editedName.trim() } : s
        )
      );

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/owner/stations/${selectedStation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editedName.trim(),
        }),
      });

      if (!response.ok) {
        setStations((prev) =>
          prev.map((s) =>
            s.id === selectedStation.id ? { ...s, name: selectedStation.name } : s
          )
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedStation = await response.json();
      setStations((prev) =>
        prev.map((s) =>
          s.id === selectedStation.id ? { ...s, name: updatedStation.name } : s
        )
      );

      closeEditModal();
      setCustomAlert({
        visible: true,
        title: 'Succès',
        message: 'Modification enregistrée !',
        type: 'success',
      });
    } catch (error) {
      console.error('Error updating station:', error.message);
      setCustomAlert({
        visible: true,
        title: 'Erreur',
        message: `Échec de la modification: ${error.message}`,
        type: 'error',
      });
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
          <Text style={styles.header}>Assignation des Catégories</Text>
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
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          onPress={() => togglePauseStation(station)}
          style={styles.button}
          disabled={isLoading}
        >
          <FontAwesome5
            name={station.is_paused ? 'toggle-off' : 'toggle-on'}
            size={20}
            color={station.is_paused ? '#dc3545' : '#28a745'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => removeStation(station)}
          style={styles.button}
          disabled={isLoading}
        >
          <FontAwesome5 name="trash" size={20} color="#E73E01" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openEditModal(station)}
          style={styles.button}
          disabled={isLoading}
        >
          <FontAwesome5 name="edit" size={20} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  ))}
</ScrollView>

        {isAddingStation ? (
          <View style={styles.addStationContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nom de la station"
              placeholderTextColor="#8B5A2B"
              value={newStationName}
              onChangeText={setNewStationName}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setNewStationPaused(!newStationPaused)}
              style={styles.toggleButton}
              disabled={isLoading}
            >
              <FontAwesome5
                name={newStationPaused ? 'toggle-off' : 'toggle-on'}
                size={20}
                color={newStationPaused ? '#dc3545' : '#28a745'}
              />
              <Text style={styles.toggleText}>{newStationPaused ? 'Pause' : 'Actif'}</Text>
            </TouchableOpacity>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={addStation}
                style={[styles.addButton, isLoading && styles.disabledButton]}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Ajouter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsAddingStation(false)}
                style={[styles.cancelButton, isLoading && styles.disabledButton]}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={() => setIsAddingStation(true)}
              style={[styles.addButton, isLoading && styles.disabledButton]}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Ajouter une station</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={editModalVisible} transparent animationType="none">
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [
                    {
                      scale: modalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                  opacity: modalAnim,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modifier la Station</Text>
                <TouchableOpacity onPress={closeEditModal} disabled={isLoading}>
                  <FontAwesome5 name="times" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Nouveau nom</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Entrez le nouveau nom"
                  placeholderTextColor="#8B5A2B"
                  editable={!isLoading}
                />
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={closeEditModal}
                  style={[styles.modalCancelButton, isLoading && styles.disabledButton]}
                  disabled={isLoading}
                >
                  <Text style={styles.modalButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={updateStation}
                  style={[styles.modalUpdateButton, isLoading && styles.disabledButton]}
                  disabled={isLoading}
                >
                  <Text style={styles.modalButtonText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {customAlert.visible && (
          <Modal transparent visible={customAlert.visible}>
            <View style={styles.alertOverlay}>
              <View
                style={[
                  styles.alertContainer,
                  {
                    backgroundColor:
                      customAlert.type === 'error'
                        ? '#E73E01'
                        : customAlert.type === 'success'
                        ? '#FFFFFF'
                        : customAlert.type === 'warning'
                        ? '#8B5A2B'
                        : '#000000',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.alertTitle,
                    { color: customAlert.type === 'success' ? '#E73E01' : '#FFFFFF' },
                  ]}
                >
                  {customAlert.title}
                </Text>
                <Text
                  style={[
                    styles.alertMessage,
                    { color: customAlert.type === 'success' ? '#000000' : '#FFFFFF' },
                  ]}
                >
                  {customAlert.message}
                </Text>
                <View style={styles.alertButtons}>
                  {customAlert.onConfirm && (
                    <TouchableOpacity
                      style={[
                        styles.alertButton,
                        {
                          backgroundColor: customAlert.type === 'success' ? '#E73E01' : '#FFFFFF',
                        },
                      ]}
                      onPress={() => {
                        if (customAlert.onConfirm) customAlert.onConfirm();
                        setCustomAlert({ ...customAlert, visible: false });
                      }}
                    >
                      <Text
                        style={[
                          styles.alertButtonText,
                          {
                            color: customAlert.type === 'success' ? '#FFFFFF' : '#000000',
                          },
                        ]}
                      >
                        Confirmer
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.alertButton,
                      {
                        backgroundColor: customAlert.type === 'success' ? '#8B5A2B' : '#FFFFFF',
                      },
                    ]}
                    onPress={() => setCustomAlert({ ...customAlert, visible: false })}
                  >
                    <Text
                      style={[
                        styles.alertButtonText,
                        {
                          color: customAlert.type === 'success' ? '#FFFFFF' : '#000000',
                        },
                      ]}
                    >
                      {customAlert.onConfirm ? 'Annuler' : 'OK'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginHorizontal: 10,
  },
  addButton: {
    backgroundColor: '#E73E01',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 4,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16 * fontScale,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addStationContainer: {
    marginVertical: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E73E01',
  },
  input: {
    height: 50,
    borderColor: '#E73E01',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 16 * fontScale,
    color: '#000000',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleText: {
    marginLeft: 10,
    fontSize: 16 * fontScale,
    color: '#8B5A2B',
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginVertical: 10,
  },
  cancelButton: {
    backgroundColor: '#8B5A2B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#E73E01',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E73E01',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    margin: -25,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#8B5A2B',
  },
  modalTitle: {
    fontSize: 22 * fontScale,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalBody: {
    paddingVertical: 10,
  },
  modalLabel: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: '#8B5A2B',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  modalInput: {
    height: 50,
    borderColor: '#E73E01',
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 16 * fontScale,
    color: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  modalCancelButton: {
    backgroundColor: '#8B5A2B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    elevation: 4,
  },
  modalUpdateButton: {
    backgroundColor: '#E73E01',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    elevation: 4,
  },
  modalButtonText: {
    fontSize: 16 * fontScale,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  alertContainer: {
    width: '85%',
    padding: 25,
    borderRadius: 15,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E73E01',
  },
  alertTitle: {
    fontSize: 22 * fontScale,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  alertMessage: {
    fontSize: 16 * fontScale,
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '500',
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
    elevation: 2,
  },
  alertButtonText: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    letterSpacing: 0.5,
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
  disabledButton: {
    opacity: 0.5,
  },
});

export default Station;