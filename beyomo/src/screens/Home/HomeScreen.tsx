import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Linking,
  RefreshControl,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import {HomeScreenSkeleton, SkeletonBox} from '../../components/Skeleton/Skeleton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {fetchCategories} from '../../redux/reducers/services';
import {addServicesToCart} from '../../redux/reducers/cart';
import type {AppDispatch, RootState} from '../../redux/store';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

const BRAND_LOGOS = [
  require('../../assets/brands/b1.png'),
  require('../../assets/brands/b2.png'),
  require('../../assets/brands/b4.png'),
  require('../../assets/brands/b5.png'),
  require('../../assets/brands/b6.png'),
  require('../../assets/brands/b7.png'),
  require('../../assets/brands/b9.png'),
  require('../../assets/brands/b10.png'),
  require('../../assets/brands/b11.png'),
  require('../../assets/brands/b12.png'),
  require('../../assets/brands/b13.png'),
  require('../../assets/brands/b14.png'),
  require('../../assets/brands/b15.png'),
  require('../../assets/brands/b16.png'),
  require('../../assets/brands/b17.png'),
  require('../../assets/brands/b18.png'),
  require('../../assets/brands/b19.png'),
  require('../../assets/brands/b20.png'),
  require('../../assets/brands/b21.png'),
];

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

// "Most Booked Services" horizontal cards
const POPULAR_CARD_W = sw(155);
const POPULAR_IMG_H = sw(140);

// "Why Beyomo?" banner — same checklist graphic as the website (868×414px)
const WHY_BEYOMO_ASPECT = 868 / 414;
const WHY_BEYOMO_W = width - sw(32);
const WHY_BEYOMO_H = WHY_BEYOMO_W / WHY_BEYOMO_ASPECT;

// "Top Brands" logo grid — 3 columns, square cards
const BRAND_COLUMNS = 3;
const BRAND_GAP = sw(10);
const BRAND_CARD_W = (width - sw(32) - BRAND_GAP * (BRAND_COLUMNS - 1)) / BRAND_COLUMNS;

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
  const [banners, setBanners] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [addedPopular, setAddedPopular] = useState<Set<string>>(new Set());

  const [loadedServices, setLoadedServices] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({categories: [], services: [], packages: [], offers: []});
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults({categories: [], services: [], packages: [], offers: []});
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(() => {
      const cityParam = selectedCity?.id ? `&cityId=${selectedCity.id}` : '';
      api
        .get(`${endpoints.SEARCH}?q=${encodeURIComponent(q)}${cityParam}`)
        .then(res => {
          if (res.data?.status) setSearchResults(res.data.data ?? {categories: [], services: [], packages: [], offers: []});
        })
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, selectedCity?.id]);

  const goToServiceListing = (categoryId: any, categoryName: string) => {
    Keyboard.dismiss();
    setSearchQuery('');
    navigation.navigate('ServiceListing', {categoryId, category: categoryName});
  };

  const goToPackage = (pkg: any) => {
    Keyboard.dismiss();
    setSearchQuery('');
    navigation.navigate('PackageDetail', {packageId: pkg.id});
  };

  const searchActive = searchQuery.trim().length >= 2;
  const hasSearchResults =
    (searchResults.categories?.length ?? 0) > 0 ||
    (searchResults.services?.length ?? 0) > 0 ||
    (searchResults.packages?.length ?? 0) > 0 ||
    (searchResults.offers?.length ?? 0) > 0;

  const loadHomeData = () => {
    setAddedPopular(new Set());
    const bannersPromise = api.get(endpoints.BANNERS).then(res => {
      if (res.data?.status) setBanners(res.data.data ?? []);
    }).catch(() => {});
    const popularPromise = api.get(endpoints.SERVICES, {
      params: {isPopular: true, limit: 8, cityId: selectedCity?.id},
    }).then(res => {
      if (res.data?.status) setPopularServices(res.data.data ?? []);
    }).catch(() => {});
    return Promise.all([
      dispatch(fetchCategories()),
      bannersPromise,
      popularPromise,
    ]);
  };

  const handleAddPopular = (svc: any) => {
    const id = String(svc.id ?? svc._id);
    dispatch(addServicesToCart([{
      id,
      name: svc.name,
      duration: svc.duration ? `${svc.duration} mins` : '',
      price: parseFloat(svc.basePrice) || 0,
      image: svc.image,
      qty: 1,
    }]));
    setAddedPopular(prev => new Set(prev).add(id));
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

  // Same admin-managed hero banner the website's homepage shows — replaces the old
  // featured-packages carousel in the header.
  const heroBanner = banners.find(b => b.type === 'hero');

  // "Why Beyomo?" section image — admin-overridable, falls back to the same static
  // checklist graphic the website uses.
  const whyBeyomoBanner = banners.find(b => b.type === 'why_beyomo');

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

        {/* ── Global search bar ── */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={sw(18)} color="#8A8A8A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for Hair Spa"
            placeholderTextColor="#8A8A8A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={sw(18)} color="#B5B5B5" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Hero banner — same admin-managed image the website's homepage shows ── */}
        {heroBanner?.image ? (
          <View style={{marginTop: sw(10)}}>
            <View style={styles.headerCardShadowWrap}>
              <View style={styles.headerCardImgWrap}>
                <Image
                  source={{uri: heroBanner.image}}
                  style={styles.headerCardImg}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#105641']} tintColor="#105641" />
        }>

        {searchActive && (
          <View style={styles.searchResultsCard}>
            {searchLoading && <ActivityIndicator color="#105641" style={{marginVertical: sw(16)}} />}
            {!searchLoading && !hasSearchResults && (
              <Text style={styles.searchEmpty}>No results for "{searchQuery.trim()}"</Text>
            )}
            {!searchLoading && (searchResults.categories?.length ?? 0) > 0 && (
              <>
                <Text style={styles.searchResultLabel}>Categories</Text>
                <View style={styles.searchChipsWrap}>
                  {searchResults.categories.map((cat: any) => (
                    <TouchableOpacity key={`cat-${cat.id}`} style={styles.searchChip} activeOpacity={0.7}
                      onPress={() => goToServiceListing(cat.id, cat.name)}>
                      <Text style={styles.searchChipText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {!searchLoading && (searchResults.services?.length ?? 0) > 0 && (
              <>
                <Text style={styles.searchResultLabel}>Services</Text>
                {searchResults.services.map((svc: any) => (
                  <TouchableOpacity key={`svc-${svc.id}`} style={styles.searchRow} activeOpacity={0.7}
                    onPress={() => goToServiceListing(svc.categoryId ?? svc.category?.id, svc.category?.name ?? '')}>
                    <Image source={{uri: svc.image || FALLBACK_IMAGE}} style={styles.searchRowImg} />
                    <View style={{flex: 1}}>
                      <Text style={styles.searchRowTitle} numberOfLines={1}>{svc.name}</Text>
                      <Text style={styles.searchRowSub} numberOfLines={1}>
                        {svc.category?.name ?? ''}{svc.duration ? ` · ${svc.duration} mins` : ''}
                      </Text>
                    </View>
                    <Text style={styles.searchRowPrice}>₹{Math.round(svc.price ?? svc.basePrice ?? 0)}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            {!searchLoading && (searchResults.packages?.length ?? 0) > 0 && (
              <>
                <Text style={styles.searchResultLabel}>Packages</Text>
                {searchResults.packages.map((pkg: any) => (
                  <TouchableOpacity key={`pkg-${pkg.id}`} style={styles.searchRow} activeOpacity={0.7}
                    onPress={() => goToPackage(pkg)}>
                    <Image source={{uri: pkg.image || FALLBACK_IMAGE}} style={styles.searchRowImg} />
                    <View style={{flex: 1}}>
                      <Text style={styles.searchRowTitle} numberOfLines={1}>{pkg.title}</Text>
                    </View>
                    <Text style={styles.searchRowPrice}>₹{Math.round(pkg.price ?? 0)}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

        {/* ══════════════════════════════════
            PACKAGES & COMBOS — pick a flexible build-your-own package, or a
            ready-made combo, same split the website offers ('flexible' vs 'fixed')
        ══════════════════════════════════ */}
        <View style={styles.packagesCtaSection}>
          {/* <View style={styles.sectionHeaderBlock}>
            <Text style={styles.sectionTitle}>Packages & Combos</Text>
            <View style={styles.titleUnderline} />
          </View> */}

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
                          onLoadEnd={() =>
                            setLoadedServices(prev =>
                              prev.has(String(item._id ?? item.id))
                                ? prev
                                : new Set(prev).add(String(item._id ?? item.id))
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
            MOST BOOKED SERVICES
        ══════════════════════════════════ */}
        {popularServices.length > 0 && (
          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <Text style={styles.popularTitle}>Most Booked Services</Text>
              {selectedCity?.name ? (
                <View style={styles.popularCityRow}>
                  <Ionicons name="location-sharp" size={sw(20)} color="#105641" />
                  <Text style={styles.popularCityText}>In {selectedCity.name}</Text>
                </View>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularScrollContent}>
              {popularServices.map((svc: any) => {
                const id = String(svc.id ?? svc._id);
                const isAdded = addedPopular.has(id);
                return (
                  <View key={id} style={styles.popularCard}>
                    <Image
                      source={{uri: svc.image ?? FALLBACK_IMAGE}}
                      style={styles.popularImg}
                      resizeMode="cover"
                    />
                    <View style={styles.popularCardBody}>
                      <Text style={styles.popularName} numberOfLines={2}>{svc.name}</Text>
                      {svc.duration ? (
                        <View style={styles.popularDurationRow}>
                          <Ionicons name="time-outline" size={sw(11)} color="#6B6B6B" />
                          <Text style={styles.popularDuration}>{svc.duration} mins</Text>
                        </View>
                      ) : null}
                      <Text style={styles.popularPrice}>
                        {svc.priceStartsFrom ? 'From ' : ''}₹{Math.round(parseFloat(svc.basePrice) || 0).toLocaleString('en-IN')}
                      </Text>
                      <TouchableOpacity
                        style={[styles.popularAddBtn, isAdded && styles.popularAddBtnDone]}
                        activeOpacity={0.8}
                        disabled={isAdded}
                        onPress={() => handleAddPopular(svc)}>
                        <Text style={[styles.popularAddText, isAdded && styles.popularAddTextDone]}>
                          {isAdded ? 'ADDED' : 'ADD'}
                        </Text>
                        {!isAdded && <Ionicons name="add" size={sw(14)} color="#105641" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ══════════════════════════════════
            WHY BEYOMO?
        ══════════════════════════════════ */}
        <View style={styles.whyBeyomoSection}>
          <View style={styles.whyBeyomoImgWrap}>
            <Image
              source={whyBeyomoBanner?.image ? {uri: whyBeyomoBanner.image} : require('../../assets/why_beyomo.png')}
              style={styles.whyBeyomoImg}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* ══════════════════════════════════
            TOP BRANDS
        ══════════════════════════════════ */}
        <View style={styles.brandsSection}>
          <View style={styles.brandsTag}>
            <Text style={styles.brandsTagText}>Top Brands</Text>
          </View>
          <Text style={styles.brandsTitle}>We use best Brands in 1-Time use packs</Text>
          <View style={styles.brandsGrid}>
            {BRAND_LOGOS.map((img, i) => (
              <View key={i} style={styles.brandCard}>
                <Image source={img} style={styles.brandImg} resizeMode="contain" />
              </View>
            ))}
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

  /* ── Header hero banner card — plain poster image ──
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
    width: sw(150.19),
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
    fontSize: sw(13),
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
    fontSize: sw(10),
    fontFamily: fonts.textFont,
    lineHeight: sw(10),
  },
  searchBar: {
    marginTop: sw(10),
    marginHorizontal: sw(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(28),
    paddingHorizontal: sw(16),
    paddingVertical: sw(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  searchBarText: {
    fontFamily: fonts.secondry,
    fontSize: sw(14),
    color: '#8A8A8A',
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.secondry,
    fontSize: sw(14),
    color: '#171816',
    padding: 0,
  },
  searchResultsCard: {
    marginHorizontal: sw(12),
    marginTop: sw(12),
    padding: sw(12),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    gap: sw(8),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  searchEmpty: {
    fontFamily: fonts.secondry,
    fontSize: sw(13),
    color: '#8A8A8A',
    textAlign: 'center',
    paddingVertical: sw(12),
  },
  searchResultLabel: {
    fontFamily: fonts.title,
    fontSize: sw(11),
    color: '#5C5C5C',
    marginTop: sw(6),
  },
  searchChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sw(6),
  },
  searchChip: {
    backgroundColor: '#E8F3EF',
    borderRadius: sw(16),
    paddingHorizontal: sw(12),
    paddingVertical: sw(6),
  },
  searchChipText: {
    fontFamily: fonts.secondry,
    fontSize: sw(12),
    color: '#105641',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    paddingVertical: sw(6),
  },
  searchRowImg: {
    width: sw(40),
    height: sw(40),
    borderRadius: sw(8),
    backgroundColor: '#F0F0F0',
  },
  searchRowTitle: {
    fontFamily: fonts.secondry,
    fontSize: sw(13),
    color: '#171816',
  },
  searchRowSub: {
    fontFamily: fonts.secondry,
    fontSize: sw(11),
    color: '#8A8A8A',
  },
  searchRowPrice: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    color: '#105641',
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
    backgroundColor: '#F5D4B0',
  },
  serviceImgInner: {
    width: '100%',
    height: '100%',
    borderRadius: sw(12.63),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceImg: {
    width: '100%',
    height: '100%',
  },
  serviceLabel: {
    fontFamily: fonts.secondry,
    fontSize: sw(12),
    color: '#000000',
    textAlign: 'center',
    lineHeight: sw(14),
  },

  /* ── Most Booked Services ──────────────────────── */
  popularSection: {
    marginTop: sw(24),
    paddingTop: sw(18),
    paddingBottom: sw(20),
    backgroundColor: '#E8F3EF',
  },
  popularHeader: {
    alignItems: 'center',
    gap: sw(6),
    marginBottom: sw(14),
    paddingHorizontal: sw(16),
  },
  popularTitle: {
    fontFamily: 'serif',
    fontSize: sw(20),
    lineHeight: sw(24),
    color: '#171816',
    textAlign: 'center',
  },
  popularCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(4),
    backgroundColor: '#D5E8DE',
    alignSelf: 'stretch',
    marginHorizontal: -sw(16),
    paddingVertical: sw(6),
  },
  popularCityText: {
    fontFamily: fonts.secondry,
    fontSize: sw(13),
    color: '#105641',
    fontWeight: '600',
  },
  popularScrollContent: {
    paddingHorizontal: sw(16),
    gap: sw(12),
  },
  popularCard: {
    width: POPULAR_CARD_W,
  },
  popularImg: {
    width: '100%',
    height: POPULAR_IMG_H,
    borderRadius: sw(14),
  },
  popularCardBody: {
    paddingTop: sw(8),
    paddingHorizontal: sw(2),
    gap: sw(4),
  },
  popularName: {
    fontFamily: fonts.secondry,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#171816',
    lineHeight: sw(16),
    minHeight: sw(32),
  },
  popularDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(3),
  },
  popularDuration: {
    fontFamily: fonts.secondry,
    fontSize: sw(11),
    color: '#6B6B6B',
  },
  popularPrice: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#171816',
    marginTop: sw(2),
  },
  popularAddBtn: {
    marginTop: sw(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(4),
    borderWidth: 1,
    borderColor: '#105641',
    borderRadius: sw(8),
    paddingVertical: sw(6),
    paddingHorizontal: sw(10),
  },
  popularAddBtnDone: {
    borderColor: '#C8A84C',
    backgroundColor: '#FCF3DD',
  },
  popularAddText: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    color: '#105641',
  },
  popularAddTextDone: {
    color: '#8A6D1F',
  },

  /* ── Why Beyomo? ──────────────────────── */
  whyBeyomoSection: {
    paddingHorizontal: sw(16),
    paddingTop: sw(24),
  },
  whyBeyomoImgWrap: {
    width: WHY_BEYOMO_W,
    height: WHY_BEYOMO_H,
    borderRadius: sw(16),
    overflow: 'hidden',
  },
  whyBeyomoImg: {
    width: '100%',
    height: '100%',
  },

  /* ── Top Brands ──────────────────────── */
  brandsSection: {
    marginTop: sw(28),
    paddingHorizontal: sw(16),
    paddingTop: sw(24),
    paddingBottom: sw(24),
    backgroundColor: '#012823',
  },
  brandsTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: sw(20),
    paddingHorizontal: sw(14),
    paddingVertical: sw(5),
    marginBottom: sw(10),
  },
  brandsTagText: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    color: '#012823',
  },
  brandsTitle: {
    fontFamily: 'serif',
    fontSize: sw(18),
    lineHeight: sw(22),
    color: '#FFFFFF',
    marginBottom: sw(16),
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BRAND_GAP,
  },
  brandCard: {
    width: BRAND_CARD_W,
    height: BRAND_CARD_W,
    borderRadius: sw(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: sw(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  brandImg: {
    width: '100%',
    height: '100%',
  },
});

export default HomeScreen;
