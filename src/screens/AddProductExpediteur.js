import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddProductExpediteur = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params || {};
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const [storeId, setStoreId] = useState(null);
  const API_BASE_URL = 'https://server.eatorder.fr:8000';

  // Use the passed category or fallback to a default
  const CATEGORY_ID = category?.id;
  const CATEGORY_NAME = category?.name || 'Unknown Category';

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserExpediteur' },
    { title: 'Station', icon: 'tasks', screen: 'StationExpediteur' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuExpediteur' },
    { title: 'Order', icon: 'list', screen: 'ExpediteurView' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];

  // Fetch store ID from AsyncStorage
  const getStoreId = async () => {
    try {
      const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
      const token = await AsyncStorage.getItem('userToken');
      console.log('Selected Store ID:', selectedStoreId);
      console.log('User Token:', token);
      if (!selectedStoreId || !token) {
        alertWithStyle(
          'Erreur',
          'Aucun magasin ou jeton sélectionné. Veuillez vous reconnecter.',
          () => navigation.navigate('RestaurantAuth')
        );
        return null;
      }
      return selectedStoreId;
    } catch (error) {
      console.error('Erreur lors de la récupération du storeId:', error);
      alertWithStyle(
        'Erreur',
        'Impossible de récupérer le magasin sélectionné.',
        () => navigation.navigate('RestaurantAuth')
      );
      return null;
    }
  };

  const fetchProducts = async () => {
    if (!storeId || !CATEGORY_ID) return;
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/manager/menu/getallproductsbycategorybystoreid/${storeId}/${CATEGORY_ID}`;
      console.log('Fetching products from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        if (response.status === 404) {
          throw new Error('Products endpoint not found. Verify storeId, categoryId, or server configuration.');
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(`Expected JSON, received ${contentType}: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const products = (data.products || data.produits || []).map((product) => ({
        ...product,
        id: product._id || product.id,
        name: product.name || 'Unnamed Product',
        description: product.description || '',
        price: product.price || 0,
      }));
      setFilteredProducts(products);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error.message);
      alertWithStyle('Erreur', `Impossible de charger les données: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const alertWithStyle = (title, message, onConfirm) => {
    setCustomAlert({ visible: true, title, message, onConfirm });
  };

  // Initialize storeId and fetch products
  useEffect(() => {
    const initialize = async () => {
      const id = await getStoreId();
      if (id) {
        setStoreId(id);
      }
    };
    initialize();
  }, []);

  // Fetch products when storeId or CATEGORY_ID changes
  useEffect(() => {
    if (storeId && CATEGORY_ID) {
      fetchProducts();
    }
  }, [storeId, CATEGORY_ID]);

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
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    backArrow: {
      marginRight: 15,
    },
    header: {
      fontSize: 28 * fontScale,
      fontWeight: '700',
      color: '#E73E01',
      textAlign: 'left',
    },
    subHeader: {
      fontSize: 16 * fontScale,
      fontWeight: '500',
      color: '#767577',
      textAlign: 'left',
      marginTop: 5,
      textTransform: 'uppercase',
    },
    productList: {
      marginBottom: 20,
    },
    productContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    productDetails: {
      flex: 1,
      marginLeft: 15,
    },
    productName: {
      fontSize: 16 * fontScale,
      fontWeight: '500',
      color: '#000',
      textTransform: 'uppercase',
    },
    productDescription: {
      fontSize: 14 * fontScale,
      color: '#767577',
      marginTop: 2,
    },
    productPrice: {
      fontSize: 14 * fontScale,
      color: '#767577',
      marginTop: 2,
    },
    noProductsText: {
      fontSize: 16 * fontScale,
      color: '#767577',
      textAlign: 'center',
      marginVertical: 20,
    },
    alertOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    alertContainer: {
      width: '85%',
      padding: 25,
      borderRadius: 15,
      backgroundColor: '#FFF',
      borderWidth: 2,
      borderColor: '#000',
    },
    alertTitle: {
      fontSize: 22 * fontScale,
      fontWeight: '700',
      color: '#000',
      marginBottom: 15,
      textAlign: 'center',
    },
    alertMessage: {
      fontSize: 16 * fontScale,
      fontWeight: '500',
      color: '#000',
      marginBottom: 25,
      textAlign: 'center',
    },
    alertButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    alertButtonConfirm: {
      backgroundColor: '#000',
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 10,
      minWidth: 120,
      alignItems: 'center',
    },
    alertButtonCancel: {
      backgroundColor: '#8B5A2B',
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 10,
      minWidth: 120,
      alignItems: 'center',
    },
    alertButtonText: {
      fontSize: 16 * fontScale,
      fontWeight: '600',
      color: '#FFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Sidebar options={options} />
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('MenuExpediteur')}>
            <FontAwesome5 name="arrow-left" size={24} color="#000" style={styles.backArrow} />
          </TouchableOpacity>
          <View>
            <Text style={styles.header}>Produits</Text>
            <Text style={styles.subHeader}>{CATEGORY_NAME.toUpperCase()}</Text>
          </View>
        </View>

        {isLoading || !storeId ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={{ marginTop: 10, fontSize: 16 * fontScale, color: '#767577' }}>
              {storeId ? 'Chargement des produits...' : 'Chargement du magasin...'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.productList}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <View key={product.id} style={styles.productContainer}>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{product.name.toUpperCase()}</Text>
                    <Text style={styles.productDescription}>{product.description}</Text>
                    <Text style={styles.productPrice}>Prix: {product.price}€</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noProductsText}>
                Aucun produit trouvé pour {CATEGORY_NAME}.
              </Text>
            )}
          </ScrollView>
        )}

        {customAlert.visible && (
          <Modal transparent visible={customAlert.visible}>
            <View style={styles.alertOverlay}>
              <View style={styles.alertContainer}>
                <Text style={styles.alertTitle}>{customAlert.title}</Text>
                <Text style={styles.alertMessage}>{customAlert.message}</Text>
                <View style={styles.alertButtons}>
                  {customAlert.onConfirm && (
                    <TouchableOpacity
                      style={styles.alertButtonConfirm}
                      onPress={() => {
                        customAlert.onConfirm();
                        setCustomAlert({ ...customAlert, visible: false });
                      }}
                    >
                      <Text style={styles.alertButtonText}>Confirmer</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.alertButtonCancel}
                    onPress={() => setCustomAlert({ ...customAlert, visible: false })}
                  >
                    <Text style={styles.alertButtonText}>
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

export default AddProductExpediteur;