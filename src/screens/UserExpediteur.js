import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = 'http://localhost:3000'; // Local server for user management

const UserExpediteur = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const options = [
    { title: 'Users', icon: 'users', screen: 'UserExpediteur' },
    { title: 'Station', icon: 'tasks', screen: 'StationExpediteur' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuExpediteur' },
    { title: 'Order', icon: 'list', screen: 'ExpediteurView' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];
  const pageTitle = route.params?.pageTitle || 'Liste des Utilisateurs';

  // Get token from AsyncStorage
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token récupéré:', token);
      if (!token) {
        Alert.alert('Erreur', 'Aucun token trouvé. Veuillez vous reconnecter.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
        return null;
      }
      return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      Alert.alert('Erreur', 'Impossible de récupérer le token.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return null;
    }
  };

  // Animation for page entry
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  // Fetch users
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

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <Text style={styles.userText} numberOfLines={1} ellipsizeMode="tail">
        {item.name} ({item.email}) - Rôle: {item.role}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Sidebar options={options} />
      <View style={styles.content}>
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
          <Text style={styles.header}>{pageTitle}</Text>
        </Animated.View>
        {isLoading && <ActivityIndicator size="large" color="#E73E01" style={styles.loader} />}
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
      </View>
    </View>
  );
};

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
  userList: {
    flex: 1,
  },
  userItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userText: {
    fontSize: 16,
    color: '#333',
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

export default UserExpediteur;