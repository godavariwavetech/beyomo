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

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

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

          {/* ── Offers banner at top — one full-width poster at a time, swipe for next ── */}
          {offers.length > 0 ? (
            <View style={{marginTop: sw(8)}}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                contentContainerStyle={{paddingBottom: sw(4)}}>
                {offers.map((offer: any) => (
                  <TouchableOpacity
                    key={offer.id}
                    activeOpacity={0.88}
                    style={{width}}
                    onPress={() => navigation.navigate('ServiceListing', {offer})}>
                    <Image
                      source={{uri: offer.image || FALLBACK_IMAGE}}
                      style={styles.topBannerImg}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
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
            POPULAR PACKAGES — poster images only, no overlaid UI
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
              {packages.map((pkg: any) => (
                <TouchableOpacity
                  key={pkg.id}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('PackageDetail', {package: pkg})}>
                  <Image
                    source={{uri: pkg.image || FALLBACK_IMAGE}}
                    style={styles.bannerImg}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
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

  /* ── Offer/package banners — plain poster images, no overlaid UI ── */
  bannerImg: {
    width: sw(280),
    height: sw(140),
    borderRadius: sw(12),
    backgroundColor: '#D4EDE1',
  },
  topBannerImg: {
    width: width - sw(32),
    height: sw(160),
    marginHorizontal: sw(16),
    borderRadius: sw(12),
    backgroundColor: '#D4EDE1',
  },
  packagesSection: {paddingBottom: sw(4), paddingTop: sw(24)},

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
