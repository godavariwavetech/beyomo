import React, {useRef, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import messaging from '@react-native-firebase/messaging';

import SplashScreen from '../screens/Splash/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import AccountStatusScreen from '../screens/Auth/AccountStatusScreen';

import HomeScreen from '../screens/Home/HomeScreen';
import BookingsScreen from '../screens/Bookings/BookingsScreen';
import EarningsDashboardScreen from '../screens/Earnings/EarningsDashboardScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

import IncomingRequestScreen from '../screens/Jobs/IncomingRequestScreen';
import AvailableBookingsScreen from '../screens/Jobs/AvailableBookingsScreen';
import JobDetailsScreen from '../screens/Jobs/JobDetailsScreen';
import GoToCustomerScreen from '../screens/Jobs/GoToCustomerScreen';
import JobChecklistScreen from '../screens/Jobs/JobChecklistScreen';
import StartServiceScreen from '../screens/Jobs/StartServiceScreen';
import ActiveJobScreen from '../screens/Jobs/ActiveJobScreen';
import EarningsScreen from '../screens/Jobs/EarningsScreen';

import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import MyReviewsScreen from '../screens/Profile/MyReviewsScreen';
import HelpSupportScreen from '../screens/Profile/HelpSupportScreen';
import AboutUsScreen from '../screens/Profile/AboutUsScreen';

import CitySelectorScreen from '../screens/CitySelector/CitySelectorScreen';
import CustomTabBar from '../components/BottomTabBar/CustomTabBar';
import {setupForegroundHandler, handleNotificationNavigation} from '../services/NotificationsService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{headerShown: false}}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Jobs" component={BookingsScreen} />
    <Tab.Screen name="Earnings" component={EarningsDashboardScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigation = () => {
  const navigationRef = useRef(null);

  useEffect(() => {
    const unsubForeground = setupForegroundHandler();

    const unsubOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      handleNotificationNavigation(remoteMessage.data, navigationRef);
    });

    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) handleNotificationNavigation(remoteMessage.data, navigationRef);
    });

    return () => {
      unsubForeground();
      unsubOpened();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="CitySelector" component={CitySelectorScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="AccountStatus" component={AccountStatusScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AvailableBookings" component={AvailableBookingsScreen} />
        <Stack.Screen name="IncomingRequest" component={IncomingRequestScreen} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
        <Stack.Screen name="GoToCustomer" component={GoToCustomerScreen} />
        <Stack.Screen name="JobChecklist" component={JobChecklistScreen} />
        <Stack.Screen name="StartService" component={StartServiceScreen} />
        <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
        <Stack.Screen name="Earnings" component={EarningsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="AboutUs" component={AboutUsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
