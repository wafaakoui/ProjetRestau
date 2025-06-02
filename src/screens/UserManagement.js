import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

// Backend API URL (adjust for your environment)
const API_URL = 'http://localhost:3000'; // Use 'http://10.0.2.2:3000' for Android emulator if needed

const UserManagement = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [modalAnim] = useState(new Animated.Value(0));

  // Sidebar navigation options
  const options = [
    { title: "Users", icon: "users", screen: "UserManagement" },
    { title: "Station", icon: "tasks", screen: "Station" },
    { title: "Menu", icon: "utensils", screen: "MenuManagement" },
    { title: "Order", icon: "list", screen: "OrderView" },
    { title: "Dashboard", icon: "chart-line", screen: "Dashboard" },
    { title: "Logout", icon: "sign-out-alt", screen: "Login" },
  ];

  const pageTitle = route.params?.pageTitle || 'Gérer les Utilisateurs';

  // Retrieve JWT token from AsyncStorage
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Erreur', 'Aucun token trouvé. Veuillez vous reconnecter.');
        navigation.navigate('Login');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      Alert.alert('Erreur', 'Impossible de récupérer le token.');
      navigation.navigate('Login');
      return null;
    }
  };

  // Fade-in animation for page load
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Modal animation for delete confirmation
  const animateModal = (visible) => {
    Animated.spring(modalAnim, {
      toValue: visible ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) {
        setDeleteModalVisible(false);
        setUserToDelete(null);
      }
    });
  };

  const validRoles = ['Staff', 'Expéditeur'];

  // Fetch users from the backend
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/usermanager`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add or update a user
  const handleAddOrUpdateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserRole) {
      Alert.alert('Erreur', 'Veuillez entrer un email, un rôle et un mot de passe.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const payload = {
        email: newUserEmail,
        role: newUserRole,
        password: newUserPassword,
      };

      let response;
      if (editingUser) {
        // Update existing user
        response = await axios.put(
          `${API_URL}/api/update/${editingUser.id}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Add new user
        response = await axios.post(
          `${API_URL}/api/usermanager/add`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      await fetchUsers();
      Alert.alert(
        'Succès',
        editingUser ? 'Utilisateur modifié avec succès !' : 'Utilisateur ajouté avec succès !'
      );

      // Reset form
      setNewUserEmail('');
      setNewUserRole('');
      setNewUserPassword('');
      setEditingUser(null);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.error || 'Une erreur est survenue'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm user deletion
  const confirmDeleteUser = (id) => {
    setUserToDelete(id);
    setDeleteModalVisible(true);
    animateModal(true);
  };

  // Delete a user
  const deleteUser = async () => {
    if (!userToDelete) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      await axios.delete(`${API_URL}/api/delete/${userToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(users.filter((user) => user.id !== userToDelete));
      animateModal(false);
      Alert.alert('Succès', 'Utilisateur supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      const errorMessage = error.response?.data?.error || error.message;
      Alert.alert('Erreur', `Échec de la suppression: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    animateModal(false);
  };

  // Edit a user
  const editUser = (user) => {
    setNewUserEmail(user.email);
    setNewUserRole(user.role);
    setNewUserPassword('');
    setEditingUser(user);
  };

  // Select user role
  const selectRole = (role) => {
    setNewUserRole(role);
  };

  // Render user list item
  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <Text style={styles.userText} numberOfLines={1} ellipsizeMode="tail">
        {item.email} - Rôle: {item.role}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => editUser(item)} style={styles.button} disabled={isLoading}>
          <FontAwesome5 name="edit" size={20} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => confirmDeleteUser(item.id)}
          style={styles.button}
          disabled={isLoading}
        >
          <FontAwesome5 name="trash" size={20} color="#E73E01" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render delete confirmation modal
  const renderDeleteModal = () => (
    <Modal transparent visible={deleteModalVisible} animationType="none">
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  scale: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: modalAnim,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirmer la Suppression</Text>
            <TouchableOpacity onPress={closeDeleteModal} disabled={isLoading}>
              <FontAwesome5 name="times" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalIconContainer}>
            <FontAwesome5 name="trash-alt" size={40} color="#E73E01" style={styles.modalIcon} />
          </View>
          <Text style={styles.modalText}>
            Êtes-vous sûr de vouloir supprimer "{users.find((user) => user.id === userToDelete)?.email || 'Utilisateur'}" ?
          </Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={closeDeleteModal}
              disabled={isLoading}
            >
              <Text style={styles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDeleteButton}
              onPress={deleteUser}
              disabled={isLoading}
            >
              <Text style={styles.modalButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Sidebar options={options} />
      <View style={styles.content}>
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
          <Text style={styles.header}>{pageTitle}</Text>
        </Animated.View>
        {isLoading && <ActivityIndicator size="large" color="#E73E01" style={styles.loader} />}
        <TextInput
          style={styles.input}
          placeholder="Email de l'utilisateur"
          placeholderTextColor="#8B5A2B"
          value={newUserEmail}
          onChangeText={setNewUserEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe de l'utilisateur"
          placeholderTextColor="#8B5A2B"
          value={newUserPassword}
          onChangeText={setNewUserPassword}
          secureTextEntry
          editable={!isLoading}
        />
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Rôle :</Text>
          <View style={styles.roleButtons}>
            {validRoles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleButton, newUserRole === role && styles.roleButtonSelected]}
                onPress={() => selectRole(role)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    newUserRole === role && styles.roleButtonTextSelected,
                  ]}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addButton, isLoading && styles.disabledButton]}
          onPress={handleAddOrUpdateUser}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {editingUser ? 'Modifier' : 'Ajouter'} un utilisateur
          </Text>
        </TouchableOpacity>
        {users.length === 0 ? (
          <Text style={styles.emptyListText}>Aucun utilisateur ajouté pour le moment.</Text>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.userList}
          />
        )}
        {renderDeleteModal()}
      </View>
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E73E01',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roleContainer: {
    marginBottom: 15,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  roleButtonSelected: {
    backgroundColor: '#E73E01',
    borderColor: '#E73E01',
  },
  roleButtonText: {
    fontSize: 16,
    color: '#333',
  },
  roleButtonTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#E73E01',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#B0B0B0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2E2E2E',
    borderRadius: 15,
    padding: 20,
    width: Dimensions.get('window').width * 0.85,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalIconContainer: {
    marginVertical: 20,
  },
  modalIcon: {
    opacity: 0.9,
  },
  modalText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#666',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#E73E01',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default UserManagement;