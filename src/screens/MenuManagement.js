import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
  Picker,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Switch } from 'react-native';
import Sidebar from '../components/Sidebar';

const MenuManagement = () => {
  const navigation = useNavigation();
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [stations, setStations] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', isActive: true });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const STORE_ID = '67e13ae10ce924cc4a0e0e0a';
  const PRIMARY_API_URL = 'https://server.eatorder.fr:8000';

  // Function to make API requests without fallback
  const fetchWithFallback = async (url, options) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Non-JSON response received from server');
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  };

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserManagement' },
    { title: 'Station', icon: 'tasks', screen: 'CategoryAssignment' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuManagement' },
    { title: 'Order', icon: 'list', screen: 'OrderView' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithFallback(`${PRIMARY_API_URL}/client/getMenuByStore/${STORE_ID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Log API response for debugging
      console.log('Categories API Response:', JSON.stringify(data, null, 2));

      // Normalize category data to ensure consistent id field
      const normalizedCategories = (data.categories || data.categorys || []).map((cat) => ({
        ...cat,
        id: cat._id || cat.id || null, // Handle _id, id, or missing cases
        isActive: cat.isActive ?? true, // Default to true if isActive is undefined
      }));

      // Filter out categories with invalid IDs
      const validCategories = normalizedCategories.filter((cat) => cat.id !== null);

      // Log normalized categories
      console.log('Normalized Categories:', JSON.stringify(validCategories, null, 2));

      setFilteredCategories(validCategories);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching categories:', error);
      alertWithStyle('Erreur', `Impossible de charger les données : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stations
  const fetchStations = async () => {
    try {
      const data = await fetchWithFallback(`${PRIMARY_API_URL}/owner/getstations/${STORE_ID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setStations(data || []);
    } catch (error) {
      console.error('Error fetching stations:', error);
      alertWithStyle('Erreur', `Impossible de charger les stations : ${error.message}`);
    }
  };

  // Toggle category active/inactive status
  const toggleCategory = async (categoryId) => {
    try {
      // Validate categoryId
      if (!categoryId) {
        throw new Error('ID de catégorie invalide');
      }

      // Log categoryId for debugging
      console.log('Toggling category ID:', categoryId);

      // Find the category to update
      const category = filteredCategories.find((cat) => cat.id === categoryId);
      if (!category) {
        throw new Error('Catégorie non trouvée');
      }

      // Determine new isActive state
      const newIsActive = !category.isActive;

      // Update local state
      let updatedCategories;
      if (newIsActive) {
        // If turning ON, set all others to OFF and this one to ON
        updatedCategories = filteredCategories.map((cat) => ({
          ...cat,
          isActive: cat.id === categoryId,
        }));
      } else {
        // If turning OFF, only update this category
        updatedCategories = filteredCategories.map((cat) =>
          cat.id === categoryId ? { ...cat, isActive: false } : cat
        );
      }
      setFilteredCategories(updatedCategories);

      // Send updates to server
      const updatePromises = [];
      if (newIsActive) {
        // Update all categories: OFF except the selected one
        filteredCategories.forEach((cat) => {
          console.log(`Sending PATCH to: ${PRIMARY_API_URL}/client/getMenuByStore/${STORE_ID}/updateCategory/${cat.id}`, {
            isActive: cat.id === categoryId,
          });
          updatePromises.push(
            fetchWithFallback(`${PRIMARY_API_URL}/client/getMenuByStore/${STORE_ID}/updateCategory/${cat.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ isActive: cat.id === categoryId }),
            })
          );
        });
      } else {
        // Update only the toggled category
        console.log(`Sending PATCH to: ${PRIMARY_API_URL}/client/getMenuByStore/${STORE_ID}/updateCategory/${categoryId}`, {
          isActive: false,
        });
        updatePromises.push(
          fetchWithFallback(`${PRIMARY_API_URL}/client/getMenuByStore/${STORE_ID}/updateCategory/${categoryId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: false }),
          })
        );
      }

      await Promise.all(updatePromises);

      alertWithStyle('Succès', 'Catégorie mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      // Revert to server state on error
      await fetchCategories();
      alertWithStyle('Erreur', `Erreur lors de la mise à jour : ${error.message}`);
    }
  };

  // Assign station to category
  const assignStationToCategory = async (categoryId, stationId) => {
    try {
      await fetchWithFallback(`${PRIMARY_API_URL}/client/getMenuByStore/${categoryId}/assign-station`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stationId: stationId || null }),
      });

      // Update local state
      setFilteredCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, assignedStationId: stationId } : cat
        )
      );
      alertWithStyle('Succès', 'Station assignée avec succès !');
    } catch (error) {
      console.error('Error assigning station:', error);
      alertWithStyle('Erreur', `Erreur lors de l'assignation de la station : ${error.message}`);
    }
  };

  // Add a new category
  const addCategory = async () => {
    if (!newCategory.name.trim()) {
      alertWithStyle('Erreur', 'Veuillez entrer un nom pour la catégorie.');
      return;
    }

    try {
      const newCat = {
        name: newCategory.name.toUpperCase(),
        storeId: STORE_ID,
        isActive: newCategory.isActive,
      };

      await fetchWithFallback(`${PRIMARY_API_URL}/client/getMenuByStore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCat),
      });

      await fetchCategories();
      setNewCategory({ name: '', isActive: true });
      setIsAddingCategory(false);
      alertWithStyle('Succès', 'Catégorie ajoutée avec succès !');
    } catch (error) {
      console.error('Error adding category:', error);
      alertWithStyle('Erreur', `Erreur lors de l'ajout : ${error.message}`);
    }
  };

  const navigateToAddProduct = (category) => {
    navigation.navigate('AddProductScreen', { category });
  };

  const alertWithStyle = (title, message, onConfirm) => {
    setCustomAlert({ visible: true, title, message, onConfirm });
  };

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
      fontSize: 14 * fontScale,
      color: '#000',
    },
    arrowIcon: { marginLeft: 10 },
    addButton: {
      backgroundColor: '#E73E01',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
        android: { elevation: 4 },
      }),
    },
    buttonText: {
      fontSize: 16 * fontScale,
      color: '#FFF',
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    addCategoryContainer: {
      marginVertical: 20,
      padding: 20,
      backgroundColor: '#FFF',
      borderRadius: 12,
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
      backgroundColor: '#FFF',
      fontSize: 16 * fontScale,
      color: '#000',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    switchLabel: {
      fontSize: 16 * fontScale,
      color: '#000',
      marginRight: 10,
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

  useEffect(() => {
    fetchCategories();
    fetchStations();
  }, []);

  return (
    <View style={styles.container}>
      <Sidebar options={options} />
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E73E01" />
            <Text style={{ marginTop: 10, fontSize: 16 * fontScale, color: '#767577' }}>
              Chargement des catégories...
            </Text>
          </View>
        ) : (
          <>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.header}>Catégories</Text>
            </Animated.View>

            {filteredCategories.length === 0 ? (
              <Text style={styles.noCategoriesText}>Aucune catégorie trouvée</Text>
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
                    <Text style={styles.categoryText}>{category.name.toUpperCase()}</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={category.assignedStationId || ''}
                        onValueChange={(stationId) => assignStationToCategory(category.id, stationId)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Aucune station" value="" />
                        {stations.map((station) => (
                          <Picker.Item
                            key={station.id}
                            label={station.name}
                            value={station.id}
                          />
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

            {isAddingCategory && (
              <View style={styles.addCategoryContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nom de la catégorie"
                  placeholderTextColor="#8B5A2B"
                  value={newCategory.name}
                  onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
                />
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Activer la catégorie</Text>
                  <Switch
                    value={newCategory.isActive}
                    onValueChange={(value) => setNewCategory({ ...newCategory, isActive: value })}
                    trackColor={{ false: '#D3D3D3', true: '#D2691E' }}
                    thumbColor="#D2691E"
                    style={styles.switch}
                  />
                </View>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity onPress={addCategory} style={styles.addButton}>
                    <Text style={styles.buttonText}>Ajouter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsAddingCategory(false);
                      setNewCategory({ name: '', isActive: true });
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.buttonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!isAddingCategory && (
              <TouchableOpacity onPress={() => setIsAddingCategory(true)} style={styles.addButton}>
                <Text style={styles.buttonText}>Ajouter une catégorie</Text>
              </TouchableOpacity>
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
          </>
        )}
      </View>
    </View>
  );
};

export default MenuManagement;