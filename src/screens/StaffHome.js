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
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sidebar from '../components/Sidebar';

const { width } = Dimensions.get('window');
const fontScale = width > 375 ? 1 : 0.9;
const ticketSize = 260;
const ticketHeight = 260;

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
  const [checkedItems, setCheckedItems] = useState({});
  const ordersPerPage = 10;
  const serverUrl = 'https://server.eatorder.fr:8000';
  const statusFilters = ['All', 'Pending', 'Ready', 'Missed'];

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
      ready: 'Ready',
      missed: 'Missed',
      rejected: 'Missed',
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
  };

  useEffect(() => {
    const stationData = [
      { name: 'Salade' },
      { name: 'Pizza' },
      { name: 'Burger' },
      { name: 'Riz' },
      { name: 'Pates' },
      { name: 'Japonais' },
      { name: 'Thailande' },
      { name: 'Indien' },
      { name: 'Crepe / Gaufre' },
      { name: 'Tex' },
      { name: 'Boissons' },
      { name: 'Test' },
    ];
    const stationNames = stationData.map((station) => station.name);
    setStations(['All', ...stationNames.map((name) => `Chef de ${name}`)]);
  }, []);

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
        if (!token) {
          Alert.alert('Erreur', 'Aucun token d\'authentification trouvé. Veuillez vous reconnecter.', [
            { text: 'OK', onPress: () => navigation.navigate('Login') },
          ]);
          return;
        }

        console.log(`Fetching orders for store ${storeId}, page ${page}, limit ${ordersPerPage}`);
        const response = await fetch(
          `${serverUrl}/owner/orders/${storeId}?page=${page}&limit=${ordersPerPage}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          console.error('API Error:', data.message || 'No orders found');
          throw new Error(data.message || 'Échec de la récupération des commandes');
        }

        console.log('Raw API response:', data);
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
            station: item.station?.toString().trim() || 'Unknown',
          })) || [],
          totalPrice: order.price_total || 0,
          status: mapStatus(order.status),
          createdAt: order.createdAt,
          clientName: `${order.client_first_name || ''} ${order.client_last_name || ''}`.trim() || 'N/A',
          orderDetails: order.items?.map((item) => `${item.name} x${item.quantity}`).join(', ') || 'No details',
        }));

        const sortedOrders = mappedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log('Mapped and sorted orders:', sortedOrders);
        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error.message);
        Alert.alert('Erreur', 'Impossible de charger les commandes.');
        setOrders([]);
      }
    },
    [storeId, serverUrl, navigation]
  );

  const filterOrders = useCallback(() => {
    let filtered = [...orders];

    console.log(`Filtering with Station: ${currentStation}, Status: ${currentStatus}`);
    if (currentStation !== 'All') {
      const stationName = currentStation.replace('Chef de ', '').toLowerCase();
      filtered = filtered.filter((order) => {
        const hasMatchingItem = order.items.some((item) => {
          const itemStation = item.station?.toLowerCase().trim() || '';
          const matchesStation = itemStation === stationName;
          console.log(
            `Order ${order.orderNumber}, Item: ${item.name}, Station: ${itemStation}, ` +
            `Target: ${stationName}, Matches: ${matchesStation}`
          );
          return matchesStation;
        });
        return hasMatchingItem;
      });
    }

    if (currentStatus !== 'All') {
      filtered = filtered.filter((order) => {
        const matchesStatus = order.status === currentStatus;
        console.log(`Order ${order.orderNumber}, Status: ${order.status}, Target: ${currentStatus}, Matches: ${matchesStatus}`);
        return matchesStatus;
      });
    }

    console.log('Filtered Orders:', filtered.map((o) => o.orderNumber));
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

        await fetchOrders(currentPage);

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
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [currentPage, chefId, fetchOrders, serverUrl]);

  const handlePrintOrder = (order) => {
    Alert.alert('Impression', `Impression de la commande ${order.orderNumber}...`);
    console.log('Printing order:', {
      orderNumber: order.orderNumber,
      clientName: order.clientName,
      items: order.items,
      totalPrice: order.totalPrice,
      status: order.status,
    });
  };

  const handleValidateOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'accepted');
      setModalVisible(false);
      setCheckedItems({});
    } catch (error) {
      console.error('Error validating order:', error);
      Alert.alert('Erreur', 'Impossible de valider la commande.');
    }
  };

  const renderOrderItem = ({ item }) => {
    const statusColors = {
      Ready: { bg: '#e6f4ea', border: '#34c759' },
      Missed: { bg: '#fee2e2', border: '#ff3b30' },
      Pending: { bg: '#fefce8', border: '#f59e0b' },
    };

    const stationName = currentStation !== 'All' ? currentStation.replace('Chef de ', '') : null;
    const displayItems = stationName
      ? item.items.filter((i) => i.station === stationName)
      : item.items;

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
          <Text style={styles.orderTitle}>Commande: {item.orderNumber}</Text>
          <Text style={styles.orderDetails}>
            Articles: {displayItems.map((i) => `${i.name} x${i.quantity}`).join(', ')}
          </Text>
          <Text style={styles.orderDetails}>Statut: {item.status}</Text>
          <Text style={styles.orderDetails}>Date: {item.date}</Text>
          <Text style={styles.orderDetails}>Heure: {item.time}</Text>
          <View style={styles.actionRow}>
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { marginRight: 8 }]}
                onPress={() => {
                  setSelectedOrder(item);
                  setCheckedItems({});
                  setModalVisible(true);
                }}
              >
                <Icon name="info" size={16 * fontScale} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.actionButtonText}>Détails</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePrintOrder(item)}
              >
                <Icon name="print" size={16 * fontScale} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.actionButtonText}>Imprimer</Text>
              </TouchableOpacity>
            </View>
            {item.status === 'Pending' && (
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#34c759' }]}
                  onPress={() => updateOrderStatus(item.id, 'accepted')}
                >
                  <Text style={styles.statusButtonText}>Prêt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#ff3b30' }]}
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

  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;

    const isPending = selectedOrder.status === 'Pending';
    const allItemsChecked = isPending ? selectedOrder.items.every(
      (_, index) => checkedItems[index]
    ) : false;

    return (
      <Modal
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setCheckedItems({});
        }}
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
              {selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                  {isPending ? (
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() => {
                        setCheckedItems((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }));
                      }}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          checkedItems[index] && styles.radioCircleChecked,
                        ]}
                      >
                        {checkedItems[index] && (
                          <View style={styles.radioInnerCircle} />
                        )}
                      </View>
                      <Text style={styles.radioText}>
                        {item.name} x{item.quantity} (Station: {item.station})
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.modalText}>
                      • {item.name} x{item.quantity} (Station: {item.station})
                    </Text>
                  )}
                </View>
              ))}
              <Text style={styles.modalText}>Total: {selectedOrder.totalPrice} EUR</Text>
              <Text style={styles.modalText}>Statut: {selectedOrder.status}</Text>
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              {isPending && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    !allItemsChecked && styles.actionButtonDisabled,
                    { marginRight: 8 },
                  ]}
                  onPress={() => handleValidateOrder(selectedOrder.id)}
                  disabled={!allItemsChecked}
                >
                  <Icon name="check-circle" size={16 * fontScale} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Valider</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.quitButton}
                onPress={() => {
                  setModalVisible(false);
                  setCheckedItems({});
                }}
              >
                <Text style={styles.quitButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
        Page {currentPage} sur {totalPages || 1}
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

  const renderFilterMenu = () => (
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
              setCurrentStatus('All');
              setCurrentPage(1);
            }}
          >
            <Text
              style={[
                styles.stationButtonText,
                currentStation === station && styles.stationButtonTextActive,
              ]}
            >
              {station}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {currentStation !== 'All' && (
        <View style={styles.statusFilter}>
          {statusFilters.map((status) => (
            <TouchableOpacity
              key={`${currentStation}-${status}`}
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
      )}
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
        {renderFilterMenu()}
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
    backgroundColor: '#f8fafc',
  },
  mainContent: {
    flex: 1,
    padding: 24,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 28 * fontScale,
    fontWeight: '700',
    color: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E73E01',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filterContainer: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stationButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E73E01',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  stationButtonActive: {
    backgroundColor: '#E73E01',
    borderColor: '#d32f2f',
  },
  stationButtonText: {
    fontSize: 14 * fontScale,
    color: '#E73E01',
    fontWeight: '500',
  },
  stationButtonTextActive: {
    color: '#ffffff',
  },
  statusFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statusButtonFilter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E73E01',
    backgroundColor: '#f1f5f9',
  },
  statusButtonFilterActive: {
    backgroundColor: '#E73E01',
    borderColor: '#d32f2f',
  },
  statusButtonTextFilter: {
    fontSize: 14 * fontScale,
    color: '#E73E01',
    fontWeight: '500',
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
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  ticketContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderTitle: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  orderDetails: {
    fontSize: 14 * fontScale,
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    width: '100',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#E73E01',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14 * fontScale,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  statusButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  statusButtonText: {
    color: '#ffffff',
    fontSize: 13 * fontScale,
    fontWeight: '600',
  },
  columnWrapper: {
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16 * fontScale,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paginationButton: {
    backgroundColor: '#E73E01',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: 14 * fontScale,
    fontWeight: '600',
  },
  pageIndicator: {
    fontSize: 14 * fontScale,
    color: '#1f2937',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 22 * fontScale,
    fontWeight: '700',
    color: '#E73E01',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15 * fontScale,
    color: '#1f2937',
    marginBottom: 10,
    lineHeight: 22,
  },
  itemContainer: {
    marginBottom: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E73E01',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleChecked: {
    backgroundColor: '#E73E01',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  radioText: {
    fontSize: 15 * fontScale,
    color: '#1f2937',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  quitButton: {
    backgroundColor: '#E73E01',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    flex: 1,
  },
  quitButtonText: {
    fontSize: 15 * fontScale,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

export default StaffHome;