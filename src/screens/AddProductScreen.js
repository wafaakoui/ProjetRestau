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
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Switch } from 'react-native';
import Sidebar from '../components/Sidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddProductScreen = () => {
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
  const CATEGORY_NAME = category?.name;

  const options = [
    { title: "Users", icon: "users", screen: "UserManagement" },
    { title: "Station", icon: "tasks", screen: "Station" },
    { title: "Menu", icon: "utensils", screen: "MenuManagement" },
    { title: "Order", icon: "list", screen: "OrderView" },
    { title: "Dashboard", icon: "chart-line", screen: "Dashboard" },
    { title: "Logout", icon: "sign-out-alt", screen: "Login" },
  ];


  // Fetch store ID from AsyncStorage
  const getStoreId = async () => {
    try {
      const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
      console.log('Selected Store ID:', selectedStoreId);
      if (!selectedStoreId) {
        alertWithStyle('Erreur', 'Aucun magasin sélectionné. Veuillez vous reconnecter.');
        navigation.navigate('RestaurantAuth');
        return null;
      }
      return selectedStoreId;
    } catch (error) {
      console.error('Erreur lors de la récupération du storeId:', error);
      alertWithStyle('Erreur', 'Impossible de récupérer le magasin sélectionné.');
      navigation.navigate('RestaurantAuth');
      return null;
    }
  };

  const fetchProducts = async () => {
    if (!storeId || !CATEGORY_ID) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/manager/menu/getallproductsbycategorybystoreid/${storeId}/${CATEGORY_ID}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Réponse non-JSON reçue du serveur');
      }

      const data = await response.json();
      const products = (data.products || data.produits || []).map((product) => ({
        ...product,
        id: product._id || product.id,
        isActive: product.availability ?? true, // Use availability from server
      }));
      setFilteredProducts(products);
    } catch (error) {
      console.error('Erreur lors du chargement des données :', error);
      alertWithStyle('Erreur', `Impossible de charger les données : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProduct = async (productId) => {
    if (!storeId) return;
    try {
      const currentProduct = filteredProducts.find((product) => product.id === productId);
      if (!currentProduct) {
        throw new Error('Produit non trouvé');
      }

      const newValue = !currentProduct.isActive;

      // Optimistic UI update
      const updatedProducts = filteredProducts.map((product) =>
        product.id === productId ? { ...product, isActive: newValue } : product
      );
      setFilteredProducts(updatedProducts);

      // API call
      const response = await fetch(`${API_BASE_URL}/owner/products/${productId}/toggle-availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idProduct: productId,
          value: newValue,
          storeId: storeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Échec de la mise à jour du produit : ${response.status} - ${errorData.error || 'Erreur inconnue'}`);
      }

      const updatedProduct = await response.json();

      // Update product based on actual server response
      setFilteredProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, isActive: updatedProduct.availability } : product
        )
      );

      alertWithStyle('Succès', 'Produit mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit :', error.message);
      alertWithStyle('Erreur', `Erreur lors de la mise à jour : ${error.message}`);
      await fetchProducts(); // Re-fetch to revert to server state
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
    if (storeId) {
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
      color: '#000',
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
    switch: {
      transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [],
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
      borderColor: '#E73E01',
    },
    alertTitle: {
      fontSize: 22 * fontScale,
      fontWeight: '700',
      color: '#E73E01',
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
      backgroundColor: '#E73E01',
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
          <TouchableOpacity onPress={() => navigation.navigate('MenuManagement')}>
            <FontAwesome5 name="arrow-left" size={24} color="#000" style={styles.backArrow} />
          </TouchableOpacity>
          <View>
            <Text style={styles.header}>Produits</Text>
            <Text style={styles.subHeader}>{CATEGORY_NAME.toUpperCase()}</Text>
          </View>
        </View>

        {isLoading || !storeId ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E73E01" />
            <Text style={{ marginTop: 10, fontSize: 16 * fontScale, color: '#767577' }}>
              {storeId ? 'Chargement des produits...' : 'Chargement du magasin...'}
            </Text>
          </View>
        ) : (
          <>
            <ScrollView style={styles.productList}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <View key={product.id} style={styles.productContainer}>
                    <Switch
                      value={product.isActive}
                      onValueChange={() => toggleProduct(product.id)}
                      trackColor={{ false: '#D3D3D3', true: '#D2691E' }}
                      thumbColor="#D2691E"
                      style={styles.switch}
                    />
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{product.name.toUpperCase()}</Text>
                      <Text style={styles.productDescription}>{product.description}</Text>
                      <Text style={styles.productPrice}>Prix : {product.price}€</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noProductsText}>
                  Aucun produit trouvé pour {CATEGORY_NAME}.
                </Text>
              )}
            </ScrollView>
          </>
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

export default AddProductScreen;