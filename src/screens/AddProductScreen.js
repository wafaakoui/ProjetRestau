import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const AddProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params || {};
  const [filteredProducts, setFilteredProduct] = useState([]);

  const [products, setProducts] = useState([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    isActive: true,
  });
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const API_BASE = 'https://server.eatorder.fr:8000/owner/productByCategory';
  const API_BASE_URL = 'https://server.eatorder.fr:8000';
  const STORE_ID = '67e13ae10ce924cc4a0e0e0a'; // Corrected to match MenuManagement
  const CATEGORY_ID = category?.id || '67e13b6e0ce924cc4a0e8450';
  const CATEGORY_NAME = category?.name || 'Pizza';

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserManagement' },
    { title: 'Station', icon: 'tasks', screen: 'CategoryAssignment' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuManagement' },
    { title: 'Order', icon: 'list', screen: 'OrderView' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/manager/menu/getallproductsbycategorybystoreid/${STORE_ID}/${CATEGORY_ID}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
        }
  
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Réponse non-JSON reçue du serveur');
        }
  
        const data = await response.json();
        setFilteredProduct(data.products || data.produits || []); 
  
      } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
        alertWithStyle('Erreur', `Impossible de charger les données : ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
  
  useEffect(() => {
    fetchProducts();
  }, [CATEGORY_ID]);

  const toggleProduct = async (productId) => {
    try {
      const originalProducts = [...products];
      const updatedProducts = filteredProducts.map((product) =>
        product.id === productId ? { ...product, isActive: !product.isActive } : product
      );
      setProducts(updatedProducts);

      const productExists = updatedProducts.find((prod) => prod.id === productId);
      if (!productExists) {
        throw new Error('Produit non trouvé');
      }
      const response = await axios.get(`${API_BASE_URL}/api/products/${productId}`, {

        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Échec de la mise à jour du produit : ${response.status}`);
      }

      console.log(`Produit ${productId} mis à jour : isActive = ${productExists.isActive}`);
      await fetchProducts();
      alertWithStyle('Succès', 'Produit mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit :', error.message);
      alertWithStyle('Erreur', `Erreur lors de la mise à jour : ${error.message}`);
      setProducts(originalProducts); // Revert on error
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.description.trim() || !newProduct.price.trim()) {
      alertWithStyle('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    const priceValue = parseFloat(newProduct.price);
    if (isNaN(priceValue) || priceValue < 0) {
      alertWithStyle('Erreur', 'Le prix doit être un nombre positif valide.');
      return;
    }

    try {
      const newProd = {
        name: newProduct.name.toUpperCase(),
        description: newProduct.description,
        price: priceValue,
        isActive: newProduct.isActive,
        categoryId: CATEGORY_ID,
        storeId: STORE_ID,
      };

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProd),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Échec de l'ajout du produit : ${response.status}`);
      }

      console.log('Produit ajouté :', result.data);
      await fetchProducts();
      setNewProduct({ name: '', description: '', price: '', isActive: true });
      setIsAddingProduct(false);
      alertWithStyle('Succès', 'Produit ajouté avec succès !');
    } catch (error) {
      console.error('Erreur lors de l’ajout du produit :', error.message);
      alertWithStyle('Erreur', `Erreur lors de l'ajout : ${error.message}`);
    }
  };

  const alertWithStyle = (title, message, onConfirm) => {
    setCustomAlert({ visible: true, title, message, onConfirm });
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
      color: '#000000',
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
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    switch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    productDetails: {
      flex: 1,
      marginLeft: 15,
    },
    productName: {
      fontSize: 16 * fontScale,
      fontWeight: '500',
      color: '#000000',
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
    formContainer: {
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
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    switchLabel: {
      fontSize: 16 * fontScale,
      color: '#000000',
      marginRight: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
  });

  return (
    <View style={styles.container}>
      <Sidebar options={options} />
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('MenuManagement')}>
            <FontAwesome5 name="arrow-left" size={24} color="#000000" style={styles.backArrow} />
          </TouchableOpacity>
          <View>
            <Text style={styles.header}>Produits</Text>
            <Text style={styles.subHeader}>{CATEGORY_NAME.toUpperCase()}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E73E01" />
            <Text style={{ marginTop: 10, fontSize: 16 * fontScale, color: '#767577' }}>
              Chargement des produits...
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
                      trackColor={{ false: '#A9A9A9', true: '#FF4500' }}
                      thumbColor={product.isActive ? '#FFFFFF' : '#FF8C00'}
                      ios_backgroundColor="#A9A9A9"
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

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddingProduct(!isAddingProduct)}
            >
              <Text style={styles.buttonText}>
                {isAddingProduct ? 'Annuler' : `Ajouter un produit ${CATEGORY_NAME}`}
              </Text>
            </TouchableOpacity>

            {isAddingProduct && (
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={`Nom du produit ${CATEGORY_NAME} (ex. Margherita)`}
                  placeholderTextColor="#8B5A2B"
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Description (ex. Tomate, mozzarella, basilic)"
                  placeholderTextColor="#8B5A2B"
                  value={newProduct.description}
                  onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Prix (ex. 9.99)"
                  placeholderTextColor="#8B5A2B"
                  value={newProduct.price}
                  onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                  keyboardType="numeric"
                />
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Actif :</Text>
                  <Switch
                    value={newProduct.isActive}
                    onValueChange={(value) => setNewProduct({ ...newProduct, isActive: value })}
                    trackColor={{ false: '#A9A9A9', true: '#FF4500' }}
                    thumbColor={newProduct.isActive ? '#FFFFFF' : '#FF8C00'}
                    ios_backgroundColor="#A9A9A9"
                    style={styles.switch}
                  />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
                  <Text style={styles.buttonText}>Ajouter un produit {CATEGORY_NAME}</Text>
                </TouchableOpacity>
              </View>
            )}
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