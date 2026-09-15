import React, {useRef, useState, useEffect} from 'react';
import {View, Text, Animated, PanResponder, StyleSheet, Dimensions, ActivityIndicator, Easing} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

// The swipe button's green — the track's default color, and the color the track
// settles on as the swipe completes. Named once so the two can't drift apart and no
// second green creeps into the component.
const SWIPE_GREEN = '#0E5843';

interface Props {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  loading?: boolean;
  /**
   * Track (pill) base color. Default: brand dark green.
   * Use a different color per action e.g. gold for "Service Completed".
   * The gradient is derived from this, so callers keep passing one color.
   */
  trackColor?: string;
  /**
   * Explicit gradient stops, when the derived pair isn't the look you want.
   * Overrides trackColor for the track itself.
   */
  trackColors?: string[];
  /**
   * Icon color inside the white thumb — should contrast with the track.
   * Default: same as trackColor.
   */
  iconColor?: string;
  /**
   * Color the track settles on as the swipe progresses, reached at full travel.
   * Defaults to the track's own darkest stop — the dark green already showing at the
   * right-hand end of the pill.
   */
  confirmColor?: string;
}

/**
 * Scale a hex color's channels by `amount` (>1 lightens, <1 darkens).
 * Non-hex input is handed back untouched so a named color still renders.
 */
const shade = (hex: string, amount: number): string => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const num = parseInt(full, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((num >> 16) & 255) * amount);
  const g = clamp(((num >> 8) & 255) * amount);
  const b = clamp((num & 255) * amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

/**
 * Hex to channels, so a color can be rebuilt as rgba() at a varying alpha —
 * Animated can interpolate between two rgba strings but not fade a bare hex.
 * Falls back to the confirm green if handed something it can't parse.
 */
const toRgb = (hex: string): {r: number; g: number; b: number} => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  // Unparseable input falls back to SWIPE_GREEN's own channels rather than some other
  // green, so even the error path can't introduce a colour that isn't already here.
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return {r: 14, g: 88, b: 67};
  const num = parseInt(full, 16);
  return {r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255};
};

// Slide-to-confirm button (Uber/Ola-style) — used for irreversible actions like
// starting/completing a service. Prevents accidental taps.
export default function SwipeToConfirm({
  label,
  onConfirm,
  disabled,
  loading,
  trackColor = SWIPE_GREEN,
  trackColors,
  iconColor,
  confirmColor,
}: Props) {
  const [trackW, setTrackW] = useState(0);
  const thumbSize = sw(48);
  const pan = useRef(new Animated.Value(0)).current;
  // Thumb lift while the finger is down. Shares a transform array with `pan`, so it
  // has to stay on the same (JS) driver — see the note on useNativeDriver below.
  const press = useRef(new Animated.Value(1)).current;
  // Idle "keep going" pulse on the trailing chevrons.
  const pulse = useRef(new Animated.Value(0)).current;
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

  // Every animation here runs on the JS driver, not because it's preferable but
  // because `pan` drives the progress fill's *width* — a layout prop the native
  // driver can't touch. Once one consumer of a value is JS-driven they all must be,
  // and animating two drivers over one node throws at runtime.
  useEffect(() => {
    if (disabled || loading) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false}),
        Animated.timing(pulse, {toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [disabled, loading, pulse]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current && !loadingRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current && !loadingRef.current,
      onPanResponderGrant: () => {
        Animated.spring(press, {toValue: 1.08, useNativeDriver: false, friction: 6, tension: 120}).start();
      },
      onPanResponderMove: (_, g) => {
        const maxSlide = Math.max(0, trackWRef.current - thumbSize - sw(8));
        const x = Math.max(0, Math.min(g.dx, maxSlide));
        pan.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        Animated.spring(press, {toValue: 1, useNativeDriver: false, friction: 6, tension: 120}).start();
        if (confirmedRef.current) return;
        const maxSlide = Math.max(0, trackWRef.current - thumbSize - sw(8));
        if (g.dx >= maxSlide * 0.75 && maxSlide > 0) {
          confirmedRef.current = true;
          // Ease out rather than linear so the last stretch to the end reads as the
          // button completing the gesture for you, not as a jump.
          Animated.timing(pan, {
            toValue: maxSlide,
            duration: 160,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
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
      onPanResponderTerminate: () => {
        Animated.spring(press, {toValue: 1, useNativeDriver: false, friction: 6, tension: 120}).start();
        if (confirmedRef.current) return;
        Animated.spring(pan, {toValue: 0, useNativeDriver: false, bounciness: 8}).start();
      },
    }),
  ).current;

  const resolvedIconColor = iconColor ?? trackColor;
  const gradient = trackColors ?? [shade(trackColor, 1.22), trackColor, shade(trackColor, 0.68)];
  // The dark green already sitting at the right-hand end of the track. Swiping across
  // pulls that same color over the whole pill, so the button ends on a shade it was
  // already wearing rather than on a colour introduced just for the animation.
  const resolvedConfirm = confirmColor ?? gradient[gradient.length - 1];

  // Guarded so the very first render (trackW still 0) doesn't build an interpolation
  // with a zero-width inputRange, which RN rejects.
  const maxSlide = Math.max(1, trackW - thumbSize - sw(8));

  // The fill trails the thumb, so the track visibly "charges" as you drag.
  const fillWidth = Animated.add(pan, thumbSize + sw(8));
  const fillColor = pan.interpolate({
    inputRange: [0, maxSlide],
    outputRange: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.26)'],
    extrapolate: 'clamp',
  });

  // The whole pill washes toward the dark end in step with the swipe: transparent at
  // rest (so the gradient shows through untouched), fully opaque at the end. Tinting
  // the entire track rather than only the swiped part is what makes the button read as
  // recolouring instead of filling like a progress bar — the fill above still supplies
  // the sense of position, just more quietly.
  const confirmRgb = toRgb(resolvedConfirm);
  const washColor = pan.interpolate({
    inputRange: [0, maxSlide],
    outputRange: [
      `rgba(${confirmRgb.r},${confirmRgb.g},${confirmRgb.b},0)`,
      `rgba(${confirmRgb.r},${confirmRgb.g},${confirmRgb.b},1)`,
    ],
    extrapolate: 'clamp',
  });
  // Label clears out well before the end — by then the fill is the feedback.
  const labelOpacity = pan.interpolate({
    inputRange: [0, maxSlide * 0.55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const labelShift = pan.interpolate({
    inputRange: [0, maxSlide],
    outputRange: [0, sw(24)],
    extrapolate: 'clamp',
  });
  const chevronFade = pan.interpolate({
    inputRange: [0, maxSlide * 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const chevronPulse = pulse.interpolate({inputRange: [0, 1], outputRange: [0.35, 0.9]});
  const chevronShift = pulse.interpolate({inputRange: [0, 1], outputRange: [0, sw(5)]});

  return (
    <LinearGradient
      colors={gradient}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={[styles.track, disabled && styles.trackDisabled]}
      onLayout={e => setTrackW(e.nativeEvent.layout.width)}>

      <Animated.View
        style={[StyleSheet.absoluteFill, {backgroundColor: washColor}]}
        pointerEvents="none"
      />

      <Animated.View
        style={[styles.fill, {width: fillWidth, backgroundColor: fillColor}]}
        pointerEvents="none"
      />

      <Animated.Text
        style={[styles.hint, {opacity: loading ? 1 : labelOpacity, transform: [{translateX: labelShift}]}]}
        numberOfLines={1}>
        {loading ? 'Please wait…' : label}
      </Animated.Text>

      {!loading && !disabled && (
        <Animated.View
          style={[styles.chevrons, {opacity: Animated.multiply(chevronFade, chevronPulse), transform: [{translateX: chevronShift}]}]}
          pointerEvents="none">
          <Ionicons name="chevron-forward" size={sw(15)} color="#FFFFFF" style={{opacity: 0.45}} />
          <Ionicons name="chevron-forward" size={sw(15)} color="#FFFFFF" style={{opacity: 0.7, marginLeft: -sw(7)}} />
          <Ionicons name="chevron-forward" size={sw(15)} color="#FFFFFF" style={{marginLeft: -sw(7)}} />
        </Animated.View>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {width: thumbSize, height: thumbSize, transform: [{translateX: pan}, {scale: press}]},
        ]}>
        {loading ? (
          <ActivityIndicator color={resolvedIconColor} />
        ) : (
          // Same chevron as the trailing hint arrows, so the thumb reads as the thing
          // that follows them rather than a differently-shaped icon.
          <Ionicons name="chevron-forward" size={sw(22)} color={resolvedIconColor} />
        )}
      </Animated.View>
    </LinearGradient>
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
  trackDisabled: {opacity: 0.6},
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  hint: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chevrons: {
    position: 'absolute',
    right: sw(18),
    flexDirection: 'row',
    alignItems: 'center',
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
