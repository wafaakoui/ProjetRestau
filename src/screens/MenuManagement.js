import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Switch } from 'react-native';
import Sidebar from '../components/Sidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const MenuManagement = () => {
  const navigation = useNavigation();
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: '',
    onConfirm: null,
  });
  const [storeId, setStoreId] = useState(null);

  const PRIMARY_API_URL = 'https://server.eatorder.fr:8000';
  const BASE_URL = 'http://localhost:3000'; // API pour les stations, comme dans Station.js

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserManagement' },
    { title: 'Station', icon: 'tasks', screen: 'Station' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuManagement' },
    { title: 'Order', icon: 'list', screen: 'OrderView' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];

  const fetchCategories = async (storeId) => {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${PRIMARY_API_URL}/client/getMenuByStore/${storeId}`);
      if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
      const data = await response.json();
      const normalizedCategories = (data.categories || data.categorys || []).map((cat) => ({
        ...cat,
        id: cat._id || cat.id || null,
        isActive: cat.availability ?? true,
        assignedStationId: cat.stationId || '',
      }));
      setFilteredCategories(normalizedCategories.filter((cat) => cat.id));
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    } catch (error) {
      alertWithStyle('Error', `Unable to load data: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStations = async (storeId) => {
    if (!storeId) return;
    try {
      const response = await fetch(`${BASE_URL}/getstations/${storeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
      const data = await response.json();
      setStations(data || []);
    } catch (error) {
      alertWithStyle('Error', `Unable to load stations: ${error.message}`, 'error');
    }
  };

  const toggleCategory = async (categoryId) => {
    if (!storeId) return;
    try {
      const currentCategory = filteredCategories.find((cat) => cat.id === categoryId);
      const newValue = !currentCategory.isActive;
      setFilteredCategories((prev) =>
        prev.map((cat) => (cat.id === categoryId ? { ...cat, isActive: newValue } : cat))
      );
      const response = await fetch(`${PRIMARY_API_URL}/manager/category/updateavailabilty`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCategory: categoryId, value: newValue, storeId }),
      });
      if (!response.ok) throw new Error(`Update failed`);
      const updated = await response.json();
      setFilteredCategories((prev) =>
        prev.map((cat) => (cat.id === categoryId ? { ...cat, isActive: updated.availability } : cat))
      );
      alertWithStyle('Success', 'Category updated successfully!', 'success');
    } catch (error) {
      alertWithStyle('Error', `Error updating category: ${error.message}`, 'error');
      fetchCategories(storeId);
    }
  };

  const assignStationToCategory = async (categoryId, stationId) => {
    if (!storeId) return;
    try {
      const response = await fetch(`http://localhost:3000/assignStationToCategory/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, storeId }),
      });
      if (!response.ok) throw new Error(`Failed to assign station`);
      setFilteredCategories((prev) =>
        prev.map((cat) => (cat.id === categoryId ? { ...cat, assignedStationId: stationId } : cat))
      );
      alertWithStyle('Success', 'Station assigned successfully!', 'success');
    } catch (error) {
      alertWithStyle('Error', error.message, 'error');
    }
  };

  const navigateToAddProduct = (category) => {
    navigation.navigate('AddProductScreen', { category });
  };

  const alertWithStyle = (title, message, type = 'info', onConfirm = null) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    const loadStoreId = async () => {
      try {
        const savedStoreId = await AsyncStorage.getItem('selectedStoreId');
        if (savedStoreId) {
          setStoreId(savedStoreId);
          fetchCategories(savedStoreId);
          fetchStations(savedStoreId);
        } else {
          alertWithStyle(
            'Error',
            'No store selected. Please log in again.',
            'error',
            () => navigation.replace('RestaurantAuth')
          );
        }
      } catch (error) {
        alertWithStyle(
          'Error',
          'Unable to load store. Please log in again.',
          'error',
          () => navigation.replace('RestaurantAuth')
        );
      }
    };
    loadStoreId();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (storeId) {
        fetchStations(storeId);
        fetchCategories(storeId);
      }
    }, [storeId])
  );

  const { width } = Dimensions.get('window');
  const fontScale = width > 375 ? 1 : 0.9;

  const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF' },
    content: { flex: 1, padding: 20 },
    header: { fontSize: 28 * fontScale, fontWeight: '700', color: '#000', marginBottom: 20 },
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
    switch: {
      transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [],
    },
    categoryText: {
      flex: 1,
      fontSize: 16 * fontScale,
      color: '#000',
      fontWeight: '500',
      textTransform: 'uppercase',
      marginLeft: 15,
    },
    pickerContainer: {
      flex: 1,
      marginHorizontal: 10,
      borderWidth: 1,
      borderColor: '#E73E01',
      borderRadius: 8,
      backgroundColor: '#FFF',
    },
    picker: {
      height: 40,
      color: '#000',
    },
    arrowIcon: { marginLeft: 10 },
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
  });

  return (
    <View style={styles.container}>
      <Sidebar options={options} />
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#E73E01" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
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
                <Switch
                  value={category.isActive}
                  onValueChange={() => toggleCategory(category.id)}
                  trackColor={{ false: '#D3D3D3', true: '#D2691E' }}
                  thumbColor="#D2691E"
                  style={styles.switch}
                />
                <Text style={styles.categoryText}>{category.name}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={category.assignedStationId || ''}
                    onValueChange={(stationId) => assignStationToCategory(category.id, stationId)}
                    style={styles.picker}
                  >
                    <Picker.Item label="No station" value="" />
                    {stations.map((station) => (
                      <Picker.Item key={station.id} label={station.name} value={station.id} />
                    ))}
                  </Picker>
                </View>
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
                        Confirm
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
                      {customAlert.onConfirm ? 'Cancel' : 'OK'}
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

export default MenuManagement;