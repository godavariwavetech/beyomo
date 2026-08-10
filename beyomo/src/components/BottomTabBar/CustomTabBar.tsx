import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const ACTIVE_COLOR = '#FDD77A';
const INACTIVE_COLOR = '#FFFFFF';
const TAB_BG = '#012823';

type TabConfig = {
  label: string;
  icon: string;
  iconActive: string;
};

const TAB_CONFIG: TabConfig[] = [
  {label: 'Home', icon: 'home-outline', iconActive: 'home'},
  {label: 'Bookings', icon: 'calendar-outline', iconActive: 'calendar'},
  {label: 'Profile', icon: 'person-outline', iconActive: 'person'},
];

type Props = {
  state: any;
  descriptors: any;
  navigation: any;
};

const CustomTabBar = ({state, navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const cartItems = useSelector((s: any) => s.Cart?.items ?? []);
  const cartServices = useSelector((s: any) => s.Cart?.services ?? []);
  const cartCount =
    cartItems.reduce((sum: number, item: any) => sum + item.qty, 0) +
    cartServices.reduce((sum: number, s: any) => sum + s.qty, 0);

  const renderRouteTab = (route: any, index: number) => {
    const isFocused = state.index === index;
    const cfg = TAB_CONFIG[index];

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    if (isFocused) {
      return (
        <TouchableOpacity
          key={route.key}
          onPress={onPress}
          activeOpacity={0.8}
          style={styles.tabActive}>
          {/* Yellow indicator bar + icon stacked */}
          <View style={styles.iconWrapper}>
            <View style={styles.activeBar} />
            <Ionicons name={cfg.iconActive} size={sw(24)} color={ACTIVE_COLOR} />
          </View>
          <Text style={styles.labelActive}>{cfg.label}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.tabInactive}>
        <Ionicons name={cfg.icon} size={sw(22)} color={INACTIVE_COLOR} />
        <Text style={styles.labelInactive}>{cfg.label}</Text>
      </TouchableOpacity>
    );
  };

  const profileIndex = state.routes.findIndex((r: any) => r.name === 'Profile');

  return (
    <View style={[styles.container, {paddingBottom: Math.max(insets.bottom, sw(8))}]}>
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) =>
          index === profileIndex ? null : renderRouteTab(route, index),
        )}

        {/* Cart isn't a routed tab (it's a stack screen, not a persistent tab of its
            own) — this just jumps straight there instead of drilling through package/
            service screens to find a way in. Placed before Profile so Profile stays
            the visually last tab. */}
        <TouchableOpacity
          onPress={() => navigation.navigate('AddressPayment', {
            // Explicitly clear these so a stale legacy single-flow visit elsewhere
            // (services/packageId from before) can't leak into cart mode.
            services: undefined, packageId: undefined, packagePrice: undefined, packageTitle: undefined, offerId: undefined,
          })}
          activeOpacity={0.7}
          style={styles.tabInactive}>
          <View style={styles.cartIconWrapper}>
            <Ionicons name="cart-outline" size={sw(22)} color={INACTIVE_COLOR} />
            {cartCount > 0 && (
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.labelInactive}>Cart</Text>
        </TouchableOpacity>

        {profileIndex !== -1 && renderRouteTab(state.routes[profileIndex], profileIndex)}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: TAB_BG,
    paddingHorizontal: sw(16),
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: sw(62),
  },

  // Active tab: semi-transparent bg, rounded bottom corners
  tabActive: {
    width: sw(66),
    height: sw(62),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: 'center',
    paddingBottom: sw(8),
    gap: sw(4),
  },
  // Yellow bar (2px) stacked above icon, total wrapper = 32px
  iconWrapper: {
    width: sw(24),
    height: sw(32),
    alignItems: 'center',
    gap: sw(6),
  },
  activeBar: {
    width: sw(24),
    height: 2,
    backgroundColor: ACTIVE_COLOR,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  labelActive: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '700',
    lineHeight: sw(18),
    color: ACTIVE_COLOR,
    textAlign: 'center',
  },

  // Inactive tab: centered, slight top offset
  tabInactive: {
    width: sw(66),
    height: sw(62),
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: sw(8),
    gap: sw(4),
  },
  labelInactive: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '400',
    lineHeight: sw(15),
    color: INACTIVE_COLOR,
    textAlign: 'center',
  },

  cartIconWrapper: {position: 'relative'},
  cartCountBadge: {
    position: 'absolute',
    top: -sw(4),
    right: -sw(8),
    minWidth: sw(15),
    height: sw(15),
    borderRadius: sw(8),
    backgroundColor: '#FF2F2F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(3),
    borderWidth: 1,
    borderColor: TAB_BG,
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: sw(11),
    fontWeight: '800',
    fontFamily: fonts.title,
  },
});

export default CustomTabBar;
