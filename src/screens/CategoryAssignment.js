import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Animated, Modal, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';
import socket from '../services/socket'; // Import the shared socket instance

const CategoryAssignment = () => {
    const navigation = useNavigation();
    const [stations, setStations] = useState([]);
    const [newStationName, setNewStationName] = useState('');
    const [isAddingStation, setIsAddingStation] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const [editedName, setEditedName] = useState('');
    const [customAlert, setCustomAlert] = useState({
        visible: false,
        title: '',
        message: '',
        type: '',
        onConfirm: null,
    });

    const fadeAnim = useState(new Animated.Value(0))[0];
    const [modalAnim] = useState(new Animated.Value(0));

    const options = [
        { title: 'Users', icon: 'users', screen: 'UserManagement' },
        { title: 'Station', icon: 'tasks', screen: 'CategoryAssignment' },
        { title: 'Menu', icon: 'utensils', screen: 'MenuManagement' },
        { title: 'Order', icon: 'list', screen: 'OrderView' },
        { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
      ];

    // Use environment-specific BASE_URL (update as needed)
    const BASE_URL ='https://server.eatorder.fr:8000';

    useEffect(() => {
        fetchStations();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Socket.IO event listeners
        socket.on('stationAdded', (station) => {
            console.log('Station added via Socket.IO:', station);
            setStations((prev) => [...prev, station]);
        });

        socket.on('stationUpdated', (station) => {
            console.log('Station updated via Socket.IO:', station);
            setStations((prev) =>
                prev.map((s) => (s.id === station.id ? { ...s, name: station.name } : s))
            );
        });

        socket.on('stationPaused', (station) => {
            console.log('Station paused status updated via Socket.IO:', station);
            setStations((prev) =>
                prev.map((s) => (s.id === station.id ? { ...s, is_paused: station.is_paused } : s))
            );
        });

        socket.on('stationDeleted', ({ id }) => {
            console.log('Station deleted via Socket.IO:', id);
            setStations((prev) => prev.filter((s) => s.id !== id));
        });

        return () => {
            socket.off('stationAdded');
            socket.off('stationUpdated');
            socket.off('stationPaused');
            socket.off('stationDeleted');
        };
    }, [fadeAnim]);

 const fetchStations = async () => {
    try {
        const response = await fetch(`${BASE_URL}/owner/getstations/67d7fd4a1dca285cd9d0b38d`, {
            method: 'GET',
            
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            console.log("-----------");
            
        }

        const data = await response.json();
        console.log('Stations fetched:', data);
        setStations(data);
    } catch (error) {
        console.error('Error fetching stations:', error.message);
        alertWithStyle('Erreur', `Impossible de charger les stations: ${error.message}`, 'error');
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
            alertWithStyle('Erreur', 'Veuillez entrer un nom valide.', 'error');
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/owner/stations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newStationName.trim() }),
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            setNewStationName('');
            setIsAddingStation(false);
            alertWithStyle('Succès', 'Station ajoutée avec succès !', 'success');
        } catch (error) {
            console.error('Error adding station:', error.message);
            alertWithStyle('Erreur', `Échec de l'ajout de la station: ${error.message}`, 'error');
        }
    };

    const alertWithStyle = (title, message, type, onConfirm = null) => {
        setCustomAlert({ visible: true, title, message, type, onConfirm });
    };

    const removeStation = (station) => {
        alertWithStyle(
            'Suppression',
            `Voulez-vous vraiment supprimer "${station.name}" ?`,
            'warning',
            async () => {
                try {
                    const response = await fetch(`${BASE_URL}/owner/stations/${station.id}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    setCustomAlert({ visible: false });
                    alertWithStyle('Succès', `"${station.name}" supprimée avec succès !`, 'success');
                } catch (error) {
                    console.error('Error deleting station:', error.message);
                    alertWithStyle('Erreur', `Échec de la suppression: ${error.message}`, 'error');
                }
            }
        );
    };

    const pauseStation = (station) => {
        alertWithStyle(
            'Confirmation',
            station.is_paused
                ? `Reprendre "${station.name}" ?`
                : `Mettre "${station.name}" en pause ?`,
            'info',
            async () => {
                try {
                    const response = await fetch(`${BASE_URL}/owner/stations/${station.id}/pause`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    const data = await response.json();
                    setCustomAlert({ visible: false });
                    alertWithStyle(
                        'Succès',
                        `"${station.name}" ${data.is_paused ? 'est en pause' : 'a repris'}`,
                        'success'
                    );
                } catch (error) {
                    console.error('Error toggling pause status:', error.message);
                    alertWithStyle('Erreur', `Échec de la mise en pause/reprise: ${error.message}`, 'error');
                }
            }
        );
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
            alertWithStyle('Erreur', 'Le nom ne peut pas être vide', 'error');
            return;
        }
    
        const token = "TON_TOKEN_ICI";  // récupère-le depuis ton state, storage, ou context
    
        try {
            const response = await fetch(`${BASE_URL}/owner/stations/67ff7256748ce4b2964e823b`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    
                    "name": editedName.trim(),
             
                }),
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            closeEditModal();
            alertWithStyle('Succès', 'Modification enregistrée !', 'success');
        } catch (error) {
            console.error('Error updating station:', error.message);
            alertWithStyle('Erreur', `Échec de la modification: ${error.message}`, 'error');
        }
    };
    

    return (
        <View style={styles.container}>
            <Sidebar options={options} />
            <View style={styles.content}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.header}>Assignation des Catégories</Text>
                </Animated.View>

                <ScrollView style={styles.stationsList}>
                    {stations.map((station) => (
                        <View
                            key={station.id}
                            style={[
                                styles.stationItem,
                                station.is_paused && styles.stationPaused,
                            ]}
                        >
                            <Text style={styles.stationText}>{station.name}</Text>
                            <View style={styles.buttonsContainer}>
                                <TouchableOpacity onPress={() => pauseStation(station)} style={styles.button}>
                                    <FontAwesome5
                                        name={station.is_paused ? 'play-circle' : 'pause-circle'}
                                        size={20}
                                        color="#8B5A2B"
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removeStation(station)} style={styles.button}>
                                    <FontAwesome5 name="trash" size={20} color="#E73E01" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => openEditModal(station)} style={styles.button}>
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
                        />
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity onPress={addStation} style={styles.addButton}>
                                <Text style={styles.buttonText}>Ajouter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsAddingStation(false)} style={styles.cancelButton}>
                                <Text style={styles.buttonText}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => setIsAddingStation(true)} style={styles.addButton}>
                        <Text style={styles.buttonText}>Ajouter une station</Text>
                    </TouchableOpacity>
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
                                <TouchableOpacity onPress={closeEditModal}>
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
                                />
                            </View>
                            <View style={styles.modalFooter}>
                                <TouchableOpacity onPress={closeEditModal} style={styles.modalCancelButton}>
                                    <Text style={styles.modalButtonText}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={updateStation} style={styles.modalUpdateButton}>
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
                                                    backgroundColor:
                                                        customAlert.type === 'success' ? '#E73E01' : '#FFFFFF',
                                                },
                                            ]}
                                            onPress={() => {
                                                if (customAlert.onConfirm) customAlert.onConfirm();
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.alertButtonText,
                                                    {
                                                        color:
                                                            customAlert.type === 'success' ? '#FFFFFF' : '#000000',
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
                                                backgroundColor:
                                                    customAlert.type === 'success' ? '#8B5A2B' : '#FFFFFF',
                                            },
                                        ]}
                                        onPress={() => setCustomAlert({ ...customAlert, visible: false })}
                                    >
                                        <Text
                                            style={[
                                                styles.alertButtonText,
                                                {
                                                    color:
                                                        customAlert.type === 'success' ? '#FFFFFF' : '#000000',
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
        marginBottom: 20,
        paddingHorizontal: 15,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        fontSize: 16 * fontScale,
        color: '#000000',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
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
});

export default CategoryAssignment;