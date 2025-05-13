import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MenuExpediteur = () => {
  const navigation = useNavigation();
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const [storeId, setStoreId] = useState(null);

  // API URL
  const PRIMARY_API_URL = 'https://server.eatorder.fr:8000';

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserExpediteur' },
    { title: 'Station', icon: 'tasks', screen: 'StationExpediteur' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuExpediteur' },
    { title: 'Order', icon: 'list', screen: 'ExpediteurView' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];

  // Fetch categories
  const fetchCategories = async (storeId) => {
    if (!storeId) {
      console.error('No storeId provided');
      return;
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${PRIMARY_API_URL}/client/getMenuByStore/${storeId}`;
      console.log('Fetching categories from:', url);

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
          throw new Error('Menu endpoint not found. Verify storeId or server configuration.');
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(`Expected JSON, received ${contentType}: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const normalizedCategories = (data.categories || data.categorys || []).map((cat) => ({
        ...cat,
        id: cat._id || cat.id || null,
        name: cat.name || 'Unnamed Category',
      }));

      const validCategories = normalizedCategories.filter((cat) => cat.id !== null);
      console.log('Fetched categories:', validCategories);
      setFilteredCategories(validCategories);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching categories:', error.message);
      alertWithStyle('Error', `Unable to load categories: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToAddProduct = (category) => {
    navigation.navigate('AddProductExpediteur', { category });
  };

  const alertWithStyle = (title, message, onConfirm) => {
    setCustomAlert({ visible: true, title, message, onConfirm });
  };

  // Initialize storeId and fetch data
  useEffect(() => {
    const loadStoreId = async () => {
      try {
        const savedStoreId = await AsyncStorage.getItem('selectedStoreId');
        const token = await AsyncStorage.getItem('userToken');
        if (savedStoreId && token) {
          setStoreId(savedStoreId);
          fetchCategories(savedStoreId);
        } else {
          alertWithStyle(
            'Error',
            'No store or token selected. Please log in again.',
            () => navigation.replace('RestaurantAuth')
          );
        }
      } catch (error) {
        console.error('Error retrieving storeId:', error);
        alertWithStyle(
          'Error',
          'Unable to load store. Please log in again.',
          () => navigation.replace('RestaurantAuth')
        );
      }
    };

    loadStoreId();
  }, [navigation]);

  const { width } = Dimensions.get('window');
  const fontScale = width > 375 ? 1 : 0.9;

  const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF' },
    content: { flex: 1, padding: 20 },
    header: { fontSize: 28 * fontScale, fontWeight: '700', color: '#E73E01', marginBottom: 20 },
    noCategoriesText: { fontSize: 16 * fontScale, color: '#767577', textAlign: 'center', marginVertical: 20 },
    categoryList: { marginBottom: 20 },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    categoryText: {
      flex: 1,
      fontSize: 16 * fontScale,
      color: '#000',
      fontWeight: '500',
      textTransform: 'uppercase',
      marginLeft: 15,
    },
    arrowIcon: { marginLeft: 10 },
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E73E01" />
            <Text style={{ marginTop: 10, fontSize: 16 * fontScale, color: '#767577' }}>
              Loading categories...
            </Text>
          </View>
        ) : (
          <>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.header}>Categories</Text>
            </Animated.View>

            {!storeId ? (
              <Text style={styles.noCategoriesText}>No store selected</Text>
            ) : filteredCategories.length === 0 ? (
              <Text style={styles.noCategoriesText}>No categories found</Text>
            ) : (
              <ScrollView style={styles.categoryList}>
                {filteredCategories.map((category) => (
                  <View key={category.id} style={styles.categoryItem}>
                    <Text style={styles.categoryText}>{category.name.toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => navigateToAddProduct(category)}>
                      <FontAwesome5 name="chevron-right" size={20} color="#767577" style={styles.arrowIcon} />
                    </TouchableOpacity>
                  </View>
                ))}
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
                          <Text style={styles.alertButtonText}>Confirm</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.alertButtonCancel}
                        onPress={() => setCustomAlert({ ...customAlert, visible: false })}
                      >
                        <Text style={styles.alertButtonText}>
                          {customAlert.onConfirm ? 'Cancel' : 'OK'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default MenuExpediteur;