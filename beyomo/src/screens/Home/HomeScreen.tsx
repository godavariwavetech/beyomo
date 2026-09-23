import React, { useEffect, useRef, useState } from 'react';
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
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { HomeScreenSkeleton, SkeletonBox } from '../../components/Skeleton/Skeleton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fonts } from '../../config/theme';
import { fetchCategories } from '../../redux/reducers/services';
import { addServicesToCart, incrementServiceQty, decrementServiceQty } from '../../redux/reducers/cart';
import { fetchNotifications } from '../../redux/reducers/notifications';
import { fetchUserBookings } from '../../redux/reducers/bookings';
import CartBar from '../../components/CartBar/CartBar';
import type { AppDispatch, RootState } from '../../redux/store';
import api from '../../utils/api';
import { endpoints } from '../../config/config';
import { formatAmount } from '../../utils/utils';
import { useKeyboardVisible } from '../../utils/useKeyboardVisible';

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

const { width } = Dimensions.get('window');
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

const HEADER_CARD_ASPECT = 2.6;
// Slightly narrower than the full slide width, with matching side margins below, so the
// card has breathing room from the device edges instead of touching them directly.
const HEADER_CARD_W = width;
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

// "Most Booked Services" horizontal cards — sized so exactly 2 fit the visible
// scroll area, matching the getlook.in web layout (no 3rd-card peek)
const POPULAR_CARD_W = (width - sw(16) * 2 - sw(12)) / 2;
const POPULAR_IMG_H = POPULAR_CARD_W * 1.15;

// "Why Beyomo?" banner — same checklist graphic as the website (868×414px)
const WHY_BEYOMO_ASPECT = 628 / 355;
const WHY_BEYOMO_W = width - sw(32);
const WHY_BEYOMO_H = WHY_BEYOMO_W / WHY_BEYOMO_ASPECT;

// "Top Brands" logo grid — 3 columns, compact rectangular cards for a premium look
const BRAND_COLUMNS = 3;
const BRAND_GAP = sw(12);
// Math.floor guards against per-device pixel rounding: on some screen densities the
// exact float width, summed across 3 columns + 2 gaps, rounds up just past the
// container width, tipping the 3rd card onto a new row and leaving a gap in its place.
const BRAND_CARD_W = Math.floor((width - sw(32) - BRAND_GAP * (BRAND_COLUMNS - 1)) / BRAND_COLUMNS);
const BRAND_CARD_H = BRAND_CARD_W * 0.95;

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const HomeScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading } = useSelector((state: RootState) => state.Services);
  const selectedCity = useSelector((state: RootState) => state.City?.selectedCity);
  const userProfile = useSelector((state: RootState) => (state as any).User?.profile ?? (state as any).Auth?.user);
  const authToken = useSelector((state: RootState) => (state as any).Auth?.token);
  const unreadCount = useSelector((state: RootState) => (state as any).Notifications?.unreadCount ?? 0);
  const userBookings = useSelector((state: RootState) => (state as any).Bookings?.list ?? []);
  const cartServices = useSelector((state: RootState) => (state as any).Cart?.services ?? []);
  const [banners, setBanners] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  // "View Details" bottom sheet for a Most Booked Services card — same pattern as the
  // service detail sheet on ServiceListingScreen.
  const [detailItem, setDetailItem] = useState<any>(null);
  // Swipe-down-to-close on the detail sheet's handle — previously decorative only.
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (detailItem) sheetTranslateY.setValue(0);
  }, [detailItem]);
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) sheetTranslateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.8) {
          setDetailItem(null);
        } else {
          Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;
  const [packageStats, setPackageStats] = useState<{ flexibleMinPrice: number | null; flexibleCount: number; fixedMinPrice: number | null; fixedCount: number }>({ flexibleMinPrice: null, flexibleCount: 0, fixedMinPrice: null, fixedCount: 0 });

  const [loadedServices, setLoadedServices] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({ categories: [], services: [], packages: [], offers: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotating search placeholder — cycles every 3s to hint at what's searchable
  const searchPlaceholders = ['Search services, packages…', 'Try "Facial"', 'Book "Manicure"', 'Search "Bridal"'];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % searchPlaceholders.length), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults({ categories: [], services: [], packages: [], offers: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(() => {
      const cityParam = selectedCity?.id ? `&cityId=${selectedCity.id}` : '';
      api
        .get(`${endpoints.SEARCH}?q=${encodeURIComponent(q)}${cityParam}`)
        .then(res => {
          if (res.data?.status) setSearchResults(res.data.data ?? { categories: [], services: [], packages: [], offers: [] });
        })
        .catch(() => { })
        .finally(() => setSearchLoading(false));
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, selectedCity?.id]);

  const goToServiceListing = (categoryId: any, categoryName: string) => {
    Keyboard.dismiss();
    setSearchQuery('');
    navigation.navigate('ServiceListing', { categoryId, category: categoryName });
  };

  const goToPackage = (pkg: any) => {
    Keyboard.dismiss();
    setSearchQuery('');
    navigation.navigate('PackageDetail', { packageId: pkg.id });
  };

  const searchActive = searchQuery.trim().length >= 2;

  const currentHour = new Date().getHours();
  const greetingText = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (userProfile?.name ?? '').trim().split(/\s+/)[0] ?? '';

  const bookAgainList = (userBookings as any[])
    .filter(b => (b?.status ?? '').toLowerCase() === 'completed' && (b?.services?.length ?? 0) > 0)
    .slice(0, 3);

  const rebookServices = (booking: any) => {
    const services = (booking.services ?? []).map((s: any) => ({
      id: String(s.id ?? s.serviceId ?? ''),
      name: s.name,
      duration: s.duration ? `${s.duration} mins` : '',
      price: parseFloat(s.price ?? s.basePrice) || 0,
      image: s.image,
      qty: 1,
    })).filter((s: any) => s.id);
    if (services.length > 0) {
      dispatch(addServicesToCart(services));
      navigation.navigate('AddressPayment');
    }
  };
  const hasSearchResults =
    (searchResults.categories?.length ?? 0) > 0 ||
    (searchResults.services?.length ?? 0) > 0 ||
    (searchResults.packages?.length ?? 0) > 0 ||
    (searchResults.offers?.length ?? 0) > 0;

  const loadHomeData = () => {
    const bannersPromise = api.get(endpoints.BANNERS).then(res => {
      if (res.data?.status) setBanners(res.data.data ?? []);
    }).catch(() => { });
    const popularPromise = api.get(endpoints.SERVICES, {
      params: { isPopular: true, limit: 8, cityId: selectedCity?.id },
    }).then(res => {
      if (res.data?.status) setPopularServices(res.data.data ?? []);
    }).catch(() => { });
    const packagesPromise = api.get(endpoints.PACKAGES, {
      params: selectedCity?.id ? { cityId: selectedCity.id } : {},
    }).then(res => {
      if (res.data?.status) {
        const all = (res.data.data ?? []) as any[];
        const flexible = all.filter(p => p.packageType === 'flexible');
        const fixed = all.filter(p => p.packageType === 'fixed');
        const minPrice = (arr: any[]) => arr.length ? Math.min(...arr.map(p => Math.round(parseFloat(p.price) || 0))) : null;
        setPackageStats({
          flexibleCount: flexible.length,
          flexibleMinPrice: minPrice(flexible),
          fixedCount: fixed.length,
          fixedMinPrice: minPrice(fixed),
        });
      }
    }).catch(() => { });
    const authedPromises: Promise<any>[] = authToken
      ? [dispatch(fetchNotifications()) as any, dispatch(fetchUserBookings()) as any]
      : [];
    return Promise.all([
      // Same city the popular-services call above already uses, so the category strip
      // can't offer a category that has nothing available in this city.
      dispatch(fetchCategories(selectedCity?.id ? { cityId: selectedCity.id } : {})),
      bannersPromise,
      popularPromise,
      packagesPromise,
      ...authedPromises,
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
          STICKY HEADER — stays pinned at top while scrolling
          Contains: dark ellipse + nav row + search bar
      ══════════════════════════════════ */}
      <View style={[styles.stickyHeader, { paddingTop: insets.top }]}>
        <View style={styles.ellipse} />
        <Image
          source={require('../../assets/leaf_alt.png')}
          style={styles.headerLeaf}
          resizeMode="contain"
        />

        <View style={styles.headerRow}>
          <View style={styles.headerSide}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.locationBtn}
              onPress={() => navigation.navigate('CitySelector', { returnToHome: true })}>
              <Ionicons name="location-sharp" size={sw(12)} color="#FFFFFF" />
              <View style={styles.locationNameRow}>
                <Text style={styles.locationName} numberOfLines={1}>
                  {selectedCity?.name ?? 'Select City'}
                </Text>
                <Ionicons name="chevron-down-outline" size={sw(10)} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          <Image
            source={require('../../assets/beyomo_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <View style={[styles.headerSide, styles.headerSideRight]}>
            <TouchableOpacity activeOpacity={0.7} style={styles.bellBtn} onPress={() => Linking.openURL('https://wa.me/919885909192')}>
              <Ionicons name="logo-whatsapp" size={sw(24)} color="#25D366" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={sw(18)} color="#8A8A8A" />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholders[placeholderIdx]}
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

        {/* Inline search results appear right below the search bar (scrollable) */}
        {searchActive && (
          <ScrollView
            style={styles.searchResultsCard}
            contentContainerStyle={styles.searchResultsContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled>
            {searchLoading && <ActivityIndicator color="#105641" style={{ marginVertical: sw(16) }} />}
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
                    <Image source={{ uri: svc.image || FALLBACK_IMAGE }} style={styles.searchRowImg} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchRowTitle} numberOfLines={1}>{svc.name}</Text>
                      <Text style={styles.searchRowSub} numberOfLines={1}>
                        {svc.category?.name ?? ''}{svc.duration ? ` · ${svc.duration} mins` : ''}
                      </Text>
                    </View>
                    <Text style={styles.searchRowPrice}>₹{formatAmount(svc.price ?? svc.basePrice ?? 0)}</Text>
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
                    <Image source={{ uri: pkg.image || FALLBACK_IMAGE }} style={styles.searchRowImg} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchRowTitle} numberOfLines={1}>{pkg.title}</Text>
                    </View>
                    <Text style={styles.searchRowPrice}>₹{formatAmount(pkg.price ?? 0)}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#105641']} tintColor="#105641" />
        }>

        {/* Hero banner scrolls with content */}
        {heroBanner?.image ? (
          <View>
            <View style={styles.headerCardShadowWrap}>
              <View style={styles.headerCardImgWrap}>
                <Image
                  source={{ uri: heroBanner.image }}
                  style={styles.headerCardImg}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        ) : null}

        {/* ══════════════════════════════════
            TRUST STRIP — real counts from cats + city + brand grid
        ══════════════════════════════════ */}
        {!searchActive && categories.length > 0 && (
          <View style={styles.trustStrip}>
            <View style={styles.trustItem}>
              <Ionicons name="sparkles" size={sw(14)} color="#C8A84C" />
              <Text style={styles.trustText}>{categories.length}+ Categories</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons name="ribbon" size={sw(14)} color="#C8A84C" />
              <Text style={styles.trustText}>Top Brands</Text>
            </View>
            {selectedCity?.name ? (
              <>
                <View style={styles.trustDot} />
                <View style={styles.trustItem}>
                  <Ionicons name="location" size={sw(14)} color="#C8A84C" />
                  <Text style={styles.trustText}>{selectedCity.name}</Text>
                </View>
              </>
            ) : null}
          </View>
        )}

        {/* ══════════════════════════════════
            PACKAGES & COMBOS — pick a flexible build-your-own package, or a
            ready-made combo, same split the website offers ('flexible' vs 'fixed')
        ══════════════════════════════════ */}
        <View style={styles.packagesCtaSection}>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaCardShadow}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('CustomPackages')}>
              {/* <View style={styles.ctaCardImgWrap}>
                <Image
                  source={customPackageBanner?.image ? {uri: customPackageBanner.image} : require('../../assets/custom_package_banner.png')}
                  style={styles.ctaCardImg}
                  resizeMode="cover"
                />
              </View> */}

              <View style={styles.ctaCardImgWrap}>
                {customPackageBanner?.image ?
                  (<Image source={{ uri: customPackageBanner.image }} style={styles.ctaCardImg} resizeMode="cover" />) :
                  (<View style={styles.noImageContainer}>
                    <Text style={styles.noImageText}>No image found</Text>
                  </View>)}
              </View>
              {packageStats.flexibleCount > 0 && (
                <Text style={styles.ctaCaption} numberOfLines={1}>
                  {packageStats.flexibleCount} {packageStats.flexibleCount === 1 ? 'package' : 'packages'}
                  {packageStats.flexibleMinPrice != null ? ` · from ₹${formatAmount(packageStats.flexibleMinPrice)}` : ''}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctaCardShadow}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('PackageListing', { packageType: 'fixed', title: 'Combos' })}>
              {/* <View style={styles.ctaCardImgWrap}>
                <Image
                  source={comboBanner?.image ? { uri: comboBanner.image } : require('../../assets/combo_banner.png')}
                  style={styles.ctaCardImg}
                  resizeMode="cover"
                />
              </View> */}

              <View style={styles.ctaCardImgWrap}>
                {comboBanner?.image ?
                  (<Image source={{ uri: comboBanner.image }} style={styles.ctaCardImg} resizeMode="cover" />) :
                  (<View style={styles.noImageContainer}>
                    <Text style={styles.noImageText}>No image found</Text>
                  </View>)}
              </View>
              {packageStats.fixedCount > 0 && (
                <Text style={styles.ctaCaption} numberOfLines={1}>
                  {packageStats.fixedCount} {packageStats.fixedCount === 1 ? 'combo' : 'combos'}
                  {packageStats.fixedMinPrice != null ? ` · from ₹${formatAmount(packageStats.fixedMinPrice)}` : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════
            OUR SERVICES
        ══════════════════════════════════ */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeaderBlock}>
            <Text style={styles.sectionTitle}>Our Services</Text>
          </View>

          <View style={styles.servicesGridWrap}>
            <View style={styles.grid}>
              {chunkArray(categories.slice(0, 12), 4).map((row: any[], ri: number) => (
                <View key={ri} style={styles.gridRow}>
                  {row.map((item: any) => (
                    <TouchableOpacity
                      key={item._id ?? item.id}
                      style={styles.serviceItem}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('ServiceListing', { categoryId: item._id ?? item.id, category: item.name })}>
                      <View style={styles.serviceImgBox}>
                        <View style={styles.serviceImgInner}>
                          <Image
                            source={{ uri: item.image ?? FALLBACK_IMAGE }}
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

            {/* Was `> 12` — i.e. only when the 12-item grid above actually truncated the
              list. That made the button vanish the moment city filtering brought a city
              down to 12 or fewer categories, which reads as the button being broken.
              It's a useful way into the full list either way, so it shows whenever
              there's anything to show. */}
            {categories.length > 0 && (
              <TouchableOpacity
                style={styles.viewAllRow}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AllCategories')}>
                <Text style={styles.viewAllText}>View All Services</Text>
                <Ionicons name="chevron-forward" size={sw(14)} color="#105641" />
              </TouchableOpacity>
            )}
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
              {popularServices.map((svc: any, idx: number) => {
                const id = String(svc.id ?? svc._id);
                const cartLine = (cartServices as any[]).find(s => String(s.id) === id && !s.isFree);
                const qty = cartLine?.qty ?? 0;
                return (
                  <View key={id} style={styles.popularCard}>
                    <View style={styles.popularImgWrap}>
                      <Image
                        source={{ uri: svc.image ?? FALLBACK_IMAGE }}
                        style={styles.popularImg}
                        resizeMode="cover"
                      />
                      {idx < 2 && (
                        <View style={styles.trendingBadge}>
                          <Ionicons name="flame" size={sw(10)} color="#FFFFFF" />
                          <Text style={styles.trendingText}>{idx === 0 ? 'Trending' : 'Popular'}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.popularCardBody}>
                      <Text style={styles.popularName} numberOfLines={2}>{svc.name}</Text>
                      {svc.duration ? (
                        <View style={styles.popularDurationRow}>
                          <Ionicons name="time-outline" size={sw(11)} color="#C8A84C" />
                          <Text style={styles.popularDuration}>{svc.duration} mins</Text>
                        </View>
                      ) : null}
                      <Text style={styles.popularPrice}>
                        {svc.priceStartsFrom ? 'From ' : ''}₹{formatAmount(parseFloat(svc.basePrice) || 0)}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setDetailItem(svc)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        style={styles.viewDetailsBtn}>
                        <Text style={styles.viewDetails}>View Details ›</Text>
                      </TouchableOpacity>
                      {qty === 0 ? (
                        <TouchableOpacity
                          style={styles.popularAddBtn}
                          activeOpacity={0.8}
                          onPress={() => handleAddPopular(svc)}>
                          <Text style={styles.popularAddText}>ADD</Text>
                          <Ionicons name="add" size={sw(14)} color="#105641" />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.popularStepper}>
                          <TouchableOpacity
                            style={styles.popularStepBtn}
                            activeOpacity={0.7}
                            onPress={() => dispatch(decrementServiceQty(id))}>
                            <Ionicons name="remove" size={sw(14)} color="#105641" />
                          </TouchableOpacity>
                          <Text style={styles.popularStepCount}>{qty}</Text>
                          <TouchableOpacity
                            style={styles.popularStepBtn}
                            activeOpacity={0.7}
                            onPress={() => dispatch(incrementServiceQty(id))}>
                            <Ionicons name="add" size={sw(14)} color="#105641" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── "View Details" sheet for a Most Booked Services card — same UI/behavior
            as the service detail sheet on ServiceListingScreen. ── */}
        <Modal
          visible={!!detailItem}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailItem(null)}>
          <View style={styles.sheetContainer}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setDetailItem(null)} />

            {detailItem && (() => {
              const detailId = String(detailItem.id ?? detailItem._id);
              const detailQty = (cartServices as any[]).find((s: any) => String(s.id) === detailId && !s.isFree)?.qty ?? 0;
              const detailPrice = parseFloat(detailItem.basePrice) || 0;
              const detailOriginalPrice = parseFloat(detailItem.originalPrice ?? detailItem.mrp) || detailPrice;
              const detailDiscountPct = detailItem.discountPct ?? detailItem.discountPercent ??
                (detailOriginalPrice > detailPrice ? Math.round(((detailOriginalPrice - detailPrice) / detailOriginalPrice) * 100) : 0);
              const detailBullets = detailItem.bullets ?? detailItem.highlights?.join('\n') ?? detailItem.description ?? '';
              return (
                <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + sw(16) }, { transform: [{ translateY: sheetTranslateY }] }]}>
                  <View style={styles.sheetHero}>
                    {detailItem.image
                      ? <Image source={{ uri: detailItem.image }} style={styles.sheetHeroImg} resizeMode="cover" />
                      : <View style={[styles.sheetHeroImg, { backgroundColor: '#E8F3EF' }]} />
                    }
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.55)']}
                      style={styles.sheetHeroGradient}
                    />
                    <View style={styles.sheetHeroPriceBadge}>
                      <Text style={styles.sheetHeroPrice}>{detailItem.priceStartsFrom ? 'Starts at ' : ''}₹{formatAmount(detailPrice)}</Text>
                      {detailOriginalPrice > detailPrice && (
                        <Text style={styles.sheetHeroOriginal}>₹{formatAmount(detailOriginalPrice)}</Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setDetailItem(null)} activeOpacity={0.8}>
                      <Ionicons name="close" size={sw(18)} color="#171816" />
                    </TouchableOpacity>
                    {/* Handle — draggable: swipe down (or a fast flick) closes the sheet */}
                    <View style={styles.sheetHandleHitArea} {...sheetPanResponder.panHandlers}>
                      <View style={styles.sheetHandle} />
                    </View>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScrollContent}>
                    <Text style={styles.sheetName}>{detailItem.name}</Text>

                    <View style={styles.sheetPillsRow}>
                      {!!detailItem.duration && (
                        <View style={styles.sheetPill}>
                          <Ionicons name="time-outline" size={sw(13)} color="#105641" />
                          <Text style={styles.sheetPillText}>{detailItem.duration} mins</Text>
                        </View>
                      )}
                      {detailDiscountPct > 0 && (
                        <View style={[styles.sheetPill, styles.sheetPillGreen]}>
                          <Ionicons name="pricetag-outline" size={sw(13)} color="#008F30" />
                          <Text style={[styles.sheetPillText, { color: '#008F30' }]}>{detailDiscountPct}% OFF</Text>
                        </View>
                      )}
                      {!!detailItem.bookedCount && (
                        <View style={styles.sheetPill}>
                          <Ionicons name="people-outline" size={sw(13)} color="#0068F0" />
                          <Text style={[styles.sheetPillText, { color: '#0068F0' }]}>{detailItem.bookedCount}</Text>
                        </View>
                      )}
                    </View>

                    {!!detailBullets && <View style={styles.sheetDivider} />}
                    {!!detailBullets && (
                      <>
                        <Text style={styles.sheetSectionLabel}>What's Included</Text>
                        {detailBullets.split('\n').map((line: string, i: number) =>
                          line.trim() ? (
                            <View key={i} style={styles.sheetBulletRow}>
                              <View style={styles.sheetBulletDot} />
                              <Text style={styles.sheetBulletText}>{line.trim()}</Text>
                            </View>
                          ) : null,
                        )}
                      </>
                    )}
                  </ScrollView>

                  <View style={styles.sheetFooter}>
                    {detailQty === 0 ? (
                      <TouchableOpacity
                        style={styles.sheetAddBtn}
                        activeOpacity={0.85}
                        onPress={() => { handleAddPopular(detailItem); setDetailItem(null); }}>
                        <Text style={styles.sheetAddBtnText}>Add to Cart</Text>
                        <View style={styles.sheetAddBtnPriceBadge}>
                          <Text style={styles.sheetAddBtnPrice}>₹{formatAmount(detailPrice)}</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.sheetStepperRow}>
                        <View style={styles.sheetStepper}>
                          <TouchableOpacity style={styles.sheetStepBtn} activeOpacity={0.7} onPress={() => dispatch(decrementServiceQty(detailId))}>
                            <Ionicons name="remove" size={sw(18)} color="#105641" />
                          </TouchableOpacity>
                          <Text style={styles.sheetStepCount}>{detailQty}</Text>
                          <TouchableOpacity style={styles.sheetStepBtn} activeOpacity={0.7} onPress={() => dispatch(incrementServiceQty(detailId))}>
                            <Ionicons name="add" size={sw(18)} color="#105641" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.sheetDoneBtn} activeOpacity={0.85} onPress={() => setDetailItem(null)}>
                          <Ionicons name="checkmark" size={sw(16)} color="#FFFFFF" />
                          <Text style={styles.sheetAddBtnText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })()}
          </View>
        </Modal>

        {/* ══════════════════════════════════
            WHY BEYOMO?
        ══════════════════════════════════ */}
        <View style={styles.whyBeyomoSection}>
          <View style={styles.whyBeyomoShadowWrap}>
            <View style={styles.whyBeyomoImgWrap}>
              <Image
                source={whyBeyomoBanner?.image ? { uri: whyBeyomoBanner.image } : require('../../assets/why_beyomo.png')}
                style={styles.whyBeyomoImg}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════
            TOP BRANDS
        ══════════════════════════════════ */}
        <View style={styles.brandsSection}>
          <View style={styles.brandsTag}>
            <Ionicons name="shield-checkmark" size={sw(12)} color="#012823" />
            <Text style={styles.brandsTagText}>Top Brands</Text>
          </View>
          <Text style={styles.brandsTitle}>We use best Brands in 1-Time use packs</Text>
          <View style={styles.brandsGrid}>
            {BRAND_LOGOS.slice(0, 6).map((img, i) => (
              <View key={i} style={styles.brandCard}>
                <Image source={img} style={styles.brandImg} resizeMode="contain" />
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
      {/* Search pulls up the keypad over the bottom of the screen — the cart bar
          (and the tab bar below it) would just ride on top of it. */}
      {!keyboardVisible && <CartBar navigation={navigation} />}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FCF8F3',
  },
  scroll: { flex: 1 },
  // No bottom padding here — Top Brands (the last section) is a full-bleed dark green
  // block, and padding on the scroll container itself would show as a strip of the
  // screen's off-white background below it, breaking the full-bleed look. The same
  // amount of bottom spacing is added to brandsSection's own paddingBottom instead, so
  // it stays green all the way down to the tab bar.
  contentContainer: { paddingBottom: 0 },

  /* ── Header hero banner card — plain poster image ──
     RN clips shadows away on any view that also has overflow:hidden (needed
     here to clip the image to rounded corners), so the shadow lives on an
     outer wrapper and the rounding + clipping lives on the inner one. ── */
  headerCardShadowWrap: {
    width: HEADER_CARD_W,
    height: HEADER_CARD_H,
    backgroundColor: '#FCF8F3',
  },
  headerCardImgWrap: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  headerCardImg: {
    width: '100%',
    height: '100%',
  },

  unreadDot: {
    position: 'absolute',
    top: sw(4),
    right: sw(4),
    width: sw(8),
    height: sw(8),
    borderRadius: sw(4),
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: '#012823',
  },

  /* ── Book Again ──────────────────────── */
  bookAgainSection: {
    paddingTop: sw(22),
  },
  bookAgainTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: sw(18),
    color: '#171816',
    letterSpacing: 0.3,
    paddingHorizontal: sw(16),
    marginBottom: sw(12),
  },
  bookAgainScroll: {
    paddingHorizontal: sw(16),
    gap: sw(12),
  },
  bookAgainCard: {
    width: sw(240),
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAE4D8',
  },
  bookAgainImg: {
    width: sw(72),
    height: sw(82),
    backgroundColor: '#F0F0F0',
  },
  bookAgainBody: {
    flex: 1,
    paddingHorizontal: sw(10),
    paddingVertical: sw(8),
    justifyContent: 'space-between',
  },
  bookAgainName: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    color: '#171816',
  },
  bookAgainExtra: {
    fontFamily: fonts.secondry,
    fontSize: sw(11),
    color: '#5C5C5C',
  },
  bookAgainBtn: {
    marginTop: sw(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(4),
    backgroundColor: '#105641',
    borderRadius: sw(8),
    paddingVertical: sw(6),
  },
  bookAgainBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(11),
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* ── Personalization greeting ──────────────────────── */
  greetingStrip: {
    paddingHorizontal: sw(20),
    paddingTop: sw(22),
    gap: sw(2),
  },
  greetingText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: sw(16),
    color: '#171816',
    letterSpacing: 0.3,
  },
  greetingSub: {
    fontFamily: fonts.secondry,
    fontSize: sw(12),
    color: '#5C5C5C',
  },
  greetingStripHeader: {
    paddingHorizontal: sw(20),
    paddingTop: sw(14),
    gap: sw(2),
  },
  greetingTextLight: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: sw(16),
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  greetingSubLight: {
    fontFamily: fonts.secondry,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.72)',
  },

  /* ── Trust strip ──────────────────────── */
  trustStrip: {
    marginTop: sw(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: sw(8),
    backgroundColor: '#DCEBE3',
    paddingHorizontal: sw(14),
    paddingVertical: sw(9),
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(5),
  },
  trustText: {
    fontFamily: fonts.title,
    fontSize: sw(11.5),
    color: '#171816',
    letterSpacing: 0.2,
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C8A84C',
  },

  /* ── Packages & Combos CTA cards ──────────────────────── */
  packagesCtaSection: {
    paddingHorizontal: sw(16),
    paddingTop: sw(22),
  },
  ctaCaption: {
    fontFamily: fonts.secondry,
    fontSize: sw(11),
    color: '#5C5C5C',
    marginTop: sw(6),
    letterSpacing: 0.2,
    textAlign: 'center',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaCardImgWrap: {
    width: CTA_CARD_W,
    height: CTA_CARD_H,
    borderRadius: sw(14),
    overflow: 'hidden',
  },
  noImageContainer:
  {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  noImageText:
  {
    fontSize: 14,
    color: '#777',
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
  stickyHeader: {
    overflow: 'hidden',
    paddingBottom: sw(18),
    zIndex: 10,
    backgroundColor: '#012823',
    borderBottomLeftRadius: sw(24),
    borderBottomRightRadius: sw(24),
  },
  ellipse: {
    position: 'absolute',
    width: ELLIPSE_H,
    height: ELLIPSE_H,
    left: ELLIPSE_LEFT + ELLIPSE_W / 2 - ELLIPSE_H / 2,
    top: ELLIPSE_TOP,
    borderRadius: ELLIPSE_H / 2,
    transform: [{ scaleX: ELLIPSE_SCALE_X }],
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
    paddingHorizontal: sw(12),
    paddingTop: sw(14),
    paddingBottom: sw(4),
  },
  // The location button and the WhatsApp icon are different widths, so
  // space-between left the logo sitting right of centre. Equal flex sides pin it
  // to the true middle of the row whatever the city name is.
  headerSide: {
    flex: 1,
  },
  headerSideRight: {
    alignItems: 'flex-end',
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
    color: '#FFFFFF',
    maxWidth: sw(78),
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    maxHeight: sw(420),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  // Padding belongs on the scrollable content, not the ScrollView's own `style` —
  // otherwise it doesn't apply to the actual content box, and the last row has no
  // bottom clearance before the card's hard maxHeight cutoff, so it reads as "cut off".
  searchResultsContent: {
    gap: sw(8),
    padding: sw(12),
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
    marginTop: sw(24),
    paddingBottom: sw(8),
  },
  sectionHeaderBlock: {
    backgroundColor: '#EFF6F2',
    paddingVertical: sw(16),
    marginBottom: sw(22),
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: sw(18),
    lineHeight: sw(23),
    color: '#171816',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  servicesGridWrap: {
    paddingHorizontal: sw(16),
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
    borderRadius: sw(14),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: sw(1) },
    shadowOpacity: 0.05,
    shadowRadius: sw(6),
    backgroundColor: '#F4E1CC',
  },
  serviceImgInner: {
    width: '100%',
    height: '100%',
    borderRadius: sw(14),
    overflow: 'hidden',
  },
  serviceImg: {
    width: '100%',
    height: '100%',
  },
  serviceLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: sw(15),
  },
  viewAllRow: {
    marginTop: sw(20),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    paddingHorizontal: sw(18),
    paddingVertical: sw(8),
    borderRadius: sw(20),
    backgroundColor: '#EBF5EF',
  },
  viewAllText: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    color: '#105641',
    letterSpacing: 0.3,
  },

  /* ── Most Booked Services ──────────────────────── */
  popularSection: {
    marginTop: sw(12),
    paddingTop: sw(22),
    paddingBottom: sw(26),
    backgroundColor: '#EFF6F2',
  },
  popularHeader: {
    alignItems: 'center',
    gap: sw(8),
    marginBottom: sw(14),
    paddingHorizontal: sw(16),
  },
  popularTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: sw(20),
    lineHeight: sw(24),
    color: '#0F0F0F',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  popularUnderline: {
    width: sw(29.43),
    height: 2,
    backgroundColor: '#C8A84C',
  },
  popularCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(4),
    backgroundColor: '#DCEBE3',
    alignSelf: 'stretch',
    marginHorizontal: -sw(16),
    paddingVertical: sw(7),
    marginTop: sw(4),
  },
  popularCityText: {
    fontFamily: fonts.secondry,
    fontSize: sw(13),
    color: '#0F0F0F',
    fontWeight: '600',
  },
  popularScrollContent: {
    paddingHorizontal: sw(16),
    gap: sw(12),
  },
  popularCard: {
    width: POPULAR_CARD_W,
  },
  popularImgWrap: {
    position: 'relative',
    height: POPULAR_IMG_H,
    borderRadius: sw(14),
    backgroundColor: '#DCEBE3',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularImg: {
    width: '100%',
    height: '100%',
  },
  trendingBadge: {
    position: 'absolute',
    top: sw(8),
    left: sw(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(3),
    backgroundColor: '#F97316',
    paddingHorizontal: sw(7),
    paddingVertical: sw(3),
    borderRadius: sw(10),
  },
  trendingText: {
    fontFamily: fonts.title,
    fontSize: sw(9),
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  popularCardBody: {
    paddingTop: sw(12),
    paddingHorizontal: sw(4),
    gap: sw(8),
  },
  popularName: {
    fontFamily: fonts.secondry,
    fontSize: sw(13),
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
    color: '#5C5C5C',
    letterSpacing: 0.2,
  },
  popularPrice: {
    fontFamily: fonts.title,
    fontSize: sw(17),
    color: '#012823',
    letterSpacing: 0.2,
  },
  popularAddBtn: {
    marginTop: sw(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(4),
    borderWidth: 1,
    borderColor: '#105641',
    backgroundColor: '#EBF5EF',
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
  popularStepper: {
    marginTop: sw(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#105641',
    backgroundColor: '#EBF5EF',
    borderRadius: sw(8),
    overflow: 'hidden',
  },
  popularStepBtn: {
    width: sw(30),
    height: sw(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularStepCount: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    color: '#105641',
  },
  viewDetailsBtn: {
    paddingVertical: sw(2),
  },
  viewDetails: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    color: '#105641',
    lineHeight: sw(16),
  },

  /* ── Most Booked Services — "View Details" sheet (same design as the service
     detail sheet on ServiceListingScreen) ──────────────────────── */
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: sw(24),
    borderTopRightRadius: sw(24),
    maxHeight: '88%',
    overflow: 'hidden',
  },
  sheetHero: {
    position: 'relative',
    width: '100%',
    height: sw(210),
  },
  sheetHeroImg: {
    width: '100%',
    height: '100%',
  },
  sheetHeroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: sw(90),
  },
  sheetHeroPriceBadge: {
    position: 'absolute',
    bottom: sw(14),
    left: sw(16),
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: sw(6),
  },
  sheetHeroPrice: {
    fontFamily: fonts.title,
    fontSize: sw(22),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetHeroOriginal: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: 'rgba(255,255,255,0.65)',
    textDecorationLine: 'line-through',
  },
  sheetCloseBtn: {
    position: 'absolute',
    top: sw(12),
    right: sw(12),
    width: sw(32),
    height: sw(32),
    borderRadius: sw(16),
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHandle: {
    width: sw(36),
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  // Bigger invisible touch target around the handle bar so it's easy to grab.
  sheetHandleHitArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: sw(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScrollContent: {
    paddingHorizontal: sw(16),
    paddingTop: sw(16),
    paddingBottom: sw(12),
  },
  sheetName: {
    fontFamily: fonts.title,
    fontSize: sw(20),
    fontWeight: '800',
    color: '#171816',
    lineHeight: sw(26),
    marginBottom: sw(12),
  },
  sheetPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sw(8),
    marginBottom: sw(16),
  },
  sheetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(5),
    backgroundColor: '#F2F2F2',
    borderRadius: sw(20),
    paddingHorizontal: sw(10),
    paddingVertical: sw(5),
  },
  sheetPillGreen: {
    backgroundColor: '#E8F8EE',
  },
  sheetPillText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '600',
    color: '#414141',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: sw(14),
  },
  sheetSectionLabel: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#A3A3A3',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: sw(10),
  },
  sheetBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(10),
    marginBottom: sw(8),
  },
  sheetBulletDot: {
    width: sw(7),
    height: sw(7),
    borderRadius: sw(4),
    backgroundColor: '#105641',
    marginTop: sw(6),
    flexShrink: 0,
  },
  sheetBulletText: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#444444',
    lineHeight: sw(20),
  },
  sheetFooter: {
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sheetAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#105641',
    borderRadius: sw(14),
    height: sw(52),
    gap: sw(10),
  },
  sheetAddBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetAddBtnPriceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: sw(8),
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
  },
  sheetAddBtnPrice: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
  },
  sheetStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#105641',
    borderRadius: sw(14),
    height: sw(52),
    overflow: 'hidden',
  },
  sheetStepBtn: {
    width: sw(48),
    height: sw(52),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetStepCount: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '800',
    color: '#105641',
    minWidth: sw(28),
    textAlign: 'center',
  },
  sheetDoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#105641',
    borderRadius: sw(14),
    height: sw(52),
    gap: sw(6),
  },

  /* ── Why Beyomo? ──────────────────────── */
  whyBeyomoSection: {
    paddingHorizontal: sw(16),
    paddingTop: sw(28),
  },
  whyBeyomoShadowWrap: {
    width: WHY_BEYOMO_W,
    height: WHY_BEYOMO_H,
    borderRadius: sw(16),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  whyBeyomoImgWrap: {
    width: '100%',
    height: '100%',
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
    paddingBottom: sw(56),
    backgroundColor: '#105641',
  },
  brandsTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(5),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(20),
    paddingHorizontal: sw(12),
    paddingVertical: sw(5),
    marginBottom: sw(10),
  },
  brandsTagText: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    color: '#105641',
  },
  brandsTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: sw(18),
    lineHeight: sw(22),
    color: '#FFFFFF',
    marginBottom: sw(16),
    letterSpacing: 0.4,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BRAND_GAP,
  },
  brandCard: {
    width: BRAND_CARD_W,
    height: BRAND_CARD_H,
    borderRadius: sw(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: sw(4),
  },
  brandImg: {
    width: '100%',
    height: '100%',
  },
});

export default HomeScreen;
