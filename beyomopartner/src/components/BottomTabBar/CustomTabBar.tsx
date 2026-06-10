import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const ACTIVE_COLOR = '#022723';
const INACTIVE_COLOR = '#9E9E9E';

const TAB_CONFIG = [
  {label: 'Home',     icon: 'home-outline',     iconActive: 'home'},
  {label: 'Jobs',     icon: 'briefcase-outline', iconActive: 'briefcase'},
  {label: 'Earnings', icon: 'wallet-outline',    iconActive: 'wallet'},
  {label: 'Profile',  icon: 'person-outline',    iconActive: 'person'},
];

type Props = {state: any; descriptors: any; navigation: any};

const CustomTabBar = ({state, navigation}: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {paddingBottom: Math.max(insets.bottom, sw(6))}]}>
      {/* top separator */}
      <View style={styles.topBorder} />
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const cfg = TAB_CONFIG[index];
          if (!cfg) return null;

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

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tab}>
              {/* active indicator dot above icon */}
              {isFocused && <View style={styles.activeDot} />}
              <Ionicons
                name={isFocused ? (cfg.iconActive as any) : (cfg.icon as any)}
                size={sw(22)}
                color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
              <Text style={[styles.label, {color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  topBorder: {
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  tabRow: {
    flexDirection: 'row',
    height: sw(58),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(3),
    paddingTop: sw(6),
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: sw(28),
    height: sw(3),
    borderRadius: sw(2),
    backgroundColor: ACTIVE_COLOR,
  },
  label: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    fontWeight: '500',
    lineHeight: sw(14),
    textAlign: 'center',
  },
});

export default CustomTabBar;
