import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import Sidebar from '../components/Sidebar';

const { width } = Dimensions.get('window');
const fontScale = width > 375 ? 1 : 0.9;
const ticketSize = 240;
const ticketHeight = 200; // Réduit pour un affichage plus compact

const StaffHome = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chefId } = route.params || {};
  const [storeId] = useState('67d7fd4a1dca285cd9d0b38d');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [stations, setStations] = useState([]);
  const [currentStation, setCurrentStation] = useState('All');
  const [currentStatus, setCurrentStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [socket, setSocket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const ordersPerPage = 10;
  const serverUrl = 'https://server.eatorder.fr:8000';

  const options = [
    { title: 'Commandes', icon: 'list', screen: 'StaffHome' },
    {
      title: 'Déconnexion',
      icon: 'sign-out-alt',
      screen: 'Login',
      onPress: async () => {
        await AsyncStorage.removeItem('userToken');
        navigation.navigate('Login');
      },
    },
  ];

  const statusFilters = ['All', 'Pending', 'Ready', 'Missed'];

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const mapStatus = (status) => {
    const statusMap = {
      pending: 'Pending',
      created: 'Pending',
      accepted: 'Ready',
      missed: 'Missed',
      rejected: 'Missed',
    };
    return statusMap[status] || status || 'Unknown';
  };

  const fetchStations = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${serverUrl}/getstations/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.stations) {
        setStations(['All', ...data.stations.map((station) => station.name)]);
      } else {
        throw new Error(data.message || 'Failed to fetch stations');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      Alert.alert('Erreur', 'Impossible de charger les stations.');
      setStations(['All']);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No authentication token found');

      const order = orders.find((o) => o.id === orderId);
      if (order.status === mapStatus(newStatus)) return;

      const response = await fetch(`${serverUrl}/owner/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }

      await fetchOrders(currentPage);
      Alert.alert('Succès', `Commande marquée comme ${newStatus === 'accepted' ? 'Prête' : 'Manquée'}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut de la commande.');
    }
  };

  const fetchOrders = useCallback(
    async (page = 1) => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(
          `${serverUrl}/owner/orders/${storeId}?page=${page}&limit=${ordersPerPage}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'No orders found');

        const ordersData = data?.data || data || [];
        const mappedOrders = ordersData.map((order, index) => ({
          id: order._id,
          orderNumber: `ORDER-${index + 1 + (page - 1) * ordersPerPage}`,
          uniqueId: order._id,
          time: formatTime(order.createdAt),
          date: formatDate(order.createdAt),
          items: order.items?.map((item) => ({
            name: item.name,
            quantity: item.quantity || 1,
            station: item.station || 'Unknown',
          })) || [],
          totalPrice: order.price_total || 0,
          status: mapStatus(order.status),
          createdAt: order.createdAt,
          clientName: `${order.client_first_name || ''} ${order.client_last_name || ''}`.trim() || 'N/A',
          orderDetails: order.items?.map((item) => `${item.name} x${item.quantity}`).join(', ') || 'No details',
        }));

        const sortedOrders = mappedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        Alert.alert('Erreur', 'Impossible de charger les commandes.');
        setOrders([]);
      }
    },
    [storeId, serverUrl]
  );

  const filterOrders = useCallback(() => {
    let filtered = [...orders];

    if (currentStation !== 'All') {
      filtered = filtered.filter((order) =>
        order.items.some((item) => item.station === currentStation)
      );
    }

    if (currentStatus !== 'All') {
      filtered = filtered.filter((order) => order.status === currentStatus);
    }

    setFilteredOrders(filtered);
  }, [orders, currentStation, currentStatus]);

  useEffect(() => {
    filterOrders();
  }, [orders, currentStation, currentStatus, filterOrders]);

  useEffect(() => {
    const setup = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Alert.alert('Erreur', 'Veuillez vous connecter.', [
            { text: 'OK', onPress: () => navigation.navigate('Login') },
          ]);
          return;
        }

        await Promise.all([fetchOrders(currentPage), fetchStations()]);

        const socketInstance = io(serverUrl, {
          auth: { token },
          transports: ['websocket'],
          query: { storeId, userId: chefId },
        });

        socketInstance.on('connect', () => console.log('WebSocket connected'));
        socketInstance.on('orderUpdate', () => fetchOrders(currentPage));
        socketInstance.on('connect_error', (error) => console.error('WebSocket error:', error));
        socketInstance.on('disconnect', () => console.log('WebSocket disconnected'));

        setSocket(socketInstance);

        return () => socketInstance.disconnect();
      } catch (error) {
        console.error('Setup error:', error);
        Alert.alert('Erreur', 'Échec du chargement initial.');
      }
    };

    setup();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [currentPage, chefId, fetchOrders, serverUrl]);

  const renderOrderItem = ({ item }) => {
    const statusColors = {
      Ready: { bg: '#d4edda', border: '#28a745' },
      Missed: { bg: '#f8d7da', border: '#dc3545' },
      Pending: { bg: '#fff3cd', border: '#E73E01' },
    };

    return (
      <Animated.View
        style={[
          styles.ticketContainer,
          statusColors[item.status] && {
            backgroundColor: statusColors[item.status].bg,
            borderColor: statusColors[item.status].border,
          },
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.ticketContent}>
          <Text style={styles.orderDetails}>
            Articles: {item.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
          </Text>
          <Text style={styles.orderDetails}>Statut: {item.status}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedOrder(item);
                setModalVisible(true);
              }}
            >
              <Text style={styles.actionButtonText}>Détails</Text>
            </TouchableOpacity>
            {item.status === 'Pending' && (
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#28a745' }]}
                  onPress={() => updateOrderStatus(item.id, 'accepted')}
                >
                  <Text style={styles.statusButtonText}>Prêt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#dc3545' }]}
                  onPress={() => updateOrderStatus(item.id, 'missed')}
                >
                  <Text style={styles.statusButtonText}>Manqué</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderOrderDetailsModal = () =>
    selectedOrder && (
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Détails de la Commande</Text>
            <ScrollView>
              <Text style={styles.modalText}>Commande: {selectedOrder.orderNumber}</Text>
              <Text style={styles.modalText}>Client: {selectedOrder.clientName}</Text>
              <Text style={styles.modalText}>Date: {selectedOrder.date}</Text>
              <Text style={styles.modalText}>Heure: {selectedOrder.time}</Text>
              <Text style={styles.modalText}>ID Unique: {selectedOrder.uniqueId}</Text>
              <Text style={styles.modalText}>Articles:</Text>
              <FlatList
                data={selectedOrder.items}
                renderItem={({ item }) => (
                  <Text style={styles.modalText}>
                    • {item.name} x{item.quantity} (Station: {item.station})
                  </Text>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
              <Text style={styles.modalText}>Total: {selectedOrder.totalPrice} EUR</Text>
              <Text style={styles.modalText}>Statut: {selectedOrder.status}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.quitButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.quitButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );

  const Pagination = ({ currentPage, totalPages, onPageChange }) => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[
          styles.paginationButton,
          currentPage === 1 && styles.paginationButtonDisabled,
        ]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Text style={styles.paginationButtonText}>Précédent</Text>
      </TouchableOpacity>
      <Text style={styles.pageIndicator}>
        Page {currentPage} sur {totalPages}
      </Text>
      <TouchableOpacity
        style={[
          styles.paginationButton,
          currentPage === totalPages && styles.paginationButtonDisabled,
        ]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Text style={styles.paginationButtonText}>Suivant</Text>
      </TouchableOpacity>
    </View>
  );

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const numColumns = Math.min(Math.max(Math.floor((width - 40) / ticketSize), 1), 5);

  return (
    <View style={styles.container}>
      <Sidebar options={options} />
      <View style={styles.mainContent}>
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
          <Text style={styles.header}>Tableau de Bord du Personnel</Text>
        </Animated.View>

        <View style={styles.filterContainer}>
          <View style={styles.stationFilter}>
            {stations.map((station) => (
              <TouchableOpacity
                key={station}
                style={[
                  styles.stationButton,
                  currentStation === station && styles.stationButtonActive,
                ]}
                onPress={() => {
                  setCurrentStation(station);
                  setCurrentStatus('All'); // Réinitialiser le statut lors du changement de station
                  setCurrentPage(1);
                }}
              >
                <Text
                  style={[
                    styles.stationButtonText,
                    currentStation === station && styles.stationButtonTextActive,
                  ]}
                >
                  {station === 'All' ? 'Toutes' : `Station ${station}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.statusFilter}>
            {statusFilters.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButtonFilter,
                  currentStatus === status && styles.statusButtonFilterActive,
                ]}
                onPress={() => {
                  setCurrentStatus(status);
                  setCurrentPage(1);
                }}
              >
                <Text
                  style={[
                    styles.statusButtonTextFilter,
                    currentStatus === status && styles.statusButtonTextFilterActive,
                  ]}
                >
                  {status === 'All' ? 'Tous' : status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {filteredOrders.length > 0 ? (
          <>
            <FlatList
              data={paginatedOrders}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={numColumns}
              columnWrapperStyle={styles.columnWrapper}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucune commande disponible.</Text>}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages || 1}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <Text style={styles.emptyText}>Aucune commande disponible.</Text>
        )}
        {renderOrderDetailsModal()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 24 * fontScale,
    fontWeight: '700',
    color: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#E73E01',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  filterContainer: {
    marginBottom: 20,
  },
  stationFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    justifyContent: 'center',
  },
  statusFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  stationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E73E01',
    backgroundColor: '#ffffff',
  },
  stationButtonActive: {
    backgroundColor: '#E73E01',
  },
  stationButtonText: {
    fontSize: 14 * fontScale,
    color: '#E73E01',
    fontWeight: '600',
  },
  stationButtonTextActive: {
    color: '#ffffff',
  },
  statusButtonFilter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E73E01',
    backgroundColor: '#ffffff',
  },
  statusButtonFilterActive: {
    backgroundColor: '#E73E01',
  },
  statusButtonTextFilter: {
    fontSize: 14 * fontScale,
    color: '#E73E01',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusButtonTextFilterActive: {
    color: '#ffffff',
  },
  ticketContainer: {
    width: ticketSize,
    height: ticketHeight,
    margin: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#E73E01',
  },
  ticketContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderDetails: {
    fontSize: 13 * fontScale,
    color: '#333',
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#E73E01',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14 * fontScale,
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  statusButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  statusButtonText: {
    color: '#ffffff',
    fontSize: 12 * fontScale,
    fontWeight: '600',
  },
  columnWrapper: {
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16 * fontScale,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    elevation: 5,
  },
  paginationButton: {
    backgroundColor: '#E73E01',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#d1d1d1',
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: 14 * fontScale,
    fontWeight: '600',
  },
  pageIndicator: {
    fontSize: 14 * fontScale,
    color: '#333',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20 * fontScale,
    fontWeight: '700',
    color: '#E73E01',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14 * fontScale,
    color: '#333',
    marginBottom: 8,
  },
  quitButton: {
    backgroundColor: '#E73E01',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    elevation: 2,
  },
  quitButtonText: {
    fontSize: 14 * fontScale,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default StaffHome;