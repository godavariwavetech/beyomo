import React, {useRef, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import messaging from '@react-native-firebase/messaging';

import SplashScreen from '../screens/Splash/SplashScreen';
import ForceUpdateScreen from '../screens/ForceUpdate/ForceUpdateScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

import HomeScreen from '../screens/Home/HomeScreen';
import BookingsScreen from '../screens/Bookings/BookingsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

import ServiceListingScreen from '../screens/Services/ServiceListingScreen';
import AddressPaymentScreen from '../screens/Order/AddressPaymentScreen';
import OrderPlacedScreen from '../screens/Order/OrderPlacedScreen';
import BookingDetailScreen from '../screens/Bookings/BookingDetailScreen';
import ServiceCompletedScreen from '../screens/Order/ServiceCompletedScreen';

import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import MyAddressesScreen from '../screens/Profile/MyAddressesScreen';
import CouponsScreen from '../screens/Profile/CouponsScreen';
import ReferEarnScreen from '../screens/Profile/ReferEarnScreen';
import MyReviewsScreen from '../screens/Profile/MyReviewsScreen';
import HelpSupportScreen from '../screens/Profile/HelpSupportScreen';
import AboutUsScreen from '../screens/Profile/AboutUsScreen';

import CitySelectorScreen from '../screens/CitySelector/CitySelectorScreen';
import PackageDetailScreen from '../screens/Packages/PackageDetailScreen';
import PackageListingScreen from '../screens/Packages/PackageListingScreen';
import CustomPackagesScreen from '../screens/Packages/CustomPackagesScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import CustomTabBar from '../components/BottomTabBar/CustomTabBar';
import {setupForegroundHandler, handleNotificationNavigation} from '../services/NotificationsService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{headerShown: false}}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Bookings" component={BookingsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigation = () => {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Foreground notification display
    const unsubForeground = setupForegroundHandler();

    // Tapped while app was in background
    const unsubOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      handleNotificationNavigation(remoteMessage.data, navigationRef);
    });

    // Tapped while app was quit
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
        <Stack.Screen name="ForceUpdate" component={ForceUpdateScreen} options={{gestureEnabled: false}} />
        <Stack.Screen name="CitySelector" component={CitySelectorScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ServiceListing" component={ServiceListingScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
        <Stack.Screen name="PackageListing" component={PackageListingScreen} />
        <Stack.Screen name="CustomPackages" component={CustomPackagesScreen} />
        <Stack.Screen name="AddressPayment" component={AddressPaymentScreen} />
        <Stack.Screen name="OrderPlaced" component={OrderPlacedScreen} />
        <Stack.Screen name="ServiceCompleted" component={ServiceCompletedScreen} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="MyAddresses" component={MyAddressesScreen} />
        <Stack.Screen name="Coupons" component={CouponsScreen} />
        <Stack.Screen name="ReferEarn" component={ReferEarnScreen} />
        <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="AboutUs" component={AboutUsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
