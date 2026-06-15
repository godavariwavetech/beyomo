import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import {HomeScreenSkeleton} from '../../components/Skeleton/Skeleton';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {fetchCategories} from '../../redux/reducers/services';
import type {AppDispatch, RootState} from '../../redux/store';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const ELLIPSE_W = sw(755.67);
const ELLIPSE_H = sw(384.37);
const ELLIPSE_LEFT = (width - ELLIPSE_W) / 2;
const ELLIPSE_TOP = -sw(146.19);

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=80';

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const HomeScreen = ({navigation}: {navigation: any}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const {categories, loading} = useSelector((state: RootState) => state.Services);
  const selectedCity = useSelector((state: RootState) => state.City?.selectedCity);
  const [offers, setOffers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchCategories());
    const cityParam = selectedCity?.id ? `?cityId=${selectedCity.id}` : '';
    api.get(`${endpoints.OFFERS}${cityParam}`).then(res => {
      if (res.data?.status) setOffers(res.data.data ?? []);
    }).catch(() => {});
    api.get(`${endpoints.PACKAGES}${cityParam}`).then(res => {
      if (res.data?.status) setPackages(res.data.data ?? []);
    }).catch(() => {});
  }, [dispatch, selectedCity?.id]);

  if (loading && categories.length === 0) {
    return (
      <View style={styles.root}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <HomeScreenSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>

        {/* ══════════════════════════════════
            TOP SECTION — dark ellipse header + offers
        ══════════════════════════════════ */}
        <View style={[styles.topSection, {paddingTop: insets.top}]}>

          {/* Dark green ellipse fills the header background */}
          <View style={styles.ellipse} />

          {/* Botanical leaf decoration — top right, semi-transparent */}
          <Image
            source={require('../../assets/leaf_top_right.png')}
            style={styles.headerLeaf}
            resizeMode="contain"
          />

          {/* ── Navigation row: city pill | logo | bell + whatsapp ── */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.locationBtn}
              onPress={() => navigation.navigate('CitySelector', {returnToHome: true})}>
              <Ionicons name="location-sharp" size={sw(14)} color="#FDD77A" />
              <View>
                <Text style={styles.locationLabel}>Delivering to</Text>
                <View style={styles.locationNameRow}>
                  <Text style={styles.locationName} numberOfLines={1}>
                    {selectedCity?.name ?? 'Select City'}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={sw(12)} color="#FDD77A" />
                </View>
              </View>
            </TouchableOpacity>

            <Image
              source={require('../../assets/beyomo_logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />

            <View style={styles.iconsGroup}>
              <TouchableOpacity activeOpacity={0.7} style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={sw(24)} color="#FDD77A" />
                <View style={styles.notifDot} />
              </TouchableOpacity>

              <View style={styles.whatsappCol}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL('https://wa.me/919876543210')}>
                  <Ionicons name="logo-whatsapp" size={sw(28)} color="#25D366" />
                </TouchableOpacity>
                <View style={styles.connectBadge}>
                  <Text style={styles.connectText}>Connect</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Offers carousel at top ── */}
          {offers.length > 0 ? (
            <View style={{marginTop: sw(8)}}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{gap: sw(12), paddingHorizontal: sw(16), paddingBottom: sw(4)}}>
                {offers.map((offer: any) => {
                  const tv = offer.triggerValue ?? {};
                  let triggerLine = '';
                  let requiresLine = '';
                  if (offer.triggerType === 'min_spend') {
                    triggerLine = `Book services worth ₹${tv.amount ?? 0}+`;
                  } else if (offer.triggerType === 'min_count') {
                    triggerLine = `Book any ${tv.count ?? 1}+ services`;
                  } else if (offer.triggerType === 'specific_services') {
                    const names = (offer.requiredServices ?? []).map((s: any) => s.name);
                    triggerLine = 'Book all required services';
                    requiresLine = names.length > 0 ? names.join(' + ') : '';
                  } else if (offer.triggerType === 'category') {
                    triggerLine = `Book ${tv.count ?? 1}+ services from same category`;
                  }
                  return (
                    <TouchableOpacity
                      key={offer.id}
                      style={styles.offerCard}
                      activeOpacity={0.88}
                      onPress={() => navigation.navigate('ServiceListing', {offer})}>
                      <LinearGradient
                        colors={['#105641', '#012823']}
                        style={styles.offerGradient}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}>
                        <Text style={styles.offerGiftIcon}>🎁</Text>
                        <Text style={styles.offerTitle} numberOfLines={2}>{offer.title}</Text>
                        <Text style={styles.offerTrigger}>{triggerLine}</Text>
                        {requiresLine ? (
                          <Text style={styles.offerRequires} numberOfLines={2}>{requiresLine}</Text>
                        ) : null}
                        <View style={styles.offerFreeRow}>
                          <Text style={styles.offerFreeLabel}>FREE</Text>
                          <Text style={styles.offerFreeName} numberOfLines={1}>{offer.freeService?.name ?? ''}</Text>
                        </View>
                        <View style={styles.offerBookBtn}>
                          <Text style={styles.offerBookBtnText}>Book Now →</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* ══════════════════════════════════
            OUR SERVICES
        ══════════════════════════════════ */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeaderBlock}>
            <Text style={styles.sectionTitle}>Our Services</Text>
            <View style={styles.titleUnderline} />
          </View>

          <View style={styles.grid}>
            {chunkArray(categories, 4).map((row: any[], ri: number) => (
              <View key={ri} style={styles.gridRow}>
                {row.map((item: any) => (
                  <TouchableOpacity
                    key={item._id ?? item.id}
                    style={styles.serviceItem}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('ServiceListing', {categoryId: item._id ?? item.id, category: item.name})}>
                    <Image
                      source={{uri: item.image ?? FALLBACK_IMAGE}}
                      style={styles.serviceImgBox}
                      resizeMode="cover"
                    />
                    <Text style={styles.serviceLabel} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════
            POPULAR PACKAGES
        ══════════════════════════════════ */}
        {packages.length > 0 && (
          <View style={styles.packagesSection}>
            <View style={[styles.sectionHeaderBlock, {paddingHorizontal: sw(16)}]}>
              <Text style={styles.sectionTitle}>Popular Packages</Text>
              <View style={styles.titleUnderline} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{gap: sw(12), paddingHorizontal: sw(16)}}>
              {packages.map((pkg: any) => {
                const savings =
                  pkg.originalPrice && pkg.originalPrice > pkg.price
                    ? Math.round(pkg.originalPrice - pkg.price)
                    : null;
                const serviceCountLabel =
                  pkg.packageType === 'fixed'
                    ? `${(pkg.services ?? []).length} services included`
                    : `Any ${pkg.serviceCount ?? 1} services`;
                return (
                  <TouchableOpacity
                    key={pkg.id}
                    style={styles.packageCard}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('PackageDetail', {package: pkg})}>
                    <View style={styles.packageImgWrap}>
                      {pkg.image ? (
                        <Image source={{uri: pkg.image}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                      ) : null}
                      <LinearGradient
                        colors={['rgba(1,40,35,0.05)', 'rgba(1,40,35,0.7)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      {savings ? (
                        <View style={styles.packageSavingsBadge}>
                          <Text style={styles.packageSavingsText}>Save ₹{savings}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.packageBody}>
                      <Text style={styles.packageTitle} numberOfLines={1}>{pkg.title}</Text>
                      <Text style={styles.packageServiceCount}>{serviceCountLabel}</Text>
                      <View style={styles.packagePriceRow}>
                        <Text style={styles.packagePrice}>₹{Math.round(pkg.price)}</Text>
                        {pkg.originalPrice && pkg.originalPrice > pkg.price ? (
                          <Text style={styles.packageOriginalPrice}>₹{Math.round(pkg.originalPrice)}</Text>
                        ) : null}
                      </View>
                      <View style={styles.packageBookBtn}>
                        <Text style={styles.packageBookBtnText}>Book Now →</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={{height: sw(24)}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FCF8F3',
  },
  scroll: {flex: 1},
  contentContainer: {paddingBottom: sw(16)},

  /* ── Offers (top) ── */
  offerCard: { width: sw(210), borderRadius: sw(16), overflow: 'hidden' },
  offerGradient: { padding: sw(14), gap: sw(5), minHeight: sw(148) },
  offerGiftIcon: { fontSize: sw(22) },
  offerTitle: { fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#FFFFFF', lineHeight: sw(17) },
  offerTrigger: { fontFamily: fonts.textFont, fontSize: sw(10), color: 'rgba(255,255,255,0.7)' },
  offerRequires: { fontFamily: fonts.textFont, fontSize: sw(10), color: '#FDD77A', fontWeight: '600', fontStyle: 'italic' },
  offerFreeRow: { flexDirection: 'row', alignItems: 'center', gap: sw(6), marginTop: sw(6) },
  offerFreeLabel: {
    fontFamily: fonts.title, fontSize: sw(9), fontWeight: '800', color: '#012823',
    backgroundColor: '#FDD77A', paddingHorizontal: sw(6), paddingVertical: sw(2), borderRadius: sw(4),
  },
  offerFreeName: { fontFamily: fonts.textFont, fontSize: sw(11), color: '#FFFFFF', fontWeight: '600', flex: 1 },
  offerBookBtn: { marginTop: sw(8), backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: sw(6), paddingVertical: sw(5), alignItems: 'center' },
  offerBookBtnText: { fontFamily: fonts.title, fontSize: sw(11), fontWeight: '700', color: '#FDD77A' },

  /* ── Packages (bottom) ── */
  packagesSection: {paddingBottom: sw(4), paddingTop: sw(24)},
  packageCard: {
    width: sw(190),
    borderRadius: sw(16),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  packageImgWrap: {
    width: '100%',
    height: sw(100),
    backgroundColor: '#D4EDE1',
    overflow: 'hidden',
  },
  packageSavingsBadge: {
    position: 'absolute',
    top: sw(8),
    left: sw(8),
    backgroundColor: '#FDD77A',
    borderRadius: sw(6),
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
  },
  packageSavingsText: {
    fontFamily: fonts.title,
    fontSize: sw(10),
    fontWeight: '700',
    color: '#012823',
  },
  packageBody: {
    padding: sw(12),
    gap: sw(4),
  },
  packageTitle: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#171816',
  },
  packageServiceCount: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: '#105641',
    fontWeight: '600',
  },
  packagePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    marginTop: sw(2),
  },
  packagePrice: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '800',
    color: '#012823',
  },
  packageOriginalPrice: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
  },
  packageBookBtn: {
    marginTop: sw(6),
    backgroundColor: '#012823',
    borderRadius: sw(6),
    paddingVertical: sw(6),
    alignItems: 'center',
  },
  packageBookBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(11),
    fontWeight: '700',
    color: '#FDD77A',
  },

  /* ── Top section ──────────────────────── */
  topSection: {
    overflow: 'hidden',
    paddingBottom: sw(24),
  },
  ellipse: {
    position: 'absolute',
    width: ELLIPSE_W,
    height: ELLIPSE_H,
    left: ELLIPSE_LEFT,
    top: ELLIPSE_TOP,
    borderRadius: ELLIPSE_W / 2,
    backgroundColor: '#012823',
  },
  headerLeaf: {
    position: 'absolute',
    width: sw(215.14),
    height: sw(221.9),
    right: sw(-26.5),
    top: 0,
    opacity: 0.1,
    transform: [{scaleX: -1}],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingVertical: sw(14),
  },
  headerLogo: {
    width: sw(144.61),
    height: sw(43.19),
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    maxWidth: sw(130),
  },
  locationLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: 'rgba(255,255,255,0.65)',
    lineHeight: sw(13),
  },
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(2),
  },
  locationName: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#FDD77A',
    maxWidth: sw(92),
  },
  iconsGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(16),
  },
  bellBtn: {
    width: sw(28),
    height: sw(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    width: sw(8),
    height: sw(8),
    borderRadius: sw(4),
    backgroundColor: '#FF0000',
    top: 0,
    right: 0,
  },
  whatsappCol: {
    alignItems: 'center',
    gap: sw(4),
  },
  connectBadge: {
    paddingHorizontal: sw(6),
    paddingVertical: sw(2),
    backgroundColor: '#FF9500',
    borderRadius: sw(16),
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: sw(8),
    fontFamily: fonts.textFont,
    lineHeight: sw(10),
  },

  /* ── Services section ──────────────────────── */
  servicesSection: {
    paddingHorizontal: sw(16),
    paddingTop: sw(24),
  },
  sectionHeaderBlock: {
    marginBottom: sw(16),
    gap: sw(6),
  },
  sectionTitle: {
    fontFamily: fonts.primary,
    fontSize: sw(20),
    fontWeight: '400',
    color: '#171816',
  },
  titleUnderline: {
    width: sw(29.43),
    height: 2,
    backgroundColor: '#C8A84C',
  },
  grid: {
    gap: sw(16),
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: sw(80),
    alignItems: 'center',
    gap: sw(8),
  },
  serviceImgBox: {
    width: sw(80),
    height: sw(80),
    borderRadius: sw(12.63),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sw(2.1)},
    shadowOpacity: 0.1,
    shadowRadius: sw(10.5),
  },
  serviceLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#000000',
    textAlign: 'center',
    lineHeight: sw(14),
  },
});

export default HomeScreen;
