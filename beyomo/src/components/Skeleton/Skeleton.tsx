import React, {useEffect, useRef} from 'react';
import {View, Animated, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const BONE = '#E0E0E0';
const DARK_BONE = '#1e4a3c';

interface BoxProps {
  w?: number | string;
  h?: number;
  r?: number;
  color?: string;
  style?: object;
}

export const SkeletonBox: React.FC<BoxProps> = ({w, h = 16, r = 8, color = BONE, style}) => {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {toValue: 0.85, duration: 750, useNativeDriver: true}),
        Animated.timing(anim, {toValue: 0.4, duration: 750, useNativeDriver: true}),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, [anim]);

  return (
    <Animated.View
      style={[
        {backgroundColor: color, borderRadius: r, height: h, opacity: anim},
        w !== undefined ? {width: w as number} : {flex: 1},
        style,
      ]}
    />
  );
};

export const HomeScreenSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{flex: 1, backgroundColor: '#FCF8F3'}}>
      {/* Dark header section */}
      <View style={{
        backgroundColor: '#012823',
        paddingTop: insets.top,
        paddingBottom: sw(24),
        paddingHorizontal: sw(16),
      }}>
        {/* Header row */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: sw(14),
        }}>
          <SkeletonBox w={sw(24)} h={sw(24)} r={sw(4)} color={DARK_BONE} />
          <SkeletonBox w={sw(110)} h={sw(30)} r={sw(6)} color={DARK_BONE} />
          <SkeletonBox w={sw(52)} h={sw(28)} r={sw(4)} color={DARK_BONE} />
        </View>
        {/* Banner */}
        <SkeletonBox w={width - sw(32)} h={sw(148)} r={sw(16)} color={DARK_BONE} />
        {/* Dots */}
        <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: sw(8), gap: sw(6)}}>
          <SkeletonBox w={sw(18)} h={sw(6)} r={sw(3)} color={DARK_BONE} />
          <SkeletonBox w={sw(6)} h={sw(6)} r={sw(3)} color={DARK_BONE} />
          <SkeletonBox w={sw(6)} h={sw(6)} r={sw(3)} color={DARK_BONE} />
        </View>
      </View>

      {/* Services section */}
      <View style={{paddingHorizontal: sw(16), paddingTop: sw(24)}}>
        <SkeletonBox w={sw(120)} h={sw(20)} r={sw(4)} style={{marginBottom: sw(6)}} />
        <SkeletonBox w={sw(30)} h={2} r={1} style={{marginBottom: sw(20)}} />
        {[0, 1].map(row => (
          <View key={row} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: sw(16),
          }}>
            {[0, 1, 2, 3].map(col => (
              <View key={col} style={{width: sw(80), alignItems: 'center', gap: sw(8)}}>
                <SkeletonBox w={sw(80)} h={sw(80)} r={sw(12)} />
                <SkeletonBox w={sw(56)} h={sw(12)} r={sw(4)} />
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Promo cards */}
      <View style={{flexDirection: 'row', paddingHorizontal: sw(16), paddingTop: sw(8), gap: sw(12)}}>
        <SkeletonBox h={sw(139)} r={sw(12)} />
        <SkeletonBox h={sw(139)} r={sw(12)} />
      </View>
    </View>
  );
};

const BookingCardSkeleton: React.FC = () => (
  <View style={{
    backgroundColor: '#FEFEFE',
    borderRadius: sw(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    overflow: 'hidden',
    marginBottom: sw(16),
  }}>
    <View style={{padding: sw(12), gap: sw(12)}}>
      {/* Row 1 */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <SkeletonBox w={sw(100)} h={sw(10)} r={sw(4)} />
        <SkeletonBox w={sw(16)} h={sw(16)} r={sw(8)} />
      </View>
      {/* Row 2: code + badge */}
      <View style={{flexDirection: 'row', alignItems: 'center', gap: sw(8)}}>
        <SkeletonBox w={sw(90)} h={sw(14)} r={sw(4)} />
        <SkeletonBox w={sw(72)} h={sw(22)} r={sw(16)} />
      </View>
      {/* Row 3: meta */}
      <SkeletonBox w={sw(220)} h={sw(12)} r={sw(4)} />
      {/* Row 4: price + button */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <SkeletonBox w={sw(60)} h={sw(16)} r={sw(4)} />
        <SkeletonBox w={sw(92)} h={sw(26)} r={sw(16)} />
      </View>
    </View>
    {/* Action strip */}
    <View style={{
      flexDirection: 'row',
      gap: sw(8),
      paddingHorizontal: sw(16),
      paddingVertical: sw(12),
      borderTopWidth: 0.5,
      borderTopColor: '#EBEBEB',
    }}>
      <SkeletonBox h={sw(18)} r={sw(4)} />
      <SkeletonBox h={sw(18)} r={sw(4)} />
      <SkeletonBox h={sw(18)} r={sw(4)} />
    </View>
  </View>
);

export const BookingsScreenSkeleton: React.FC = () => (
  <View style={{flex: 1, paddingHorizontal: sw(16), paddingTop: sw(4)}}>
    <BookingCardSkeleton />
    <BookingCardSkeleton />
    <BookingCardSkeleton />
  </View>
);
