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
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [showStationFilter, setShowStationFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const ordersPerPage = 10;
  const serverUrl = 'https://server.eatorder.fr:8000';
  const statusFilters = ['All', 'Pending', 'Ready', 'Missed'];

  // Fonction pour obtenir la couleur de fond selon l'état sélectionné
  const getBackgroundColorByStatus = (status) => {
    const backgroundColors = {
      'All': '#f8fafc',
      'Pending': '#fefce8',
      'Ready': '#e6f4ea',
      'Missed': '#fee2e2'
    };
    return backgroundColors[status] || '#f8fafc';
  };

  // Fonction pour obtenir la couleur de l'en-tête selon l'état
  const getHeaderColorByStatus = (status) => {
    const headerColors = {
      'All': '#E73E01',
      'Pending': '#f59e0b',
      'Ready': '#34c759',
      'Missed': '#ff3b30'
    };
    return headerColors[status] || '#E73E01';
  };

  // Fonction pour obtenir la couleur des boutons d'action selon l'état
  const getActionButtonColorByStatus = (status) => {
    const buttonColors = {
      'All': '#E73E01',
      'Pending': '#f59e0b',
      'Ready': '#34c759',
      'Missed': '#ff3b30'
    };
    return buttonColors[status] || '#E73E01';
  };

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
      if (order && order.status === mapStatus(newStatus)) return;

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
      
      const statusMap = {
        pending: 'Pending',
        accepted: 'Prête',
        missed: 'Manquée',
      };
      
      Alert.alert('Succès', `Commande marquée comme ${statusMap[newStatus] || newStatus}`);
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

    if (currentStation !== 'All') {
      const stationName = currentStation.replace('Chef de ', '').toLowerCase();
      filtered = filtered.filter((order) => {
        return order.items.some((item) => {
          const itemStation = item.station?.toLowerCase().trim() || '';
          return itemStation === stationName;
        });
      });
    }

    if (currentStatus !== 'All') {
      filtered = filtered.filter((order) => {
        return order.status === currentStatus;
      });
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

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder) return;
    
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      setStatusModalVisible(false);
    } catch (error) {
      console.error('Error changing status:', error);
      Alert.alert('Erreur', 'Impossible de changer le statut');
    }
  };

  // AJOUT: Fonction pour rendre la liste de filtrage
  const renderFilterList = (items, selectedItem, onSelect, visible) => {
    if (!visible) return null;
    
    return (
      <View style={styles.filterListContainer}>
        <ScrollView style={styles.filterScrollView}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterItem,
                selectedItem === item && styles.selectedFilterItem
              ]}
              onPress={() => {
                onSelect(item);
                setShowStationFilter(false);
                setShowStatusFilter(false);
              }}
            >
              <Text style={styles.filterItemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
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

    const actionButtonColor = getActionButtonColorByStatus(currentStatus);

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
                style={[styles.actionButton, { marginRight: 2, backgroundColor: actionButtonColor }]}
                onPress={() => {
                  setSelectedOrder(item);
                  setStatusModalVisible(true);
                }}
              >
                <Text style={styles.actionButtonText}>État</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { marginRight: 2, backgroundColor: actionButtonColor }]}
                onPress={() => {
                  setSelectedOrder(item);
                  setCheckedItems({});
                  setModalVisible(true);
                }}
              >
                <Text style={styles.actionButtonText}>Détails</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: actionButtonColor }]}
                onPress={() => handlePrintOrder(item)}
              >
                <Icon name="print" size={10 * fontScale} color="#ffffff" style={styles.buttonIcon} />
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

    const actionButtonColor = getActionButtonColorByStatus(currentStatus);

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
            <Text style={[styles.modalTitle, { color: getHeaderColorByStatus(currentStatus) }]}>
              Détails de la Commande
            </Text>
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
                          { borderColor: actionButtonColor },
                          checkedItems[index] && { backgroundColor: actionButtonColor },
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
                    { backgroundColor: actionButtonColor },
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
                style={[styles.quitButton, { backgroundColor: actionButtonColor }]}
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

  const renderStatusChangeModal = () => {
    if (!selectedOrder) return null;
    
    const actionButtonColor = getActionButtonColorByStatus(currentStatus);
    
    return (
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.statusModalContent}>
            <Text style={[styles.modalTitle, { color: getHeaderColorByStatus(currentStatus) }]}>
              Changer l'état de la commande
            </Text>
            
            <TouchableOpacity
              style={[styles.statusOption, { borderColor: '#f59e0b' }]}
              onPress={() => handleStatusChange('pending')}
            >
              <Text style={styles.statusOptionText}>Pending</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.statusOption, { borderColor: '#34c759' }]}
              onPress={() => handleStatusChange('accepted')}
            >
              <Text style={styles.statusOptionText}>Ready</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.statusOption, { borderColor: '#ff3b30' }]}
              onPress={() => handleStatusChange('missed')}
            >
              <Text style={styles.statusOptionText}>Missed</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quitButton, { backgroundColor: actionButtonColor }]}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.quitButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const actionButtonColor = getActionButtonColorByStatus(currentStatus);
    
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            { backgroundColor: actionButtonColor },
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
            { backgroundColor: actionButtonColor },
            currentPage >= totalPages && styles.paginationButtonDisabled,
          ]}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <Text style={styles.paginationButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const options = [
    {
      title: 'Toutes les Commandes',
      icon: 'list-alt',
      onPress: () => {
        setCurrentStation('All');
        setCurrentStatus('All');
        setCurrentPage(1);
      },
    },
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

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const numColumns = Math.min(Math.max(Math.floor((width - 40) / ticketSize), 1), 5);

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColorByStatus(currentStatus) }]}>
      <Sidebar
        options={options}
        stations={stations}
        currentStation={currentStation}
        setCurrentStation={setCurrentStation}
        setCurrentStatus={setCurrentStatus}
        setCurrentPage={setCurrentPage}
        statusFilters={statusFilters}
        currentStatus={currentStatus}
      />
      <View style={styles.mainContent}>
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
          <Text style={[styles.header, { backgroundColor: getHeaderColorByStatus(currentStatus) }]}>
            Tableau de Bord du Personnel
          </Text>
        </Animated.View>
        
        {/* AJOUT: Barre de filtres */}
        <View style={styles.filterBar}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {
              setShowStatusFilter(false);
              setShowStationFilter(!showStationFilter);
            }}
          >
            <Text style={styles.filterButtonText}>
              {currentStation === 'All' ? 'Toutes les stations' : currentStation}
            </Text>
            <Icon 
              name={showStationFilter ? 'arrow-drop-up' : 'arrow-drop-down'} 
              size={24} 
              color="#E73E01" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {
              setShowStationFilter(false);
              setShowStatusFilter(!showStatusFilter);
            }}
          >
            <Text style={styles.filterButtonText}>
              {currentStatus === 'All' ? 'Tous les statuts' : currentStatus}
            </Text>
            <Icon 
              name={showStatusFilter ? 'arrow-drop-up' : 'arrow-drop-down'} 
              size={24} 
              color="#E73E01" 
            />
          </TouchableOpacity>
        </View>
        
        {/* AJOUT: Listes de filtrage */}
        {renderFilterList(
          stations, 
          currentStation, 
          (station) => {
            setCurrentStation(station);
            setCurrentPage(1);
          },
          showStationFilter
        )}
        
        {renderFilterList(
          statusFilters, 
          currentStatus, 
          (status) => {
            setCurrentStatus(status);
            setCurrentPage(1);
          },
          showStatusFilter
        )}
        
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
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <Text style={styles.emptyText}>Aucune commande disponible.</Text>
        )}
        {renderOrderDetailsModal()}
        {renderStatusChangeModal()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    // backgroundColor supprimé car maintenant dynamique
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
    // backgroundColor supprimé car maintenant dynamique
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    justifyContent: 'space-between',
  },
  actionButton: {
    // backgroundColor supprimé car maintenant dynamique
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 2,
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
    width: '100%',
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
    // backgroundColor supprimé car maintenant dynamique
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
  statusModalContent: {
    width: '70%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22 * fontScale,
    fontWeight: '700',
    // color supprimé car maintenant dynamique
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
    paddingVertical: 5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    // borderColor supprimé car maintenant dynamique
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleChecked: {
    // backgroundColor supprimé car maintenant dynamique
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
  statusOption: {
    width: '100%',
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    // borderColor supprimé car maintenant dynamique
  },
  statusOptionText: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: '#1f2937',
  },
  quitButton: {
    // backgroundColor supprimé car maintenant dynamique
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  quitButtonText: {
    fontSize: 15 * fontScale,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
    filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: '48%',
  },
  filterButtonText: {
    fontSize: 14 * fontScale,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
    flexShrink: 1,
  },
  filterListContainer: {
    position: 'absolute',
    top: 70,
    left: 8,
    right: 8,
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 5,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterScrollView: {
    maxHeight: 200,
  },
  filterItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedFilterItem: {
    backgroundColor: '#f1f5f9',
  },
  filterItemText: {
    fontSize: 14 * fontScale,
    color: '#1f2937',
  },
});

export default StaffHome;