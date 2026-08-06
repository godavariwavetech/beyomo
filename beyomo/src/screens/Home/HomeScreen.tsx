import React, {useEffect, useRef, useState} from 'react';
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
  RefreshControl,
} from 'react-native';
import {HomeScreenSkeleton, SkeletonBox} from '../../components/Skeleton/Skeleton';
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
// RN clamps a View's borderRadius to half its own height, so a box this much wider than
// it is tall just renders as a flat-sided stadium with rounded caps far off-screen — no
// visible curve. Drawing a circle and stretching it with scaleX keeps the rounding intact.
const ELLIPSE_SCALE_X = ELLIPSE_W / ELLIPSE_H;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

const HEADER_CARD_ASPECT = 2.2;
// Slightly narrower than the full slide width, with matching side margins below, so the
// card has breathing room from the device edges instead of touching them directly.
const HEADER_CARD_W = width - sw(24);
const HEADER_CARD_H = HEADER_CARD_W / HEADER_CARD_ASPECT;

// Service grid items fill the full row width exactly — 4 columns with a fixed gap between
// them, so there's no leftover whitespace dangling on the right edge of each row.
const GRID_COLUMNS = 4;
const GRID_GAP = sw(12);
const GRID_ITEM_W = (width - sw(32) - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

// Packages & Combos CTA banners — same poster graphics as the website's promo cards
// (custom_package_banner.png / combo_banner.png, ~1496×945px). Sized in exact pixels
// (not aspectRatio + percentage) to match how every other sized element in this file is
// computed, and to avoid Yoga aspectRatio-in-flex quirks on Android.
const CTA_CARD_ASPECT = 1496 / 945;
const CTA_CARD_GAP = sw(12);
const CTA_CARD_W = (width - sw(32) - CTA_CARD_GAP) / 2;
const CTA_CARD_H = CTA_CARD_W / CTA_CARD_ASPECT;

const AUTO_SCROLL_OFFERS_MS = 4000;

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
  const [packages, setPackages] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  const offersScrollRef = useRef<ScrollView>(null);
  const offersIndexRef = useRef(0);

  // Track which images have finished loading so we can hide the skeleton overlay.
  // Keyed by offer id / category id / image uri for promo cards.
  const [loadedBanners, setLoadedBanners] = useState<Set<string>>(new Set());
  const [loadedServices, setLoadedServices] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const loadHomeData = () => {
    setLoadedServices(new Set());
    const cityParam = selectedCity?.id ? `?cityId=${selectedCity.id}` : '';
    const packagesPromise = api.get(`${endpoints.PACKAGES}${cityParam}`).then(res => {
      if (res.data?.status) { setPackages(res.data.data ?? []); setLoadedBanners(new Set()); }
    }).catch(() => {});
    const bannersPromise = api.get(endpoints.BANNERS).then(res => {
      if (res.data?.status) setBanners(res.data.data ?? []);
    }).catch(() => {});
    return Promise.all([
      dispatch(fetchCategories()),
      packagesPromise,
      bannersPromise,
    ]);
  };

  useEffect(() => {
    loadHomeData();
  }, [dispatch, selectedCity?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHomeData();
    } finally {
      setRefreshing(false);
    }
  };

  // The two "Packages & Combos" CTA cards are fixed nav targets (always go to
  // CustomPackages / Combos) — an admin can override just their artwork via the Banners
  // page; otherwise the static poster shows.
  const customPackageBanner = banners.find(b => b.type === 'custom_package');
  const comboBanner = banners.find(b => b.type === 'combo');

  // Header carousel = whichever packages/combos the admin has flagged "Show on Home
  // Screen" — the Special Offers row now lives in the header itself.
  const featuredPackages = packages.filter(p => p.showOnHome);

  // Auto-scroll the top carousel — pages full-width, wraps back to the first slide
  useEffect(() => {
    offersIndexRef.current = 0;
    if (featuredPackages.length <= 1) return;
    const id = setInterval(() => {
      offersIndexRef.current = (offersIndexRef.current + 1) % featuredPackages.length;
      offersScrollRef.current?.scrollTo({x: offersIndexRef.current * width, animated: true});
    }, AUTO_SCROLL_OFFERS_MS);
    return () => clearInterval(id);
  }, [featuredPackages.length]);

  const goToOffer = (pkg: any) => navigation.navigate('PackageDetail', {package: pkg});

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

      {/* ══════════════════════════════════
          FIXED HEADER — dark ellipse + nav row + Special Offers carousel
      ══════════════════════════════════ */}
      <View style={[styles.topSection, {paddingTop: insets.top}]}>

        {/* Dark green ellipse fills the header background */}
        <View style={styles.ellipse} />

        {/* Botanical leaf decoration — top right, semi-transparent */}
        <Image
          source={require('../../assets/leaf_alt.png')}
          style={styles.headerLeaf}
          resizeMode="contain"
        />

        {/* ── Navigation row: city pill | logo | search + whatsapp ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.locationBtn}
            onPress={() => navigation.navigate('CitySelector', {returnToHome: true})}>
            <Ionicons name="location-sharp" size={sw(12)} color="#FDD77A" />
            <View style={styles.locationNameRow}>
              <Text style={styles.locationName} numberOfLines={1}>
                {selectedCity?.name ?? 'Select City'}
              </Text>
              <Ionicons name="chevron-down-outline" size={sw(10)} color="#FDD77A" />
            </View>
          </TouchableOpacity>

          <Image
            source={require('../../assets/beyomo_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <View style={styles.iconsGroup}>
            <TouchableOpacity activeOpacity={0.7} style={styles.bellBtn} onPress={() => navigation.navigate('Search')}>
              <Ionicons name="search-outline" size={sw(22)} color="#FDD77A" />
            </TouchableOpacity>

            <View style={styles.whatsappCol}>
              <TouchableOpacity activeOpacity={0.7} style={styles.bellBtn} onPress={() => Linking.openURL('https://wa.me/919885909192')}>
                <Ionicons name="logo-whatsapp" size={sw(24)} color="#25D366" />
              </TouchableOpacity>
              <View style={styles.connectBadge}>
                <Text style={styles.connectText}>Connect</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Special Offers carousel — packages/combos flagged "Show on Home Screen",
             pages full-width inside the header itself ── */}
        {featuredPackages.length > 0 ? (
          <View style={{marginTop: sw(10)}}>
            <ScrollView
              ref={offersScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              onMomentumScrollEnd={e => {
                offersIndexRef.current = Math.round(e.nativeEvent.contentOffset.x / width);
              }}
              contentContainerStyle={{paddingBottom: sw(4)}}>
              {featuredPackages.map((pkg: any) => {
                const offerKey = `offer-${pkg.id}`;
                const isPackage = pkg.packageType === 'flexible';
                return (
                  <TouchableOpacity
                    key={offerKey}
                    activeOpacity={1}
                    style={{width}}
                    onPress={() => goToOffer(pkg)}>
                    <View style={styles.headerCardShadowWrap}>
                      <View style={styles.headerCardImgWrap}>
                        <Image
                          source={{uri: pkg.image ?? pkg.services?.[0]?.image ?? FALLBACK_IMAGE}}
                          style={styles.headerCardImg}
                          resizeMode="stretch"
                          onLoad={() =>
                            setLoadedBanners(prev => new Set(prev).add(offerKey))
                          }
                        />
                        {!loadedBanners.has(offerKey) && (
                          <SkeletonBox color="#1a4036" r={0} style={StyleSheet.absoluteFill} />
                        )}
                        <View
                          style={[
                            styles.offerTypeBadge,
                            isPackage ? styles.offerTypeBadgePackage : styles.offerTypeBadgeCombo,
                          ]}>
                          <Text
                            style={[
                              styles.offerTypeBadgeText,
                              {color: isPackage ? '#14192B' : '#FFFFFF'},
                            ]}>
                            {isPackage ? 'Package' : 'Combo'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#105641']} tintColor="#105641" />
        }>

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
                    <View style={styles.serviceImgBox}>
                      <View style={styles.serviceImgInner}>
                        <Image
                          source={{uri: item.image ?? FALLBACK_IMAGE}}
                          style={styles.serviceImg}
                          resizeMode="cover"
                          onLoad={() =>
                            setLoadedServices(prev =>
                              new Set(prev).add(String(item._id ?? item.id))
                            )
                          }
                        />
                        {!loadedServices.has(String(item._id ?? item.id)) && (
                          <SkeletonBox color="#DCDCDC" r={0} style={StyleSheet.absoluteFill} />
                        )}
                      </View>
                    </View>
                    {/* Category name is already baked into the image itself, so the
                        text label underneath would just duplicate it. */}
                    {/* <Text style={styles.serviceLabel} numberOfLines={2}>
                      {item.name}
                    </Text> */}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════
            PACKAGES & COMBOS — pick a flexible build-your-own package, or a
            ready-made combo, same split the website offers ('flexible' vs 'fixed')
        ══════════════════════════════════ */}
        <View style={styles.packagesCtaSection}>
          <View style={styles.sectionHeaderBlock}>
            <Text style={styles.sectionTitle}>Packages & Combos</Text>
            <View style={styles.titleUnderline} />
          </View>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaCardShadow}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('CustomPackages')}>
              <View style={styles.ctaCardImgWrap}>
                <Image
                  source={customPackageBanner?.image ? {uri: customPackageBanner.image} : require('../../assets/custom_package_banner.png')}
                  style={styles.ctaCardImg}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctaCardShadow}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('PackageListing', {packageType: 'fixed', title: 'Combos'})}>
              <View style={styles.ctaCardImgWrap}>
                <Image
                  source={comboBanner?.image ? {uri: comboBanner.image} : require('../../assets/combo_banner.png')}
                  style={styles.ctaCardImg}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

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

  /* ── Special Offers badge — featured packages/combos, same styling as the website's ── */
  offerTypeBadge: {
    position: 'absolute',
    top: sw(8),
    left: sw(8),
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
    borderRadius: sw(20),
  },
  offerTypeBadgeCombo: {
    backgroundColor: '#105641',
  },
  offerTypeBadgePackage: {
    backgroundColor: '#F2A93B',
  },
  offerTypeBadgeText: {
    fontFamily: fonts.secondry,
    fontSize: sw(9),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  /* ── Header carousel card — plain poster image, badge + overlay on top ──
     RN clips shadows away on any view that also has overflow:hidden (needed
     here to clip the image to rounded corners), so the shadow lives on an
     outer wrapper and the rounding + clipping lives on the inner one. ── */
  headerCardShadowWrap: {
    width: HEADER_CARD_W,
    height: HEADER_CARD_H,
    marginHorizontal: sw(12),
    borderRadius: sw(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  headerCardImgWrap: {
    width: '100%',
    height: '100%',
    borderRadius: sw(16),
    overflow: 'hidden',
  },
  headerCardImg: {
    width: '100%',
    height: '100%',
  },

  /* ── Packages & Combos CTA cards ──────────────────────── */
  packagesCtaSection: {
    paddingHorizontal: sw(16),
    paddingTop: sw(20),
  },
  ctaRow: {
    flexDirection: 'row',
    gap: CTA_CARD_GAP,
  },
  // Shadow lives on the outer wrapper and rounding+clipping on the inner one — RN clips
  // shadows away on any view that also has overflow:hidden (needed here to round the image).
  // A backgroundColor is required here too — Android's elevation shadow doesn't render on
  // a transparent view.
  ctaCardShadow: {
    width: CTA_CARD_W,
    height: CTA_CARD_H,
    borderRadius: sw(14),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaCardImgWrap: {
    width: CTA_CARD_W,
    height: CTA_CARD_H,
    borderRadius: sw(14),
    overflow: 'hidden',
  },
  // Container is sized to the poster's exact aspect ratio (CTA_CARD_ASPECT), so
  // plain "cover" already fills it edge-to-edge with no cropping needed.
  ctaCardImg: {
    width: CTA_CARD_W,
    height: CTA_CARD_H,
  },

  /* ── Top section ──────────────────────── */
  topSection: {
    overflow: 'hidden',
    paddingBottom: sw(4),
  },
  ellipse: {
    position: 'absolute',
    width: ELLIPSE_H,
    height: ELLIPSE_H,
    left: ELLIPSE_LEFT + ELLIPSE_W / 2 - ELLIPSE_H / 2,
    top: ELLIPSE_TOP,
    borderRadius: ELLIPSE_H / 2,
    transform: [{scaleX: ELLIPSE_SCALE_X}],
    backgroundColor: '#012823',
  },
  headerLeaf: {
    position: 'absolute',
    width: sw(215.14),
    height: sw(221.9),
    right: sw(-26.5),
    top: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(12),
    paddingTop: sw(14),
    paddingBottom: sw(4),
  },
  headerLogo: {
    width: sw(144.61),
    height: sw(43.19),
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(3),
    maxWidth: sw(108),
  },
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(2),
  },
  locationName: {
    fontFamily: fonts.title,
    fontSize: sw(11),
    color: '#FDD77A',
    maxWidth: sw(78),
  },
  iconsGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(12),
  },
  bellBtn: {
    width: sw(28),
    height: sw(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappCol: {
    alignItems: 'center',
    gap: sw(4),
  },
  connectBadge: {
    paddingHorizontal: sw(4),
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
    paddingTop: sw(14),
  },
  sectionHeaderBlock: {
    marginBottom: sw(16),
    gap: sw(6),
  },
  sectionTitle: {
    fontFamily: 'serif',
    fontSize: sw(20),
    lineHeight: sw(23),
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
    gap: GRID_GAP,
  },
  serviceItem: {
    width: GRID_ITEM_W,
    alignItems: 'center',
    gap: sw(8),
  },
  serviceImgBox: {
    width: GRID_ITEM_W,
    height: GRID_ITEM_W,
    borderRadius: sw(12.63),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sw(2.1)},
    shadowOpacity: 0.1,
    shadowRadius: sw(10.5),
    backgroundColor: '#FCF8F3',
  },
  serviceImgInner: {
    width: '100%',
    height: '100%',
    borderRadius: sw(12.63),
    overflow: 'hidden',
  },
  serviceImg: {
    width: '100%',
    height: '100%',
    transform: [{scale: 1.35}],
  },
  serviceLabel: {
    fontFamily: fonts.secondry,
    fontSize: sw(12),
    color: '#000000',
    textAlign: 'center',
    lineHeight: sw(14),
  },
});

export default HomeScreen;
