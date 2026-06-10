import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
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

  return (
    <View style={[styles.container, {paddingBottom: Math.max(insets.bottom, sw(8))}]}>
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
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
                  <Ionicons
                    name={cfg.iconActive}
                    size={sw(24)}
                    color={ACTIVE_COLOR}
                  />
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
        })}
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
    fontSize: sw(10),
    fontWeight: '400',
    lineHeight: sw(15),
    color: INACTIVE_COLOR,
    textAlign: 'center',
  },

});

export default CustomTabBar;
