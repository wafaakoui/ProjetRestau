import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { FontAwesome5 } from '@expo/vector-icons';
import Sidebar from '../components/Sidebar'; // Adjust path as needed

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const navigation = useNavigation();
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    avgTimePerCheck: '00:00',
    totalCount: 0,
    avgTimePerItem: '00:00',
    foodVsTime: [],
    kitchenVsTime: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const API_URL = 'http://localhost:3000';

  const options = [
    
    { title: 'Users', icon: 'users', screen: 'UserManagement' },
    { title: 'Station', icon: 'tasks', screen: 'Station' },
    { title: 'Menu', icon: 'utensils', screen: 'MenuManagement' },
    { title: 'Order', icon: 'list', screen: 'OrderView' },
     { title: 'Dashboard', icon: 'chart-line', screen: 'Dashboard' },
    { title: 'Logout', icon: 'sign-out-alt', screen: 'Login' },
  ];

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const savedStoreId = await AsyncStorage.getItem('selectedStoreId');
      if (!token || !savedStoreId) {
        Alert.alert('Erreur', 'Veuillez vous reconnecter.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
        return null;
      }
      setStoreId(savedStoreId);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les informations de connexion.');
      return null;
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchDashboardData = async () => {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/dashboard/${storeId}?period=today`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;

      // Calculate average time per item from station stats (if available)
      const avgTimePerItemSeconds =
        data.stationStats && data.stationStats.length > 0
          ? data.stationStats.reduce((sum, station) => sum + station.averageTime, 0) /
            data.stationStats.length
          : 0;

      setDashboardData({
        totalOrders: data.todayStats.totalOrders || 0,
        avgTimePerCheck: formatTime(data.todayStats.averageOrderValue || 0), // Adjust if you have a specific metric
        totalCount: data.todayStats.completedOrders || 0,
        avgTimePerItem: formatTime(avgTimePerItemSeconds),
        foodVsTime: data.topProducts?.map(product => ({
          name: product.name,
          time: product.quantity, // Using quantity as a proxy for time; adjust if needed
        })) || [],
        kitchenVsTime: data.stationStats?.map(station => ({
          name: station.name,
          time: station.averageTime,
        })) || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error.response ? error.response.data : error.message);
      Alert.alert('Erreur', 'Impossible de charger les données du tableau de bord.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const savedStoreId = await AsyncStorage.getItem('selectedStoreId');
      if (savedStoreId) {
        setStoreId(savedStoreId);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchDashboardData();
    }
  }, [storeId]);

  const chartConfigFood = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 105, 180, ${opacity})`, // Pink color for Food vs Time
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.8,
  };

  const chartConfigKitchen = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`, // Red color for Kitchen vs Time
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.8,
  };

  return (
    <View style={styles.container}>
      <Sidebar options={options} />
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E73E01" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <>
            {/* Top Stats */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: '#ADD8E6' }]}>
                <FontAwesome5 name="shopping-cart" size={24} color="#4682B4" />
                <Text style={styles.statValue}>{dashboardData.totalOrders}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FFB6C1' }]}>
                <FontAwesome5 name="clock" size={24} color="#FF69B4" />
                <Text style={styles.statValue}>{dashboardData.avgTimePerCheck}</Text>
                <Text style={styles.statLabel}>Avg Time per Check (mm:ss)</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#90EE90' }]}>
                <FontAwesome5 name="list" size={24} color="#32CD32" />
                <Text style={styles.statValue}>{dashboardData.totalCount}</Text>
                <Text style={styles.statLabel}>Total Count</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FFDAB9' }]}>
                <FontAwesome5 name="utensils" size={24} color="#FF8C00" />
                <Text style={styles.statValue}>{dashboardData.avgTimePerItem}</Text>
                <Text style={styles.statLabel}>Avg Time per Item (mm:ss)</Text>
              </View>
            </View>

            {/* Charts Section */}
            <View style={styles.chartsSection}>
              {/* Food vs Time Chart */}
              {dashboardData.foodVsTime.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Food vs Time</Text>
                  <BarChart
                    data={{
                      labels: dashboardData.foodVsTime.map(item => item.name),
                      datasets: [{ data: dashboardData.foodVsTime.map(item => item.time) }],
                    }}
                    width={width - 240}
                    height={dashboardData.foodVsTime.length * 40 + 50}
                    yAxisLabel=""
                    chartConfig={chartConfigFood}
                    fromZero={true}
                    style={styles.chart}
                    horizontal={true}
                    showValuesOnTopOfBars={true}
                  />
                </View>
              )}

              {/* Time vs Kitchen Display System Chart */}
              {dashboardData.kitchenVsTime.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Time vs Kitchen Display System</Text>
                  <BarChart
                    data={{
                      labels: dashboardData.kitchenVsTime.map(item => item.name),
                      datasets: [{ data: dashboardData.kitchenVsTime.map(item => item.time) }],
                    }}
                    width={width - 240}
                    height={dashboardData.kitchenVsTime.length * 40 + 50}
                    yAxisLabel=""
                    chartConfig={chartConfigKitchen}
                    fromZero={true}
                    style={styles.chart}
                    horizontal={true}
                    showValuesOnTopOfBars={true}
                  />
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F5F5F5' },
  content: { flex: 1, padding: 10 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '23%',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  chartsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    elevation: 2,
    width: '48%',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  chart: {
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#767577',
    marginTop: 10,
  },
});

export default Dashboard;