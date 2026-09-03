import React, {useRef, useState} from 'react';
import {View, Text, Animated, PanResponder, StyleSheet, Dimensions, ActivityIndicator} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

interface Props {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  loading?: boolean;
  /**
   * Track (pill) background color. Default: brand dark green.
   * Use a different color per action e.g. gold for "Service Completed".
   */
  trackColor?: string;
  /**
   * Icon color inside the white thumb — should contrast with the track.
   * Default: same as trackColor.
   */
  iconColor?: string;
}

// Slide-to-confirm button (Uber/Ola-style) — used for irreversible actions like
// starting/completing a service. Prevents accidental taps.
export default function SwipeToConfirm({
  label,
  onConfirm,
  disabled,
  loading,
  trackColor = '#0E5843',
  iconColor,
}: Props) {
  const [trackW, setTrackW] = useState(0);
  const thumbSize = sw(48);
  const pan = useRef(new Animated.Value(0)).current;
  const confirmedRef = useRef(false);

  // Refs so the PanResponder closure (created once) always sees the latest values.
  const trackWRef = useRef(0);
  const disabledRef = useRef(disabled);
  const loadingRef = useRef(loading);
  const onConfirmRef = useRef(onConfirm);
  trackWRef.current = trackW;
  disabledRef.current = disabled;
  loadingRef.current = loading;
  onConfirmRef.current = onConfirm;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current && !loadingRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current && !loadingRef.current,
      onPanResponderMove: (_, g) => {
        const maxSlide = Math.max(0, trackWRef.current - thumbSize - sw(8));
        const x = Math.max(0, Math.min(g.dx, maxSlide));
        pan.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        if (confirmedRef.current) return;
        const maxSlide = Math.max(0, trackWRef.current - thumbSize - sw(8));
        if (g.dx >= maxSlide * 0.75 && maxSlide > 0) {
          confirmedRef.current = true;
          Animated.timing(pan, {toValue: maxSlide, duration: 120, useNativeDriver: false}).start(() => {
            onConfirmRef.current();
            setTimeout(() => {
              confirmedRef.current = false;
              Animated.spring(pan, {toValue: 0, useNativeDriver: false, bounciness: 6}).start();
            }, 1200);
          });
        } else {
          Animated.spring(pan, {toValue: 0, useNativeDriver: false, bounciness: 8}).start();
        }
      },
    }),
  ).current;

  const resolvedIconColor = iconColor ?? trackColor;

  return (
    <View
      style={[styles.track, {backgroundColor: trackColor}]}
      onLayout={e => setTrackW(e.nativeEvent.layout.width)}>
      <Text style={styles.hint} numberOfLines={1}>
        {loading ? 'Please wait…' : label}
      </Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.thumb, {width: thumbSize, height: thumbSize, transform: [{translateX: pan}]}]}>
        {loading ? (
          <ActivityIndicator color={resolvedIconColor} />
        ) : (
          <Ionicons name="arrow-forward" size={sw(20)} color={resolvedIconColor} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: sw(56),
    borderRadius: sw(28),
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  hint: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  thumb: {
    position: 'absolute',
    left: sw(4),
    top: sw(4),
    borderRadius: sw(24),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
