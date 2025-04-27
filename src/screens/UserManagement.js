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
import Sidebar from '../components/Sidebar';

const API_URL = 'http://localhost:3000'; // Remplacez par process.env.API_URL avec react-native-dotenv en production

const UserManagement = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [modalAnim] = useState(new Animated.Value(0));

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserManagement' },
    { title: 'Station', icon: 'tasks', screen: 'CategoryAssignment' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuManagement' },
    { title: 'Order', icon: 'list', screen: 'OrderView' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];

  const pageTitle = route.params?.pageTitle || 'Gérer les Utilisateurs';

  // Fetch users from the backend
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/usermanager`);
        const data = await response.json();
        if (response.ok) {
          setUsers(data);
        } else {
          console.error('Error fetching users:', data.error);
          Alert.alert('Erreur', data.error || 'Échec de la récupération des utilisateurs.');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Erreur', 'Impossible de se connecter au serveur.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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

  const handleAddOrUpdateUser = async () => {
    if (!newUserName || !newUserPassword || !newUserRole) {
      Alert.alert('Erreur', 'Veuillez entrer un nom, un rôle et un mot de passe.');
      return;
    }
    if (!validRoles.includes(newUserRole)) {
      Alert.alert('Erreur', 'Le rôle doit être Staff ou Expéditeur.');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (editingUser) {
        // Update user
        response = await fetch(`${API_URL}/usermanager/update/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newUserName, role: newUserRole, password: newUserPassword }),
        });
      } else {
        // Add new user
        response = await fetch(`${API_URL}/usermanager/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newUserName, role: newUserRole, password: newUserPassword }),
        });
      }

      const data = await response.json();
      if (response.ok) {
        if (editingUser) {
          setUsers(users.map((user) => (user.id === editingUser.id ? data : user)));
          Alert.alert('Succès', 'Utilisateur modifié avec succès !');
          setEditingUser(null);
        } else {
          setUsers([...users, data]);
          Alert.alert('Succès', 'Utilisateur ajouté avec succès !');
        }
        setNewUserName('');
        setNewUserRole('');
        setNewUserPassword('');
      } else {
        Alert.alert('Erreur', data.error || 'Une erreur est survenue.');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Erreur', 'Échec de l’opération. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteUser = (id) => {
    setUserToDelete(id);
    setDeleteModalVisible(true);
    animateModal(true);
  };

  const deleteUser = async () => {
    if (userToDelete) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/usermanager/delete/${userToDelete}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (response.ok) {
          setUsers(users.filter((user) => user.id !== userToDelete));
          animateModal(false);
          Alert.alert('Succès', 'Utilisateur supprimé avec succès !');
        } else {
          Alert.alert('Erreur', data.error || 'Échec de la suppression.');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        Alert.alert('Erreur', 'Échec de la suppression. Vérifiez votre connexion.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeDeleteModal = () => {
    animateModal(false);
  };

  const editUser = (user) => {
    setNewUserName(user.name);
    setNewUserRole(user.role);
    setNewUserPassword(''); // Ne pas pré-remplir le mot de passe pour des raisons de sécurité
    setEditingUser(user);
  };

  const selectRole = (role) => {
    setNewUserRole(role);
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <Text style={styles.userText} numberOfLines={1} ellipsizeMode="tail">
        {item.name} - Rôle: {item.role}
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
            Êtes-vous sûr de vouloir supprimer "{users.find((user) => user.id === userToDelete)?.name}" ?
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
          placeholder="Nom de l'utilisateur"
          placeholderTextColor="#8B5A2B"
          value={newUserName}
          onChangeText={setNewUserName}
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
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.userList}
        />
        {renderDeleteModal()}
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
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
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28 * fontScale,
    fontWeight: '700',
    color: '#E73E01',
    textAlign: 'center',
    letterSpacing: 1,
  },
  input: {
    height: 50,
    borderColor: '#E73E01',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16 * fontScale,
    color: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#E73E01',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16 * fontScale,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userList: {
    marginBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E73E01',
    minHeight: 60,
  },
  userText: {
    fontSize: 18 * fontScale,
    color: '#000000',
    fontWeight: '600',
    maxWidth: '70%',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  button: {
    marginHorizontal: 8,
    padding: 5,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: '#8B5A2B',
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E73E01',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  roleButtonSelected: {
    backgroundColor: '#E73E01',
  },
  roleButtonText: {
    fontSize: 14 * fontScale,
    fontWeight: '600',
    color: '#E73E01',
  },
  roleButtonTextSelected: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 15,
    width: width * 0.85,
    maxHeight: height * 0.5,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#E73E01',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E73E01',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    margin: -25,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#8B5A2B',
  },
  modalTitle: {
    fontSize: 22 * fontScale,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modalIcon: {
    backgroundColor: 'rgba(231, 62, 1, 0.1)',
    padding: 15,
    borderRadius: 50,
  },
  modalText: {
    fontSize: 16 * fontScale,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalCancelButton: {
    backgroundColor: '#8B5A2B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modalDeleteButton: {
    backgroundColor: '#E73E01',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16 * fontScale,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loader: {
    marginVertical: 20,
  },
});

export default UserManagement;