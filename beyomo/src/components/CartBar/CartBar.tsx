import React, {useContext} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BottomTabBarHeightContext} from '@react-navigation/bottom-tabs';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {fonts} from '../../config/theme';
import type {RootState} from '../../redux/store';
import {formatAmount} from '../../utils/utils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

// Bottom-docked bar shown whenever the shared cart has anything in it (packages,
// combos, or plain services) — same look as ServiceListingScreen's own cart bar, for
// a consistent cart UI everywhere. Sits in normal layout flow (not floating/absolute)
// so it stacks below whatever else a screen has at the bottom instead of covering it.
export default function CartBar({navigation}: {navigation: any}) {
  const insets = useSafeAreaInsets();
  // On a tab screen the tab bar sits below this and already pads past the Android
  // navigation bar (CustomTabBar does Math.max(insets.bottom, …)), so adding the inset
  // again would just open a gap. On a plain stack screen — the packages/combos screens —
  // nothing is below us, so the bar (and the View Cart button with it) ran under the
  // three-button navigation bar and couldn't be tapped. This context is undefined
  // outside a tab navigator, which is exactly the case that needs the inset.
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const bottomInset = tabBarHeight == null ? insets.bottom : 0;
  const cartItems = useSelector((state: RootState) => (state as any).Cart?.items ?? []);
  const cartServices = useSelector((state: RootState) => (state as any).Cart?.services ?? []);
  if (cartItems.length === 0 && cartServices.length === 0) return null;

  const totalQty =
    cartItems.reduce((sum: number, item: any) => sum + item.qty, 0) +
    cartServices.reduce((sum: number, s: any) => sum + s.qty, 0);
  const totalPrice =
    cartItems.reduce((sum: number, item: any) => sum + item.packagePrice * item.qty, 0) +
    cartServices.reduce((sum: number, s: any) => sum + (s.isFree ? 0 : s.price * s.qty), 0);

  return (
    <View style={[styles.cartBar, {paddingBottom: bottomInset + sw(10)}]}>
      <View style={styles.cartInfo}>
        <View style={styles.cartIconBadge}>
          <Ionicons name="cart" size={sw(18)} color="#105641" />
          {totalQty > 0 && (
            <View style={styles.cartCountDot}>
              <Text style={styles.cartCountDotText}>{totalQty > 9 ? '9+' : totalQty}</Text>
            </View>
          )}
        </View>
        <View>
          <Text style={styles.cartPrice}>₹{formatAmount(totalPrice)}</Text>
          <Text style={styles.cartSubText}>{totalQty} item{totalQty !== 1 ? 's' : ''} added</Text>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddressPayment', {
          // React Navigation merges params into an already-mounted screen rather than
          // clearing them — explicitly null these out so a stale legacy single-flow
          // visit (services/packageId from before) can't leak into cart mode.
          services: undefined, packageId: undefined, packagePrice: undefined, packageTitle: undefined, offerId: undefined,
        })}>
        <LinearGradient
          colors={['#105641', '#022723']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.cartAddBtn}>
          <Text style={styles.cartAddText}>View Cart</Text>
          <Ionicons name="arrow-forward" size={sw(15)} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: sw(22),
    borderTopRightRadius: sw(22),
    paddingHorizontal: sw(18),
    paddingTop: sw(14),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
  },
  cartInfo: {flexDirection: 'row', alignItems: 'center', gap: sw(10)},
  cartIconBadge: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    backgroundColor: '#EBF5EF',
    borderWidth: 1,
    borderColor: '#C8A84C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountDot: {
    position: 'absolute',
    top: -sw(4),
    right: -sw(4),
    minWidth: sw(16),
    height: sw(16),
    borderRadius: sw(8),
    paddingHorizontal: sw(3),
    backgroundColor: '#C8A84C',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountDotText: {fontFamily: fonts.textFont, fontSize: sw(9), fontWeight: '700', color: '#012823'},
  cartPrice: {fontFamily: fonts.textFont, fontSize: sw(19), fontWeight: '700', color: '#012823'},
  cartSubText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#5C5C5C', marginTop: sw(1)},
  cartAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(6),
    borderRadius: sw(24),
    paddingVertical: sw(10),
    paddingHorizontal: sw(24),
    height: sw(44),
  },
  cartAddText: {fontFamily: fonts.textFont, fontSize: sw(15), fontWeight: '700', color: '#FFFFFF', lineHeight: sw(18)},
});
