import React, {useContext} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BottomTabBarHeightContext} from '@react-navigation/bottom-tabs';
import {useSelector} from 'react-redux';
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
    <View style={[styles.cartBar, {paddingBottom: bottomInset + sw(6)}]}>
      <View>
        <Text style={styles.cartPrice}>₹{formatAmount(totalPrice)}</Text>
        <View style={styles.cartSubRow}>
          <Text style={styles.cartSubText}>{totalQty} item{totalQty !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.cartAddBtn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddressPayment', {
          // React Navigation merges params into an already-mounted screen rather than
          // clearing them — explicitly null these out so a stale legacy single-flow
          // visit (services/packageId from before) can't leak into cart mode.
          services: undefined, packageId: undefined, packagePrice: undefined, packageTitle: undefined, offerId: undefined,
        })}>
        <Text style={styles.cartAddText}>View Cart</Text>
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
    borderTopWidth: 0.5,
    borderTopColor: '#105641',
    paddingHorizontal: sw(16),
    paddingTop: sw(8),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cartPrice: {fontFamily: fonts.textFont, fontSize: sw(20), fontWeight: '700', color: '#012823'},
  cartSubRow: {flexDirection: 'row', alignItems: 'center', marginTop: sw(2)},
  cartSubText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#454545'},
  cartAddBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(6),
    paddingVertical: sw(8),
    paddingHorizontal: sw(32),
    alignItems: 'center',
    justifyContent: 'center',
    height: sw(35),
  },
  cartAddText: {fontFamily: fonts.textFont, fontSize: sw(16), fontWeight: '500', color: '#FFFFFF', lineHeight: sw(19)},
});
