import React, { useState, useEffect, useContext } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../App';

const Sidebar = ({ options }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { logout } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [sidebarAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const currentScreen = route.name;
    const activeIndex = options.findIndex((option) => option.screen === currentScreen);
    setActiveItem(activeIndex !== -1 ? activeIndex : null);
  }, [route.name, options]);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: isSidebarOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isSidebarOpen]);

  const sidebarWidth = sidebarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 200],
  });

  const handlePress = async (screen, index) => {
    if (screen === 'RestaurantAuth') {
      console.log('Logging out...');
      await AsyncStorage.removeItem('userToken'); // Nettoyage du token
      navigation.replace('Login');
      logout(); // Mise à jour du contexte d'auth
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      setActiveItem(index);
      const selectedOption = options[index];
      const title = selectedOption.title || selectedOption.screen;
      navigation.navigate(screen, { pageTitle: title });
    }
  };
  

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Animated.View style={[styles.sidebar, { width: sidebarWidth }]}>
      <TouchableOpacity onPress={toggleSidebar} style={styles.toggleButton}>
        <FontAwesome5
          name={isSidebarOpen ? 'chevron-left' : 'chevron-right'}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handlePress(option.screen, index)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={[
            styles.sidebarItem,
            activeItem === index && styles.activeSidebarItem,
          ]}
        >
          <View style={styles.itemContainer}>
            <FontAwesome5 name={option.icon} size={24} color="#FFFFFF" />
            {isSidebarOpen && (
              <Text style={styles.itemText}>
                {option.title || option.screen}
              </Text>
            )}
            {!isSidebarOpen && hoveredIndex === index && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>{option.title || option.screen}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#333',
    paddingTop: 40,
    height: '100%',
    position: 'relative',
    zIndex: 1000,
  },
  toggleButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  sidebarItem: {
    marginVertical: 20,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeSidebarItem: {
    backgroundColor: '#D2691E',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  tooltip: {
    position: 'absolute',
    left: 70,
    backgroundColor: '#555',
    padding: 5,
    borderRadius: 5,
    zIndex: 1001,
    elevation: 5,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default Sidebar;