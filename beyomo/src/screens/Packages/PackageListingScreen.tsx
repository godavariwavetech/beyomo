import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import CartBar from '../../components/CartBar/CartBar';
import type {RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

interface Props {
  navigation: any;
  route: any;
}

// packageType: 'flexible' packages are the "build your own" custom bundles,
// 'fixed' packages are the ready-made combos — same split PackageDetailScreen uses.
const PackageListingScreen = ({navigation, route}: Props) => {
  const insets = useSafeAreaInsets();
  const packageType: 'fixed' | 'flexible' = route?.params?.packageType ?? 'fixed';
  const title: string = route?.params?.title ?? (packageType === 'flexible' ? 'Custom Packages' : 'Combos');
  const selectedCity = useSelector((state: RootState) => state.City?.selectedCity);

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const cityParam = selectedCity?.id ? `?cityId=${selectedCity.id}` : '';
    api
      .get(`${endpoints.PACKAGES}${cityParam}`)
      .then(res => {
        if (res.data?.status) setPackages(res.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCity?.id, packageType]);

  const filtered = packages
    .filter(p => p.packageType === packageType)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCF8F3" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#171816" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#105641" style={{marginTop: sw(40)}} />
      ) : packageType === 'fixed' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.comboScrollContent}
          showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No combos available right now.</Text>
          ) : (
            <View style={styles.comboGrid}>
              {filtered.map((combo: any) => (
                <TouchableOpacity
                  key={combo.id}
                  style={styles.comboCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PackageDetail', {package: combo})}>
                  <View style={styles.comboHeader}>
                    <Text style={styles.comboHeaderText} numberOfLines={2}>
                      {(combo.title ?? '').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.comboPriceBand}>
                    <Text style={styles.comboPriceText}>₹{Math.round(combo.price)}</Text>
                  </View>
                  <View style={styles.comboBody}>
                    {(combo.services ?? []).map((svc: any, idx: number) => (
                      <Text key={idx} style={styles.comboServiceText}>
                        {idx + 1}. {svc.name}
                      </Text>
                    ))}
                    <View style={styles.comboBookRow}>
                      <Text style={styles.comboBookText}>Book Now</Text>
                      <Ionicons name="arrow-forward" size={sw(12)} color="#0E5843" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              {packageType === 'flexible'
                ? 'No custom packages available right now.'
                : 'No combos available right now.'}
            </Text>
          ) : (
            filtered.map((pkg: any) => {
              const savings =
                pkg.originalPrice && pkg.originalPrice > pkg.price
                  ? Math.round(pkg.originalPrice - pkg.price)
                  : null;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.card}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('PackageDetail', {package: pkg})}>
                  <Image
                    source={{uri: pkg.image ?? FALLBACK_IMAGE}}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  {savings ? (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>Save ₹{savings}</Text>
                    </View>
                  ) : null}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{pkg.title}</Text>
                    {!!pkg.description && (
                      <Text style={styles.cardDesc} numberOfLines={2}>{pkg.description}</Text>
                    )}
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₹{Math.round(pkg.price)}</Text>
                      {pkg.originalPrice && pkg.originalPrice > pkg.price ? (
                        <Text style={styles.originalPrice}>₹{Math.round(pkg.originalPrice)}</Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
      <CartBar navigation={navigation} />
    </View>
  );
};

const COMBO_GAP = sw(12);
const COMBO_CARD_W = (width - sw(16) * 2 - COMBO_GAP) / 2;

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FCF8F3'},

  /* ── Combos grid ──────────────────────── */
  comboScrollContent: {padding: sw(16), paddingBottom: sw(32)},
  comboGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: COMBO_GAP,
  },
  comboCard: {
    width: COMBO_CARD_W,
    borderRadius: sw(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0E5843',
    backgroundColor: '#FFFFFF',
  },
  comboHeader: {
    backgroundColor: '#0E5843',
    paddingHorizontal: sw(10),
    paddingVertical: sw(10),
    minHeight: sw(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboHeaderText: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  comboPriceBand: {
    backgroundColor: '#137A54',
    paddingVertical: sw(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  comboPriceText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  comboBody: {
    padding: sw(10),
    gap: sw(4),
  },
  comboServiceText: {
    fontFamily: fonts.textFont,
    fontSize: sw(11.5),
    color: '#105641',
    lineHeight: sw(16),
  },
  comboBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(5),
    marginTop: sw(10),
    paddingTop: sw(8),
    borderTopWidth: 1,
    borderTopColor: '#E5EFE9',
  },
  comboBookText: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    fontWeight: '700',
    color: '#0E5843',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(12),
    backgroundColor: '#FCF8F3',
  },
  titleBlock: {alignItems: 'center', gap: sw(8)},
  title: {fontFamily: fonts.primary, fontSize: sw(20), fontWeight: '400', color: '#171816', lineHeight: sw(23)},
  titleUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: sw(16), paddingBottom: sw(24), gap: sw(16)},

  emptyText: {
    textAlign: 'center',
    color: '#A3A3A3',
    marginTop: sw(40),
    fontFamily: fonts.textFont,
    fontSize: sw(13),
  },

  card: {
    borderRadius: sw(16),
    overflow: 'hidden',
    backgroundColor: '#FEFEFE',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: sw(150),
  },
  savingsBadge: {
    position: 'absolute',
    top: sw(12),
    left: sw(12),
    backgroundColor: '#FDD77A',
    borderRadius: sw(8),
    paddingHorizontal: sw(10),
    paddingVertical: sw(4),
  },
  savingsText: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#012823',
  },
  cardBody: {
    padding: sw(14),
    gap: sw(6),
  },
  cardTitle: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#171816',
  },
  cardDesc: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#656565',
    lineHeight: sw(16),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: sw(8),
    marginTop: sw(2),
  },
  price: {
    fontFamily: fonts.title,
    fontSize: sw(17),
    fontWeight: '800',
    color: '#105641',
  },
  originalPrice: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#A3A3A3',
    textDecorationLine: 'line-through',
  },
});

export default PackageListingScreen;
