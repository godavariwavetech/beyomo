import React, {useEffect, useRef} from 'react';
import {View, Animated, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const BONE = '#E0E0E0';
const DARK_BONE = '#1e5c3a';

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

export const HomeScreenSkeleton: React.FC<{insetTop?: number}> = ({insetTop = 0}) => (
  <View style={{flex: 1, backgroundColor: '#F4F6F8'}}>
    {/* Green gradient header */}
    <View style={{
      backgroundColor: '#145C40',
      paddingHorizontal: sw(16),
      paddingTop: insetTop + sw(16),
      paddingBottom: sw(40),
    }}>
      <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: sw(12)}}>
        <SkeletonBox w={sw(58)} h={sw(58)} r={sw(29)} color={DARK_BONE} />
        <View style={{flex: 1, gap: sw(8)}}>
          <SkeletonBox w={sw(100)} h={sw(18)} r={sw(4)} color={DARK_BONE} />
          <SkeletonBox w={sw(70)} h={sw(12)} r={sw(4)} color={DARK_BONE} />
          <SkeletonBox w={sw(80)} h={sw(22)} r={sw(11)} color={DARK_BONE} />
        </View>
        <View style={{alignItems: 'flex-end', gap: sw(6)}}>
          <SkeletonBox w={sw(80)} h={sw(12)} r={sw(4)} color={DARK_BONE} />
          <SkeletonBox w={sw(64)} h={sw(22)} r={sw(4)} color={DARK_BONE} />
        </View>
      </View>
    </View>

    {/* Online card */}
    <View style={{
      marginHorizontal: sw(16),
      marginTop: -sw(22),
      backgroundColor: '#FFFFFF',
      borderRadius: sw(16),
      paddingHorizontal: sw(16),
      paddingVertical: sw(14),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.1,
      shadowRadius: 10,
    }}>
      <View style={{gap: sw(6)}}>
        <SkeletonBox w={sw(120)} h={sw(16)} r={sw(4)} />
        <SkeletonBox w={sw(160)} h={sw(12)} r={sw(4)} />
      </View>
      <SkeletonBox w={sw(60)} h={sw(28)} r={sw(14)} />
    </View>

    {/* Stats card */}
    <View style={{
      marginHorizontal: sw(16),
      marginTop: sw(14),
      backgroundColor: '#FFFFFF',
      borderRadius: sw(16),
      paddingVertical: sw(16),
      paddingHorizontal: sw(8),
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.06,
      shadowRadius: 6,
    }}>
      {[0, 1, 2, 3].map((_, i) => (
        <React.Fragment key={i}>
          <View style={{flex: 1, alignItems: 'center', gap: sw(6)}}>
            <SkeletonBox w={sw(46)} h={sw(46)} r={sw(23)} />
            <SkeletonBox w={sw(36)} h={sw(16)} r={sw(4)} />
            <SkeletonBox w={sw(48)} h={sw(10)} r={sw(4)} />
          </View>
          {i < 3 && <View style={{width: 1, height: sw(50), backgroundColor: '#EBEBEB'}} />}
        </React.Fragment>
      ))}
    </View>

    {/* Section title */}
    <SkeletonBox
      w={sw(100)}
      h={sw(16)}
      r={sw(4)}
      style={{marginHorizontal: sw(16), marginTop: sw(22), marginBottom: sw(12)}}
    />

    {/* Quick links 2×2 grid */}
    <View style={{marginHorizontal: sw(16), gap: sw(12)}}>
      {[0, 1].map(row => (
        <View key={row} style={{flexDirection: 'row', gap: sw(12)}}>
          <SkeletonBox h={sw(148)} r={sw(16)} />
          <SkeletonBox h={sw(148)} r={sw(16)} />
        </View>
      ))}
    </View>
  </View>
);

const JobCardSkeleton: React.FC = () => (
  <View style={{
    backgroundColor: '#FFFFFF',
    borderRadius: sw(14),
    padding: sw(14),
    gap: sw(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: sw(12),
  }}>
    {/* Top: order + status badges */}
    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
      <SkeletonBox w={sw(90)} h={sw(24)} r={sw(20)} />
      <SkeletonBox w={sw(80)} h={sw(24)} r={sw(20)} />
    </View>
    {/* Service name */}
    <SkeletonBox w={sw(160)} h={sw(16)} r={sw(4)} />
    {/* Date + time meta */}
    <SkeletonBox w={sw(200)} h={sw(12)} r={sw(4)} />
    {/* Address */}
    <SkeletonBox w={sw(240)} h={sw(12)} r={sw(4)} />
    {/* Footer */}
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
      paddingTop: sw(10),
    }}>
      <SkeletonBox w={sw(70)} h={sw(17)} r={sw(4)} />
      <SkeletonBox w={sw(100)} h={sw(32)} r={sw(20)} />
    </View>
  </View>
);

export const BookingsScreenSkeleton: React.FC = () => (
  <View style={{flex: 1, paddingHorizontal: sw(16), paddingTop: sw(4)}}>
    <JobCardSkeleton />
    <JobCardSkeleton />
    <JobCardSkeleton />
  </View>
);
