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
} from 'react-native';
import {HomeScreenSkeleton, SkeletonBox} from '../../components/Skeleton/Skeleton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
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

const TOP_BANNER_ASPECT = 2.2;
// Slightly narrower than the full slide width, with matching side margins below, so the
// card has breathing room from the device edges instead of touching them directly.
const TOP_BANNER_W = width - sw(24);
// Package poster slides — fixed height (not computed from the image's aspect ratio).
// Adjust this single number directly to make the banner shorter/taller.
const PACKAGE_SLIDE_W = width - sw(4);
const PACKAGE_SLIDE_H = sw(200);

// Service grid items fill the full row width exactly — 4 columns with a fixed gap between
// them, so there's no leftover whitespace dangling on the right edge of each row.
const GRID_COLUMNS = 4;
const GRID_GAP = sw(12);
const GRID_ITEM_W = (width - sw(32) - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const TOP_BANNER_H = TOP_BANNER_W / TOP_BANNER_ASPECT;

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
  const [offers, setOffers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  const offersScrollRef = useRef<ScrollView>(null);
  const offersIndexRef = useRef(0);

  // Track which images have finished loading so we can hide the skeleton overlay.
  // Keyed by banner id / category id / image uri for promo cards.
  const [loadedBanners, setLoadedBanners] = useState<Set<string>>(new Set());
  const [loadedServices, setLoadedServices] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchCategories());
    setLoadedServices(new Set());
    const cityParam = selectedCity?.id ? `?cityId=${selectedCity.id}` : '';
    api.get(`${endpoints.OFFERS}${cityParam}`).then(res => {
      if (res.data?.status) { setOffers(res.data.data ?? []); }
    }).catch(() => {});
    api.get(`${endpoints.PACKAGES}${cityParam}`).then(res => {
      if (res.data?.status) { setPackages(res.data.data ?? []); }
    }).catch(() => {});
    // Same admin-managed Banner entity the website's hero carousel reads from —
    // keeps the app's top banner in sync with whatever's set in admin-dashboard/Banners.
    api.get(endpoints.BANNERS).then(res => {
      if (res.data?.status) { setBanners(res.data.data ?? []); setLoadedBanners(new Set()); }
    }).catch(() => {});
  }, [dispatch, selectedCity?.id]);

  // Header carousel = admin banners + real fixed combo packages, all paging together
  const fixedPackages = packages.filter(p => p.packageType === 'fixed');
  const headerSlides = [
    ...banners.map((b: any) => ({...b, __kind: 'banner' as const})),
    ...fixedPackages.map((p: any) => ({...p, __kind: 'package' as const})),
  ];

  // Auto-scroll the top banner — pages full-width, wraps back to the first slide
  useEffect(() => {
    offersIndexRef.current = 0;
    if (headerSlides.length <= 1) return;
    const id = setInterval(() => {
      offersIndexRef.current = (offersIndexRef.current + 1) % headerSlides.length;
      offersScrollRef.current?.scrollTo({x: offersIndexRef.current * width, animated: true});
    }, AUTO_SCROLL_OFFERS_MS);
    return () => clearInterval(id);
  }, [headerSlides.length]);

  const goToBanner = (banner: any) => {
    if (banner.targetScreen) {
      navigation.navigate(banner.targetScreen, banner.targetParam ? {category: banner.targetParam} : undefined);
    } else {
      navigation.navigate('ServiceListing');
    }
  };

  const goToSlide = (slide: any) => {
    if (slide.__kind === 'package') {
      navigation.navigate('PackageDetail', {package: slide});
    } else {
      goToBanner(slide);
    }
  };

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
          FIXED HEADER — dark ellipse + nav row + banner
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

        {/* ── Navigation row: city pill | logo | bell + whatsapp ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.locationBtn}
            onPress={() => navigation.navigate('CitySelector', {returnToHome: true})}>
            <Ionicons name="location-sharp" size={sw(12)} color="#FDD77A" />
            <View>
              <Text style={styles.locationLabel}>Delivering to</Text>
              <View style={styles.locationNameRow}>
                <Text style={styles.locationName} numberOfLines={1}>
                  {selectedCity?.name ?? 'Select City'}
                </Text>
                <Ionicons name="chevron-down-outline" size={sw(10)} color="#FDD77A" />
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
              <TouchableOpacity activeOpacity={0.7} style={styles.bellBtn} onPress={() => Linking.openURL('https://wa.me/919876543210')}>
                <Ionicons name="logo-whatsapp" size={sw(24)} color="#25D366" />
              </TouchableOpacity>
              <View style={styles.connectBadge}>
                <Text style={styles.connectText}>Connect</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Top banner — admin banners + real combo packages, all paging together ── */}
        {headerSlides.length > 0 ? (
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
              {headerSlides.map((slide: any) => {
                const slideKey = `${slide.__kind}-${slide.id}`;
                // Package images are pre-made poster graphics with their own rounded
                // corners/shadow/padding already baked in -- render them plain and
                // uncropped instead of wrapping them in another rounded+shadow card.
                if (slide.image && slide.__kind === 'package') {
                  return (
                    <TouchableOpacity
                      key={slideKey}
                      activeOpacity={0.88}
                      style={[styles.packageSlideWrap, {width}]}
                      onPress={() => goToSlide(slide)}>
                      <Image
                        source={{uri: slide.image}}
                        style={styles.packageSlideImg}
                        resizeMode="stretch"
                        onLoad={() =>
                          setLoadedBanners(prev => new Set(prev).add(slideKey))
                        }
                      />
                      {!loadedBanners.has(slideKey) && (
                        <SkeletonBox color="#1a4036" r={0} style={StyleSheet.absoluteFill} />
                      )}
                    </TouchableOpacity>
                  );
                }
                return slide.image ? (
                  <TouchableOpacity
                    key={slideKey}
                    activeOpacity={0.88}
                    style={{width}}
                    onPress={() => goToSlide(slide)}>
                    <View style={styles.topBannerShadowWrap}>
                      <View style={styles.topBannerImg}>
                        <Image
                          source={{uri: slide.image}}
                          style={styles.bannerFill}
                          resizeMode="cover"
                          onLoad={() =>
                            setLoadedBanners(prev => new Set(prev).add(slideKey))
                          }
                        />
                        {!loadedBanners.has(slideKey) && (
                          <SkeletonBox color="#1a4036" r={0} style={StyleSheet.absoluteFill} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={slideKey}
                    activeOpacity={0.88}
                    style={{width}}
                    onPress={() => goToSlide(slide)}>
                    <LinearGradient
                      colors={[slide.gradientStart || '#1a5c4a', slide.gradientEnd || '#022723']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.topBannerGradient}>
                      {!!slide.subtitle && (
                        <Text style={styles.bannerSubtitle}>{slide.subtitle}</Text>
                      )}
                      <Text style={styles.bannerTitle} numberOfLines={2}>
                        {slide.title}
                      </Text>
                      {!!slide.description && (
                        <Text style={styles.bannerDescription} numberOfLines={2}>
                          {slide.description}
                        </Text>
                      )}
                      <View style={styles.bannerButton}>
                        <Text style={styles.bannerButtonText}>{slide.buttonText || 'Book Now'}</Text>
                      </View>
                    </LinearGradient>
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
        contentContainerStyle={styles.contentContainer}>


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
            SPECIAL OFFERS — real admin-managed offers, same tile UI as before
        ══════════════════════════════════ */}
        {offers.length > 0 && (
          <View style={styles.promoSection}>
            {chunkArray(offers, 2).map((row: any[], ri: number) => (
              <View key={ri} style={styles.promoRow}>
                {row.map((offer: any) => (
                  <TouchableOpacity
                    key={offer.id}
                    style={styles.promoCardImg}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('ServiceListing', {offer})}>
                    <Image
                      source={{uri: offer.image}}
                      style={styles.promoStaticImg}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
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

  /* ── Package poster slides — image already has its own card design baked
     in (rounded corners, shadow, padding), so just show it uncropped ── */
  packageSlideWrap: {
    height: PACKAGE_SLIDE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageSlideImg: {
    width: PACKAGE_SLIDE_W,
    height: PACKAGE_SLIDE_H,
  },

  /* ── Top offers banner — plain poster image, no overlaid UI ──
     RN clips shadows away on any view that also has overflow:hidden (needed
     here to clip the image to rounded corners), so the shadow lives on an
     outer wrapper and the rounding + clipping lives on the inner one. ── */
  topBannerShadowWrap: {
    width: TOP_BANNER_W,
    height: TOP_BANNER_H,
    marginHorizontal: sw(12),
    borderRadius: sw(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  topBannerImg: {
    width: '100%',
    height: '100%',
    borderRadius: sw(16),
    overflow: 'hidden',
  },
  bannerFill: {
    width: '100%',
    height: '100%',
  },
  topBannerGradient: {
    width: TOP_BANNER_W,
    height: TOP_BANNER_H,
    marginHorizontal: sw(12),
    borderRadius: sw(16),
    padding: sw(16),
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerSubtitle: {
    fontFamily: fonts.secondry,
    fontSize: sw(11),
    color: '#FDD77A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bannerTitle: {
    fontFamily: fonts.title,
    fontSize: sw(18),
    color: '#FFFFFF',
    marginTop: sw(4),
  },
  bannerDescription: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: 'rgba(255,255,255,0.8)',
    marginTop: sw(4),
    lineHeight: sw(14),
  },
  bannerButton: {
    marginTop: sw(10),
    alignSelf: 'flex-start',
    backgroundColor: '#FDD77A',
    borderRadius: sw(18),
    paddingHorizontal: sw(16),
    paddingVertical: sw(7),
  },
  bannerButtonText: {
    fontFamily: fonts.secondry,
    fontSize: sw(12),
    color: '#012823',
  },

  /* ── New User Special promo cards ──────────────────────── */
  promoSection: {
    gap: sw(12),
    paddingHorizontal: sw(16),
    paddingTop: sw(20),
    paddingBottom: sw(4),
  },
  promoRow: {
    flexDirection: 'row',
    gap: sw(12),
  },
  promoCardImg: {
    flex: 1,
    height: sw(139),
    borderRadius: sw(12),
    overflow: 'hidden',
  },
  promoStaticImg: {
    width: '100%',
    height: '100%',
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
  locationLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(9),
    color: 'rgba(255,255,255,0.65)',
    lineHeight: sw(11),
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
    gap: sw(4),
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
