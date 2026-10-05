import React from 'react';
import {Platform} from 'react-native';
import {store} from '../src/redux/store';
import LoginScreen from '../src/screens/Auth/LoginScreen';
import {
  finishAuthentication,
  browsingDestination,
  isIOSGuest,
  requireIOSAuthentication,
  withIOSAuthentication,
} from '../src/navigation/iosAuthentication';

let mockToken: string | null = null;
jest.mock('react-native', () => ({Platform: {OS: 'ios'}}));
jest.mock('react-redux', () => ({
  useSelector: (select: any) => select({Auth: {token: mockToken}}),
}));
jest.mock('../src/redux/store', () => ({
  store: {getState: jest.fn(() => ({Auth: {token: mockToken}}))},
}));
jest.mock('../src/screens/Auth/LoginScreen', () => ({
  __esModule: true, default: jest.fn(() => null),
}));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: () => ({current: null}),
  useEffect: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({NavigationContainer: 'NavigationContainer'}));
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({Navigator: 'StackNavigator', Screen: 'StackScreen'}),
}));
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({Navigator: 'TabNavigator', Screen: 'TabScreen'}),
}));
jest.mock('@react-native-firebase/messaging', () => jest.fn());
jest.mock('../src/components/BottomTabBar/CustomTabBar', () => jest.fn());
jest.mock('../src/services/NotificationsService', () => ({}));

beforeEach(() => {
  mockToken = null;
  Platform.OS = 'ios';
  jest.clearAllMocks();
});

test('iOS guests enter browsing from startup and city selection', () => {
  expect(browsingDestination(null)).toBe('Main');
  expect(isIOSGuest(null)).toBe(true);
});

test('iOS protected account actions prompt login', () => {
  const navigation = {navigate: jest.fn()};
  const addToCart = jest.fn();
  if (requireIOSAuthentication(navigation)) addToCart();
  expect(navigation.navigate).toHaveBeenCalledWith('Login');
  expect(addToCart).not.toHaveBeenCalled();
});

test('iOS account routes show existing login instead of mounting protected screens', () => {
  const Screen = jest.fn(() => null);
  const Guard = withIOSAuthentication(Screen) as (props: any) => React.ReactElement;
  const props = {navigation: {navigate: jest.fn()}, route: {name: 'AddressPayment'}};
  expect(Guard(props).type).toBe(LoginScreen);
  expect(Guard(props).props).toEqual(props);
  expect(Screen).not.toHaveBeenCalled();
  mockToken = 'signed-in';
  expect(Guard(props).type).toBe(Screen);
  expect(Guard(props).props).toEqual(props);
  mockToken = null;
  expect(Guard(props).type).toBe(LoginScreen);
});

test('signed-in iOS actions and startup retain the original behaviour', () => {
  mockToken = 'signed-in';
  const navigation = {navigate: jest.fn()};
  expect(browsingDestination(mockToken)).toBe('Main');
  expect(requireIOSAuthentication(navigation)).toBe(true);
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test.each([null, 'signed-in'])('Android keeps original startup, screen identity and cart actions (%s)', token => {
  Platform.OS = 'android';
  mockToken = token;
  const Screen = jest.fn(() => null);
  const navigation = {navigate: jest.fn()};
  expect(browsingDestination(token)).toBe(token ? 'Main' : 'Login');
  expect(isIOSGuest(token)).toBe(false);
  expect(withIOSAuthentication(Screen)).toBe(Screen);
  expect(requireIOSAuthentication(navigation)).toBe(true);
  expect(store.getState).not.toHaveBeenCalled();
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('iOS checkout Continue opens login before making any booking request', async () => {
  const fs = require('fs');
  const source = fs.readFileSync(require('path').join(__dirname, '../src/screens/Order/AddressPaymentScreen.tsx'), 'utf8');
  const ast = require('@babel/parser').parse(source, {sourceType: 'module', plugins: ['typescript', 'jsx']});
  let callback: any;
  require('@babel/traverse').default(ast, {VariableDeclarator(p: any) {
    if (p.node.id.name === 'handleBooking') callback = p.node.init;
  }});
  const callbackCode = require('@babel/generator').default(callback).code;
  const {code} = require('@babel/core').transformSync('const action = ' + callbackCode, {filename: 'checkout.ts'});
  const navigation = {navigate: jest.fn()};
  const action = require('vm').runInNewContext(code + '; action;', {require, guest: true, navigation});
  await action();
  expect(navigation.navigate).toHaveBeenCalledWith('Login', {returnToCheckout: true});
});

test('iOS checkout login restores the existing cart route and removes auth history', () => {
  const checkout = {name: 'AddressPayment', key: 'cart-key', params: {offerId: 4}};
  const navigation = {getState: () => ({routes: [{name: 'Main'}, checkout, {name: 'Login'}, {name: 'OTP'}]}), reset: jest.fn()};
  expect(finishAuthentication(navigation, true)).toBe(true);
  expect(navigation.reset).toHaveBeenCalledWith({index: 1, routes: [{name: 'Main'}, checkout]});
  expect(finishAuthentication(navigation, false)).toBe(false);
  Platform.OS = 'android';
  navigation.reset.mockClear();
  expect(finishAuthentication(navigation, true)).toBe(false);
  expect(navigation.reset).not.toHaveBeenCalled();
});

test.each(['ios', 'android'] as const)('%s navigation leaves catalog routes public and protects only iOS account routes', platform => {
  Platform.OS = platform;
  // Load the real navigator while replacing native-heavy screens with sentinels.
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(path.join(__dirname, '../src/navigation/AppNavigation.jsx'), 'utf8');
  const screens: Record<string, any> = {};
  for (const match of source.matchAll(/import (\w+) from '\.\.\/screens\/([^']+)'/g)) {
    if (match[1] === 'LoginScreen') continue;
    const Screen = jest.fn(() => null);
    screens[match[1]] = Screen;
    jest.doMock(`../src/screens/${match[2]}`, () => ({__esModule: true, default: Screen}));
  }
  jest.isolateModules(() => {
    // The RN Jest preset excludes .jsx from its transform pattern. Transform this
    // navigator locally without changing the app's existing Jest configuration.
    const {code} = require('@babel/core').transformSync(source, {filename: 'AppNavigation.js'});
    const compiled = {exports: {} as any};
    const load = (id: string) => require(id.startsWith('.') ? `../src/navigation/${id}` : id);
    require('vm').runInNewContext(code, {require: load, module: compiled, exports: compiled.exports});
    const Navigation = compiled.exports.default;
    const tree = Navigation();
    const stackRoutes = tree.props.children.props.children;
    const main = stackRoutes.find((route: any) => route.props.name === 'Main');
    const tabRoutes = main.props.component().props.children;
    const routes = [...stackRoutes, ...tabRoutes];
    const find = (name: string) => routes.find((route: any) => route.props.name === name).props.component;
    for (const [name, screen] of Object.entries({
      Home: 'HomeScreen', AllCategories: 'AllCategoriesScreen', ServiceListing: 'ServiceListingScreen',
      SubcategoryServices: 'SubcategoryServicesScreen', Search: 'SearchScreen',
      PackageDetail: 'PackageDetailScreen', PackageListing: 'PackageListingScreen',
      CustomPackages: 'CustomPackagesScreen', AddressPayment: 'AddressPaymentScreen', HelpSupport: 'HelpSupportScreen', AboutUs: 'AboutUsScreen',
    })) {
      expect(find(name)).toBe(screens[screen]);
    }
    for (const [name, screen] of Object.entries({
      Bookings: 'BookingsScreen',
      BookingDetail: 'BookingDetailScreen', OrderPlaced: 'OrderPlacedScreen',
      ServiceCompleted: 'ServiceCompletedScreen', Notifications: 'NotificationsScreen',
      EditProfile: 'EditProfileScreen', DeleteAccount: 'DeleteAccountScreen',
      MyAddresses: 'MyAddressesScreen', Coupons: 'CouponsScreen',
      ReferEarn: 'ReferEarnScreen', MyReviews: 'MyReviewsScreen',
    })) {
      const Component = find(name);
      if (platform === 'android') {
        expect(Component).toBe(screens[screen]);
      } else {
        mockToken = null;
        expect(Component({}).type).toBe(LoginScreen);
        mockToken = 'signed-in';
        expect(Component({}).type).toBe(screens[screen]);
      }
    }
  });
});

function screenAction(file: string, handler: string, context: any) {
  const source = require('fs').readFileSync(require('path').join(__dirname, '../src/screens/' + file + '.tsx'), 'utf8');
  const ast = require('@babel/parser').parse(source, {sourceType: 'module', plugins: ['typescript', 'jsx']});
  let callback: any;
  require('@babel/traverse').default(ast, {VariableDeclarator(p: any) {
    if (p.node.id.name === handler) callback = p.node.init;
  }});
  const callbackCode = require('@babel/generator').default(callback).code;
  const {code} = require('@babel/core').transformSync('const action = ' + callbackCode, {filename: 'action.ts'});
  return require('vm').runInNewContext(code + '; action;', {require, ...context});
}

test.each(['ios', 'android'])('%s can add services, combos and custom packages without a login redirect', platform => {
  Platform.OS = platform;
  const navigation = {navigate: jest.fn()};
  const dispatch = jest.fn();
  const cart = {addServicesToCart: (payload: any) => ({type: 'Cart/addServicesToCart', payload}), addPackageToCart: (payload: any) => ({type: 'Cart/addPackageToCart', payload})};
  screenAction('Home/HomeScreen', 'handleAddPopular', {navigation, dispatch, addServicesToCart: cart.addServicesToCart})({id: 1, name: 'Service', basePrice: 600});
  expect(dispatch.mock.calls[0][0].payload[0]).toMatchObject({id: '1', qty: 1});
  expect(navigation.navigate).not.toHaveBeenCalled();
  const fullPkg = {id: 2, title: 'Combo', packageType: 'fixed', price: 900, services: [{serviceId: 1, name: 'Service', price: 600}]};
  screenAction('Packages/PackageDetailScreen', 'handleBook', {navigation, dispatch, fullPkg, packageQty: 1, addPackageToCart: cart.addPackageToCart})();
  expect(dispatch.mock.calls[1][0].payload).toMatchObject({packageId: 2, packageTitle: 'Combo'});
  expect(navigation.navigate).toHaveBeenCalledWith('AddressPayment', expect.anything());
  navigation.navigate.mockClear();
  screenAction('Packages/CustomPackagesScreen', 'handleAdd', {navigation, dispatch, selections: {3: new Set([1])}, getPackageServices: () => [{id: 1, name: 'Service', basePrice: 600}], addPackageToCart: cart.addPackageToCart, setSelections: jest.fn()})({id: 3, title: 'Package', serviceCount: 1, price: 600});
  expect(dispatch.mock.calls[2][0].payload).toMatchObject({packageId: 3, packageType: 'flexible'});
  expect(navigation.navigate).not.toHaveBeenCalled();
});
