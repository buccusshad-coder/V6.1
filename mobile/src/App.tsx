import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useStore } from './store';
import { api } from './services/api';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

// App Screens
import DashboardScreen from './screens/app/DashboardScreen';
import WalletsScreen from './screens/app/WalletsScreen';
import PositionsScreen from './screens/app/PositionsScreen';
import AlertsScreen from './screens/app/AlertsScreen';
import PortfolioScreen from './screens/app/PortfolioScreen';
import ProfileScreen from './screens/app/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#fff' },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#667eea',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      tabBarActiveTintColor: '#667eea',
      tabBarInactiveTintColor: '#ccc',
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        title: 'Dashboard',
        tabBarLabel: 'Home',
      }}
    />
    <Tab.Screen
      name="Wallets"
      component={WalletsScreen}
      options={{
        title: 'Wallets',
        tabBarLabel: 'Wallets',
      }}
    />
    <Tab.Screen
      name="Positions"
      component={PositionsScreen}
      options={{
        title: 'Holdings',
        tabBarLabel: 'Holdings',
      }}
    />
    <Tab.Screen
      name="Portfolio"
      component={PortfolioScreen}
      options={{
        title: 'Portfolio',
        tabBarLabel: 'Portfolio',
      }}
    />
    <Tab.Screen
      name="Alerts"
      component={AlertsScreen}
      options={{
        title: 'Alerts',
        tabBarLabel: 'Alerts',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarLabel: 'Profile',
      }}
    />
  </Tab.Navigator>
);

export default function App() {
  const token = useStore((state) => state.token);
  const loadToken = useStore((state) => state.loadToken);

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <NavigationContainer>
      {token ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
