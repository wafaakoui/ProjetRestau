import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../components/Sidebar';
import io from 'socket.io-client';

const { width } = Dimensions.get('window');
const fontScale = width > 375 ? 1 : 0.9;
const ticketSize = 200;
const ticketHeight = 220;

const OrderView = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const storeId = route.params?.storeId || '67d7fd4a1dca285cd9d0b38d';
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredStatus, setFilteredStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [printPreviewVisible, setPrintPreviewVisible] = useState(false);
  const [printContent, setPrintContent] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [timer, setTimer] = useState(0);

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserManagement' },
    { title: 'Station', icon: 'tasks', screen: 'Station' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuManagement' },
    { title: 'Order', icon: 'list', screen: 'OrderView' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const mapStatus = (status) => {
    if (status === 'pending' || status === 'created') return 'Pending';
    if (status === 'accepted') return 'Ready';
    if (status === 'missed' || status === 'rejected') return 'Missed';
    return status || 'Unknown';
  };

  const fetchOrders = async (page = 1, serverUrl) => {
    try {
      if (!storeId) throw new Error('storeId is missing');
      const url = `${serverUrl}/owner/orders/${storeId}?page=${page}&limit=${ordersPerPage}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || !data) throw new Error(data.message || 'No orders found');

      const mappedOrders = data.map((order, index) => ({
        id: order._id,
        orderNumber: `ORDER-${index + 1 + (page - 1) * ordersPerPage}`,
        uniqueId: order._id,
        time: formatTime(order.createdAt),
        date: formatDate(order.createdAt),
        items: order.items?.map((item) => ({
          name: item.name,
          quantity: item.quantity || 1,
        })) || [],
        totalPrice: order.price_total || 0,
        status: mapStatus(order.status),
        createdAt: order.createdAt,
        clientName: `${order.client_first_name || ''} ${order.client_last_name || ''}`.trim(),
        orderDetails: order.items?.map((item) => `${item.name} x${item.quantity}`).join(', ') || 'No details',
      }));

      const sortedOrders = mappedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  };

  useEffect(() => {
    const setup = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const serverUrl = await AsyncStorage.getItem('selectedServer') || 'https://server.eatorder.fr:8000';
        
        await fetchOrders(currentPage, serverUrl);

        const socket = io(serverUrl, {
          auth: { token },
          transports: ['websocket'],
        });

        socket.on('connect', () => {
          console.log('WebSocket connected for OrderView');
        });

        socket.on('orderUpdate', (updatedOrder) => {
          console.log('Received order update:', updatedOrder);
          // Only fetch if current page data might be affected
          fetchOrders(currentPage, serverUrl);
        });

        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
        });

        socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
        });

        return () => {
          socket.disconnect();
        };
      } catch (error) {
        console.error('Setup error:', error);
        Alert.alert('Error', 'Failed to load orders. Try local server?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Use Local Server',
            onPress: async () => {
              await AsyncStorage.setItem('selectedServer', 'http://localhost:3000');
              fetchOrders(currentPage, 'http://localhost:3000');
            },
          },
        ]);
      }
    };

    setup();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentPage]);

  useEffect(() => {
    let filtered = allOrders;
    if (filteredStatus === 'Pending') {
      filtered = allOrders.filter((order) => order.status === 'Pending');
    } else if (filteredStatus === 'Ready') {
      filtered = allOrders.filter((order) => order.status === 'Ready');
    } else if (filteredStatus === 'Missed') {
      filtered = allOrders.filter((order) => order.status === 'Missed' || order.status === 'rejected');
    }
    setFilteredOrders(filtered);
    // Only reset to page 1 when filter changes, not on every render
    if (filteredStatus) setCurrentPage(1);
  }, [allOrders, filteredStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const printOrder = (orderId) => {
    const order = allOrders.find((o) => o.id === orderId);
    if (order) {
      setPrintContent([order]);
      setPrintPreviewVisible(true);
    } else {
      Alert.alert('Error', 'Order not found');
    }
  };

  const handlePrint = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .order { margin-bottom: 20px; padding: 15px; border: 1px solid #E73E01; border-radius: 8px; background-color: #FFF; }
              .completed { background-color: #d4edda; }
              .in-progress { background-color: #fff3cd; }
              .missed { background-color: #f8d7da; }
              .rejected { background-color: #ffcccc; }
              .date { margin-top: 20px; font-style: italic; color: #666; }
              hr { border: 1px dashed #E73E01; margin: 10px 0; }
              h2 { color: #E73E01; text-align: center; }
              p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <h2>Print Preview</h2>
            ${printContent
              .map(
                (order) => `
              <div class="order ${order.status === 'Ready' ? 'completed' : order.status === 'Missed' ? 'missed' : order.status === 'rejected' ? 'rejected' : 'in-progress'}">
                <p><strong>Order:</strong> ${order.orderNumber}</p>
                <p><strong>Client:</strong> ${order.clientName || 'N/A'}</p>
                <p><strong>Date:</strong> ${order.date}</p>
                <p><strong>Time:</strong> ${order.time}</p>
                <p><strong>Unique ID:</strong> ${order.uniqueId}</p>
                <p><strong>Items:</strong></p>
                <ul>
                  ${order.items.map((item) => `<li>${item.name} x${item.quantity}</li>`).join('')}
                </ul>
                <p><strong>Total:</strong> ${order.totalPrice} EUR</p>
                <p><strong>Status:</strong> ${order.status}</p>
              </div>
            `
              )
              .join('')}
            <p class="date">Printed on: ${new Date().toLocaleString('fr-FR')}</p>
          </body>
        </html>
      `;
      await Print.printAsync({ html });
      Alert.alert('Success', 'Order(s) sent to printer');
    } catch (error) {
      Alert.alert('Error', 'Printing failed: ' + error.message);
    }
    setPrintPreviewVisible(false);
  };

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const numColumns = Math.min(Math.max(Math.floor((width - 40) / ticketSize), 1), 5);

  const renderOrderItem = ({ item }) => {
    const creationTime = new Date(item.createdAt);
    const timeElapsed = Math.floor((new Date() - creationTime) / 1000);
    const minutes = Math.floor(timeElapsed / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (timeElapsed % 60).toString().padStart(2, '0');

    return (
      <Animated.View
        style={[
          kdsStyles.ticketContainer,
          item.status === 'Ready' && { backgroundColor: '#d4edda' },
          (item.status === 'Missed' || item.status === 'rejected') && { backgroundColor: '#f8d7da' },
          { opacity: fadeAnim },
        ]}
      >
        <View style={kdsStyles.ticketHeader}>
          <Text style={kdsStyles.timeDate}>
            {item.time} | {item.date}
          </Text>
          <Text style={kdsStyles.timer}>{`${minutes}:${seconds}`}</Text>
        </View>
        <View style={kdsStyles.ticketContent}>
          <Text style={kdsStyles.orderNumber}>#{item.orderNumber}</Text>
          <Text style={kdsStyles.orderDetails}>Client: {item.clientName || 'N/A'}</Text>
          <Text style={kdsStyles.orderDetails}>Status: {item.status}</Text>
          <Text style={kdsStyles.orderDetails}>Total: {item.totalPrice} EUR</Text>
          <View style={kdsStyles.actionRow}>
            <TouchableOpacity style={kdsStyles.actionButton} onPress={() => printOrder(item.id)}>
              <Text style={kdsStyles.actionButtonText}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={kdsStyles.actionButton}
              onPress={() => {
                setSelectedOrder(item);
                setModalVisible(true);
              }}
            >
              <Text style={kdsStyles.actionButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderPrintPreviewModal = () => (
    <Modal
      visible={printPreviewVisible}
      onRequestClose={() => setPrintPreviewVisible(false)}
      transparent={true}
      animationType="slide"
    >
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.modalContent}>
          <Text style={modalStyles.modalTitle}>Print Preview</Text>
          <Text style={modalStyles.modalText}>
            {printContent.length} order(s) to print
          </Text>
          <ScrollView>
            {printContent.map((order) => (
              <View key={order.id}>
                <Text style={modalStyles.modalText}>Order {order.orderNumber}</Text>
                <Text style={modalStyles.modalText}>Client: {order.clientName || 'N/A'}</Text>
                <Text style={modalStyles.modalText}>Date: {order.date}</Text>
                <Text style={modalStyles.modalText}>Time: {order.time}</Text>
                <Text style={modalStyles.modalText}>Unique ID: {order.uniqueId}</Text>
                <FlatList
                  data={order.items}
                  renderItem={({ item }) => (
                    <Text style={modalStyles.modalText}>
                      {item.name} x{item.quantity}
                    </Text>
                  )}
                  keyExtractor={(item, index) => index.toString()}
                />
                <Text style={modalStyles.modalText}>Total: {order.totalPrice} EUR</Text>
                <Text style={modalStyles.modalText}>Status: {order.status}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <TouchableOpacity
              style={[modalStyles.quitButton, { backgroundColor: '#FF0000' }]}
              onPress={() => setPrintPreviewVisible(false)}
            >
              <Text style={modalStyles.quitButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.acceptButton} onPress={handlePrint}>
              <Text style={modalStyles.acceptButtonText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderModal = () =>
    selectedOrder && (
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
        animationType="slide"
      >
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>Order Details</Text>
            <FlatList
              data={selectedOrder.items}
              renderItem={({ item }) => (
                <Text style={modalStyles.modalText}>
                  • {item.name} x{item.quantity}
                </Text>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
            <TouchableOpacity
              style={modalStyles.quitButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={modalStyles.quitButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  );

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    return (
      <View style={staffStyles.paginationContainer}>
        <TouchableOpacity
          style={[
            staffStyles.paginationButton,
            currentPage === 1 && staffStyles.paginationButtonDisabled,
          ]}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Text style={staffStyles.paginationButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            staffStyles.paginationButton,
            currentPage === totalPages && staffStyles.paginationButtonDisabled,
          ]}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Text style={staffStyles.paginationButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <Sidebar options={options} />
      <View style={{ flex: 1, padding: 20 }}>
        <Animated.View style={[localStyles.headerContainer, { opacity: fadeAnim }]}>
          <Text style={localStyles.header}>Order View</Text>
        </Animated.View>
        <View style={staffStyles.filterContainer}>
          {['', 'Pending', 'Ready', 'Missed'].map((status) => (
            <TouchableOpacity
              key={status || 'all'}
              style={[
                staffStyles.filterButton,
                filteredStatus === status && staffStyles.filterButtonActive,
                filteredStatus === status && {
                  backgroundColor: status === 'Ready' ? '#d4edda' : status === 'Missed' ? '#f8d7da' : '#E73E01',
                },
              ]}
              onPress={() => setFilteredStatus(status)}
              accessibilityLabel={`Filter by ${status || 'ALL'}`}
            >
              <Text
                style={[
                  staffStyles.filterText,
                  filteredStatus === status && staffStyles.filterTextActive,
                  filteredStatus === status && {
                    color: status === 'Ready' ? '#333' : status === 'Missed' ? '#333' : '#FFFFFF',
                  },
                ]}
              >
                {status || 'ALL'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {filteredOrders.length > 0 ? (
          <>
            <FlatList
              data={paginatedOrders}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              columnWrapperStyle={kdsStyles.columnWrapper}
              ListEmptyComponent={<Text style={staffStyles.emptyText}>No orders found</Text>}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages || 1}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <Text style={staffStyles.emptyText}>No orders</Text>
        )}
        {renderPrintPreviewModal()}
        {renderModal()}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  headerContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28 * fontScale,
    fontWeight: '700',
    color: '#E73E01',
    textAlign: 'center',
    letterSpacing: 1,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
});

const kdsStyles = StyleSheet.create({
  ticketContainer: {
    width: ticketSize,
    height: ticketHeight,
    margin: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E73E01',
    justifyContent: 'space-between',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    padding: 5,
    borderRadius: 4,
    marginBottom: 8,
  },
  timeDate: {
    fontSize: 10 * fontScale,
    color: '#E73E01',
    fontWeight: '600',
  },
  orderNumber: {
    fontSize: 12 * fontScale,
    fontWeight: '700',
    color: '#E73E01',
  },
  timer: {
    fontSize: 10 * fontScale,
    color: '#555',
    fontWeight: '600',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  ticketContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderDetails: {
    fontSize: 10 * fontScale,
    color: '#333',
    marginBottom: 4,
    lineHeight: 12 * fontScale,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#E73E01',
    borderRadius: 15,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 10 * fontScale,
    fontWeight: '600',
  },
  columnWrapper: {
    justifyContent: 'center',
  },
});

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
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
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    elevation: 2,
  },
  acceptButtonText: {
    fontSize: 14 * fontScale,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

const staffStyles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'center',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    marginBottom: 10,
  },
  filterButtonActive: {
    borderWidth: 2,
    borderColor: '#E73E01',
  },
  filterText: {
    fontSize: 12 * fontScale,
    color: '#333',
    textTransform: 'uppercase',
  },
  filterTextActive: {
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16 * fontScale,
    color: 'gray',
    textAlign: 'center',
    marginVertical: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  paginationButton: {
    backgroundColor: '#E73E01',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 12 * fontScale,
    fontWeight: '600',
  },
});

export default OrderView;