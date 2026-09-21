import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {fonts} from '../../config/theme';
import {useDispatch, useSelector} from 'react-redux';
import {fetchCategories, fetchServices} from '../../redux/reducers/services';
import {
  addServicesToCart,
  decrementServiceQty,
  removeFreeService,
} from '../../redux/reducers/cart';
import {formatAmount} from '../../utils/utils';
import {deriveVariants} from '../../utils/serviceVariants';
import {getCachedServices, setCachedServices, clearCachedServices} from '../../utils/servicesCache';
import {BASE_URL, endpoints} from '../../config/config';

const MAX_SERVICE_QTY = 5;

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

// 3 subcategory cards per row, laid out the same way PackageListingScreen sizes its
// combo grid — screen width minus the row's side padding and the two gaps between cards.
const SUBCAT_GAP = sw(10);
const SUBCAT_CARD_W = (width - sw(16) * 2 - SUBCAT_GAP * 2) / 3;

const normalizeService = (s: any) => ({
  id:            s._id ?? s.id ?? '',
  name:          s.name ?? '',
  duration:      s.duration ? (typeof s.duration === 'number' ? `${s.duration} mins` : s.duration) : '',
  bookedCount:   s.bookedCount ?? s.bookingCount ?? '',
  bullets:       s.bullets ?? s.highlights?.join('\n') ?? s.description ?? '',
  price:         s.price ?? s.basePrice ?? s.discountedPrice ?? 0,
  originalPrice: s.originalPrice ?? s.mrp ?? s.price ?? 0,
  discountPct:   s.discountPercent ?? s.discountPct ?? (s.originalPrice && s.price ? Math.round(((s.originalPrice - s.price) / s.originalPrice) * 100) : 0),
  image:         s.image ?? s.photo ?? s.thumbnail ?? '',
  priceStartsFrom: s.priceStartsFrom ?? false,
  // null for services not filed under a subcategory.
  subcategoryId: s.subcategoryId ?? null,
});

interface Props {
  navigation?: any;
  route?: any;
}

const ServiceListingScreen = ({navigation, route}: Props) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const {categories: rawCategories, services: rawServices, loading} = useSelector((s: any) => s.Services);

  // The city the user picked (or was located into). Every service request has to carry
  // it, otherwise the backend can't apply that service's city mapping and returns
  // city-specific services to everyone. Same source Home already reads.
  const selectedCityId = useSelector((s: any) => s.City?.selectedCity?.id ?? null);
  const cityParam = selectedCityId ? {cityId: selectedCityId} : {};

  const initialCat = route?.params?.category ?? '';
  const initialCatId = route?.params?.categoryId ?? null;
  const offer = route?.params?.offer ?? null;

  // Derived offer helpers (computed once, stable)
  const offerType: string = offer?.triggerType ?? '';
  const offerRequiredIds: Set<string> = new Set(
    offerType === 'specific_services'
      ? (offer?.requiredServices ?? []).map((s: any) => String(s.id))
      : [],
  );
  const offerCategoryId: any = offerType === 'category'
    ? (offer?.triggerValue?.categoryId ?? null)
    : null;

  // Build the free service item (price = 0, locked in cart). Memoized because the
  // sync effect below depends on it — rebuilt inline it would be a fresh object on
  // every render and re-run the effect each time.
  const freeServiceItem: any | null = useMemo(() => offer?.freeService
    ? {
        id: String(offer.freeService.id),
        name: offer.freeService.name,
        duration: offer.freeService.duration ? `${offer.freeService.duration} mins` : '',
        price: 0,
        originalPrice: parseFloat(String(offer.freeService.basePrice ?? 0)),
        discountPct: 0,
        image: offer.freeService.image ?? '',
        isFree: true,
        bookedCount: '',
        bullets: '',
      }
    : null, [offer]);

  const [activeCategory, setActiveCategory] = useState<string>(initialCat);
  const [activeCategoryId, setActiveCategoryId] = useState<any>(
    offerCategoryId ?? initialCatId,
  );
  // The shared cart is the only source of truth for what has been added. Keeping a
  // local copy meant an Add was invisible to the cart bar on Home and to every other
  // screen until checkout, and backing out of here with the Android button threw the
  // whole selection away — the dispatch that committed it only ran on "Book Now".
  //
  // The free service is added/removed automatically as the required items are
  // added/removed below — never pre-populated, since the cart starts empty and the
  // offer's condition isn't met yet.
  const cartServices = useSelector((st: any) => st.Cart?.services ?? []);

  const quantities: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const svc of cartServices) map[String(svc.id)] = svc.qty;
    return map;
  }, [cartServices]);

  // Cross-category selections stay addressable because they live in the cart, not in
  // whichever category list happens to be loaded.
  const addedServicesMap: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    for (const svc of cartServices) map[String(svc.id)] = svc;
    return map;
  }, [cartServices]);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [sortBy, setSortBy] = useState<'default'|'price_asc'|'price_desc'|'popular'>('default');
  const [filterDiscount, setFilterDiscount] = useState(false);
  const [filterDuration, setFilterDuration] = useState<'all'|'short'|'medium'|'long'>('all');

  // Subcategories for the active category (e.g. Waxing -> Honey / Rica). Empty for
  // categories that don't use them, in which case no grid is rendered at all. Tapping
  // one navigates to SubcategoryServicesScreen rather than filtering in place, so there's
  // no "selected chip" state to track here any more.
  const [apiSubcategories, setApiSubcategories] = useState<any[]>([]);

  // This screen's own copy of the active category's services (not the shared redux
  // array — that gets overwritten by whatever screen last fetched into it, e.g. Home
  // or SubcategoryServicesScreen). Backed by a session cache keyed by category+city, so
  // switching back to an already-visited category shows instantly instead of refetching.
  // null = "haven't resolved this category yet" (cache miss, fetch in flight).
  const [localServices, setLocalServices] = useState<any[] | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Keep the free service in sync with whether its offer's condition is currently met —
  // add it once the required items are in the cart, remove it the moment they're not.
  useEffect(() => {
    if (!freeServiceItem) return;
    const paidQty = Object.entries(quantities).filter(([id]) => id !== freeServiceItem.id);
    let conditionMet = false;
    if (offerType === 'specific_services') {
      conditionMet = offerRequiredIds.size > 0
        && Array.from(offerRequiredIds).every(id => (quantities[id] ?? 0) > 0);
    } else if (offerType === 'min_count') {
      const totalCount = paidQty.reduce((sum, [, qty]) => sum + qty, 0);
      conditionMet = totalCount >= Number(offer?.triggerValue?.count ?? 1);
    } else if (offerType === 'min_spend') {
      const totalAmount = paidQty.reduce((sum, [id, qty]) => sum + (addedServicesMap[id]?.price ?? 0) * qty, 0);
      conditionMet = totalAmount >= Number(offer?.triggerValue?.amount ?? 0);
    } else if (offerType === 'category') {
      const totalCount = paidQty.reduce((sum, [, qty]) => sum + qty, 0);
      conditionMet = totalCount >= Number(offer?.triggerValue?.count ?? 1);
    }

    const hasFree = !!quantities[freeServiceItem.id];
    if (conditionMet && !hasFree) {
      dispatch(addServicesToCart([freeServiceItem]));
    } else if (!conditionMet && hasFree) {
      dispatch(removeFreeService());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantities, addedServicesMap, freeServiceItem, offerType]);

  useEffect(() => {
    if (offerType === 'specific_services') {
      // Fetch all services so we can filter to the required subset
      dispatch(fetchServices({limit: 500, ...cityParam}));
    } else {
      dispatch(fetchCategories(cityParam));
    }
  }, [selectedCityId]);

  // Fetch services when categoryId is known (skip when offer loads all services).
  // cityId is what makes the backend honour each service's city mapping — without it
  // every city-specific service (e.g. a Vijayawada-only one) came back everywhere.
  //
  // Cache-first: a category already visited this session shows immediately with no
  // network round trip and no loading flicker — only a genuinely new category triggers
  // a fetch. Pull-to-refresh is the deliberate way to force a fresh copy.
  useEffect(() => {
    if (offerType === 'specific_services') return;
    if (!activeCategoryId) return;
    const cached = getCachedServices(activeCategoryId, selectedCityId);
    if (cached) {
      setLocalServices(cached);
      setLocalLoading(false);
      return;
    }
    let cancelled = false;
    setLocalServices(null);
    setLocalLoading(true);
    dispatch(fetchServices({categoryId: activeCategoryId, ...cityParam}))
      .then((action: any) => {
        if (cancelled) return;
        const data = Array.isArray(action?.payload) ? action.payload : [];
        setCachedServices(activeCategoryId, selectedCityId, data);
        setLocalServices(data);
      })
      .finally(() => { if (!cancelled) setLocalLoading(false); });
    return () => { cancelled = true; };
  }, [activeCategoryId, selectedCityId]);

  // Load the active category's subcategories. Failures fall back to an empty list,
  // which renders no row, so the screen behaves exactly as it did before subcategories.
  useEffect(() => {
    if (offerType === 'specific_services' || !activeCategoryId) {
      setApiSubcategories([]);
      return;
    }
    let cancelled = false;
    fetch(`${BASE_URL}${endpoints.SUBCATEGORIES}?categoryId=${activeCategoryId}`)
      .then(r => r.json())
      .then(j => { if (!cancelled) setApiSubcategories(Array.isArray(j?.data) ? j.data : []); })
      .catch(() => { if (!cancelled) setApiSubcategories([]); });
    return () => { cancelled = true; };
  }, [activeCategoryId]);

  // When categories load, resolve categoryId from name if not set; or set first category
  useEffect(() => {
    if (offerType === 'specific_services') return;
    if (rawCategories.length === 0) return;
    if (!activeCategoryId) {
      if (activeCategory) {
        const found = rawCategories.find(
          (c: any) => (c.name ?? c.label ?? c) === activeCategory,
        );
        if (found) {
          setActiveCategoryId(found.id ?? found._id ?? null);
        }
      } else {
        const first = rawCategories[0];
        setActiveCategory(first.name ?? first.label ?? first);
        setActiveCategoryId(first.id ?? first._id ?? null);
      }
    }
  }, [rawCategories]);

  const categories = rawCategories.map((c: any) => ({
    label: c.name ?? c.label ?? c,
    image: c.image ?? c.photo ?? c.thumbnail ?? '',
    id: c.id ?? c._id ?? null,
  }));

  // The offer flow still reads the shared redux fetch directly (it loads a fixed batch
  // once, not per category); ordinary category browsing reads this screen's own cache
  // instead, so it can't be clobbered by another screen fetching into the shared array.
  const effectiveRawServices = offerType === 'specific_services' ? rawServices : (localServices ?? []);
  const effectiveLoading = offerType === 'specific_services' ? loading : localLoading;

  const currentServices = effectiveRawServices.map(normalizeService);

  // Real subcategory rows win wherever the category has them. Where it has none, fall
  // back to the variant each service name carries ("Back Wax (Honey)"), which is the
  // only subcategory information the catalogue holds for that category. Both produce
  // the same {key, name} shape, so the chip row below doesn't care which it got.
  const subcategories = useMemo(() => {
    if (apiSubcategories.length > 0) {
      return apiSubcategories.map((sub: any) => ({
        key: String(sub.id),
        name: sub.name,
        subcategoryId: sub.id,
        image: sub.image ?? null,
      }));
    }
    // Off effectiveRawServices, not currentServices: the latter is a fresh array every
    // render, which would recompute this on each one. Only `name` is read either way.
    // Derived (name-variant) subcategories carry no image of their own — the card falls
    // back.
    return deriveVariants(effectiveRawServices).map(v => ({
      key: v.key,
      name: v.name,
      subcategoryId: null,
      image: null,
    }));
  }, [apiSubcategories, effectiveRawServices]);

  const displayServices = (() => {
    let list = [...currentServices];
    // Offer filter — only for specific_services: show required services only
    if (offerType === 'specific_services' && offerRequiredIds.size > 0) {
      list = list.filter(s => offerRequiredIds.has(String(s.id)));
    }
    // Exclude the free service from the regular list (we pin it at top separately)
    if (freeServiceItem) {
      list = list.filter(s => String(s.id) !== freeServiceItem.id);
    }
    // Standard filters
    if (filterDiscount) list = list.filter(s => s.discountPct > 0);
    if (filterDuration === 'short') list = list.filter(s => parseInt(String(s.duration)) < 30);
    else if (filterDuration === 'medium') list = list.filter(s => { const d = parseInt(String(s.duration)); return d >= 30 && d <= 60; });
    else if (filterDuration === 'long') list = list.filter(s => parseInt(String(s.duration)) > 60);
    // Sort
    if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'popular') list.sort((a, b) => (parseInt(String(b.bookedCount)) || 0) - (parseInt(String(a.bookedCount)) || 0));
    // Pin free service at the top
    if (freeServiceItem) list = [freeServiceItem, ...list];
    return list;
  })();

  const activeFilterCount = (filterDiscount ? 1 : 0) + (filterDuration !== 'all' ? 1 : 0);

  const handleCategoryChange = (cat: {label: string; id: any}) => {
    setActiveCategory(cat.label);
    setActiveCategoryId(cat.id);
  };

  // Pull-to-refresh — the deliberate way to force a fresh copy of this page's data,
  // now that switching categories/subcategories no longer does that automatically.
  // Re-fetches both this category's services and its subcategory list.
  const onRefresh = async () => {
    if (offerType === 'specific_services' || !activeCategoryId) return;
    setRefreshing(true);
    clearCachedServices(activeCategoryId, selectedCityId);
    try {
      const action: any = await dispatch(fetchServices({categoryId: activeCategoryId, ...cityParam}));
      const data = Array.isArray(action?.payload) ? action.payload : [];
      setCachedServices(activeCategoryId, selectedCityId, data);
      setLocalServices(data);
    } catch {}
    try {
      const res = await fetch(`${BASE_URL}${endpoints.SUBCATEGORIES}?categoryId=${activeCategoryId}`);
      const j = await res.json();
      setApiSubcategories(Array.isArray(j?.data) ? j.data : []);
    } catch {}
    setRefreshing(false);
  };

  const increment = (id: string) => {
    // Prefer the freshly fetched row over the cart's copy so fields the cart line may
    // be missing (originalPrice, discountPct — Home adds a leaner object) get filled
    // in; falls back to the cart for services from a category no longer loaded.
    const svc = currentServices.find((s: any) => String(s.id) === id) ?? addedServicesMap[id];
    if (!svc) return;
    // The reducer bumps an existing line's qty rather than duplicating it, and caps at
    // MAX_SERVICE_QTY, so a plain add is the whole increment.
    dispatch(addServicesToCart([{...svc, id: String(svc.id), qty: 1}]));
  };

  const decrement = (id: string) => {
    if (freeServiceItem && id === freeServiceItem.id) return; // free service is locked
    // Drops the line entirely once it reaches zero.
    dispatch(decrementServiceQty(id));
  };

  const addedCount = Object.entries(quantities).reduce((a, [id, qty]) =>
    (freeServiceItem && id === freeServiceItem.id) ? a : a + qty, 0);
  const totalSaved = Object.entries(quantities).reduce((acc, [id, qty]) => {
    const svc = addedServicesMap[id];
    // A line added from elsewhere (Home's popular row) carries no originalPrice —
    // treat it as no discount rather than letting NaN into the total.
    return svc ? acc + ((svc.originalPrice ?? svc.price) - svc.price) * qty : acc;
  }, 0);
  const cartTotal = Object.entries(quantities).reduce((acc, [id, qty]) => {
    const svc = addedServicesMap[id];
    return svc && !svc.isFree ? acc + svc.price * qty : acc;
  }, 0);

  const handleCheckout = () => {
    // Nothing to commit — every Add already went straight into the shared cart (the
    // same one packages/combos use), so a booking can mix individual services with
    // packages and this is just navigation.
    navigation?.navigate('AddressPayment', {
      // Explicitly clear these so a stale legacy single-flow visit to this screen
      // (services/packageId params from before) can't leak into cart mode.
      services: undefined, packageId: undefined, packagePrice: undefined, packageTitle: undefined,
      ...(offer ? {offerId: offer.id} : {}),
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCF8F3" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#171816" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{offer ? (offer.title ?? 'Offer Services') : (activeCategory || 'Services')}</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      {offer && (
        <LinearGradient colors={['#105641', '#022723']} style={styles.offerBanner} start={{x:0,y:0}} end={{x:1,y:0}}>
          <Text style={styles.offerBannerIcon}>🎁</Text>
          <View style={{flex: 1}}>
            <Text style={styles.offerBannerTitle} numberOfLines={1}>{offer.title}</Text>
            <Text style={styles.offerBannerSub} numberOfLines={1}>
              Get <Text style={{color: '#FDD77A', fontWeight: '700'}}>{offer.freeService?.name ?? 'a free service'}</Text> FREE with this booking
            </Text>
          </View>
        </LinearGradient>
      )}

      {categories.length > 0 && !offer && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}>
          {categories.map((cat: any) => {
            const active = cat.label === activeCategory;
            return (
              <TouchableOpacity
                key={cat.label}
                onPress={() => handleCategoryChange(cat)}
                activeOpacity={0.8}
                style={styles.categoryItem}>
                {active ? (
                  <LinearGradient
                    colors={['#0E5843', '#022723']}
                    style={styles.categoryActiveWrapper}>
                    {!!cat.image && (
                      <Image source={{uri: cat.image}} style={[styles.categoryThumb, styles.categoryThumbActive]} resizeMode="cover" />
                    )}
                    <Text style={[styles.categoryText, styles.categoryTextActive]} numberOfLines={2} adjustsFontSizeToFit>{cat.label}</Text>
                  </LinearGradient>
                ) : (
                  <>
                    {!!cat.image && (
                      <Image source={{uri: cat.image}} style={styles.categoryThumb} resizeMode="cover" />
                    )}
                    <Text style={styles.categoryText} numberOfLines={2} adjustsFontSizeToFit>{cat.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Subcategory grid (e.g. Waxing -> Honey / Rica) ──
          Only rendered when the active category actually has subcategories, so every
          other category's layout is unchanged. Sits above the Filter / Sort By row.
          Card layout (image on top, name below) follows the shared reference design;
          rating/price aren't part of subcategory data, so the card carries only what
          the API actually returns. Tapping a card opens a dedicated screen scoped to
          that subcategory instead of filtering this screen's own list in place. */}
      {subcategories.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.subcatScroll}
          contentContainerStyle={styles.subcatGrid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#105641']} tintColor="#105641" />
          }>
          {subcategories.map((sub: any) => (
            <TouchableOpacity
              key={sub.key}
              activeOpacity={0.85}
              onPress={() => navigation?.navigate('SubcategoryServices', {
                categoryId: activeCategoryId,
                categoryName: activeCategory,
                subcategoryId: sub.subcategoryId,
                subcategoryKey: sub.key,
                subcategoryName: sub.name,
              })}
              style={styles.subcatCard}>
              {sub.image ? (
                <Image source={{uri: sub.image}} style={styles.subcatCardImg} resizeMode="cover" />
              ) : (
                <View style={[styles.subcatCardImg, styles.subcatCardImgPlaceholder]}>
                  <Ionicons name="image-outline" size={sw(20)} color="#C5C5C5" />
                  <Text style={styles.subcatCardImgPlaceholderText}>No image found</Text>
                </View>
              )}
              <Text style={styles.subcatCardName} numberOfLines={1}>
                {sub.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Filter / Sort By / count + the service list itself only apply to a flat
          category (no subcategories). Once a category has subcategories, browsing its
          services happens exclusively via SubcategoryServicesScreen after tapping a
          card above — showing the same services again here would just duplicate them. */}
      {subcategories.length === 0 && (
        <>
          <View style={styles.filterRow}>
            <View style={styles.filterLeft}>
              <TouchableOpacity
                style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
                activeOpacity={0.7}
                onPress={() => setShowFilterSheet(true)}>
                <Ionicons name="options-outline" size={sw(16)} color={activeFilterCount > 0 ? '#105641' : '#292D32'} />
                <Text style={[styles.filterText, activeFilterCount > 0 && styles.filterTextActive]}>
                  Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBtn, sortBy !== 'default' && styles.filterBtnActive]}
                activeOpacity={0.7}
                onPress={() => setShowSortSheet(true)}>
                <Ionicons name="swap-vertical-outline" size={sw(16)} color={sortBy !== 'default' ? '#105641' : '#292D32'} />
                <Text style={[styles.filterText, sortBy !== 'default' && styles.filterTextActive]}>Sort by</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.resultCount}>
              {effectiveLoading ? '...' : `${displayServices.length} Results`}
            </Text>
          </View>

          {effectiveLoading && displayServices.length === 0 ? (
            <ActivityIndicator size="large" color="#105641" style={{marginTop: sw(40)}} />
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                {paddingBottom: addedCount > 0 ? sw(100) : sw(24)},
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#105641']} tintColor="#105641" />
              }>
              {displayServices.length === 0 ? (
                <Text style={{textAlign: 'center', color: '#A3A3A3', marginTop: sw(40), fontFamily: fonts.textFont, fontSize: sw(13)}}>
                  No services available in this category.
                </Text>
              ) : (
                displayServices.map((item: any) => (
                  <ServiceCard
                    key={item.id}
                    item={item}
                    qty={quantities[String(item.id)] ?? 0}
                    onIncrement={() => increment(String(item.id))}
                    onDecrement={() => decrement(String(item.id))}
                    onViewDetails={() => setDetailItem(item)}
                  />
                ))
              )}
            </ScrollView>
          )}
        </>
      )}

      {(addedCount > 0 || freeServiceItem) && (
        <View style={[styles.cartBar, {paddingBottom: insets.bottom + sw(8)}]}>
          <View>
            <Text style={styles.cartPrice}>₹{formatAmount(cartTotal)}</Text>
            <View style={styles.cartSubRow}>
              <Text style={styles.cartSubText}>
                {addedCount} item{addedCount !== 1 ? 's' : ''}{freeServiceItem ? ' + 1 FREE' : ''}
              </Text>
              {totalSaved > 0 && (
                <Text style={styles.cartSavedText}> · Saved ₹{formatAmount(totalSaved)}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.cartAddBtn} activeOpacity={0.85} onPress={handleCheckout}>
            <Text style={styles.cartAddText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Sort Sheet ── */}
      <Modal visible={showSortSheet} transparent animationType="slide" onRequestClose={() => setShowSortSheet(false)}>
        <View style={styles.sheetContainer}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowSortSheet(false)} />
          <View style={[styles.sheet, {paddingHorizontal: sw(16), paddingTop: sw(12), paddingBottom: insets.bottom + sw(20)}]}>
            <View style={styles.plainHandle} />
            <Text style={styles.optionSheetTitle}>Sort By</Text>
            {([
              {key: 'default',    label: 'Default',             icon: 'list-outline'},
              {key: 'popular',    label: 'Most Popular',         icon: 'trending-up-outline'},
              {key: 'price_asc',  label: 'Price: Low to High',   icon: 'arrow-up-outline'},
              {key: 'price_desc', label: 'Price: High to Low',   icon: 'arrow-down-outline'},
            ] as const).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.optionRow, sortBy === opt.key && styles.optionRowActive]}
                activeOpacity={0.7}
                onPress={() => { setSortBy(opt.key); setShowSortSheet(false); }}>
                <Ionicons name={opt.icon} size={sw(18)} color={sortBy === opt.key ? '#105641' : '#414141'} />
                <Text style={[styles.optionLabel, sortBy === opt.key && styles.optionLabelActive]}>{opt.label}</Text>
                {sortBy === opt.key && <Ionicons name="checkmark-circle" size={sw(20)} color="#105641" style={{marginLeft: 'auto'}} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── Filter Sheet ── */}
      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <View style={styles.sheetContainer}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowFilterSheet(false)} />
          <View style={[styles.sheet, {paddingHorizontal: sw(16), paddingTop: sw(12), paddingBottom: insets.bottom + sw(20)}]}>
            <View style={styles.plainHandle} />
            <View style={styles.optionSheetHeader}>
              <Text style={styles.optionSheetTitle}>Filter</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={() => { setFilterDiscount(false); setFilterDuration('all'); }}>
                  <Text style={styles.optionClearText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.optionSectionLabel}>Offers</Text>
            <TouchableOpacity
              style={[styles.optionRow, filterDiscount && styles.optionRowActive]}
              activeOpacity={0.7}
              onPress={() => setFilterDiscount(v => !v)}>
              <Ionicons name="pricetag-outline" size={sw(18)} color={filterDiscount ? '#105641' : '#414141'} />
              <Text style={[styles.optionLabel, filterDiscount && styles.optionLabelActive]}>Discounted only</Text>
              {filterDiscount && <Ionicons name="checkmark-circle" size={sw(20)} color="#105641" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>

            <Text style={[styles.optionSectionLabel, {marginTop: sw(16)}]}>Duration</Text>
            {([
              {key: 'all',    label: 'All durations'},
              {key: 'short',  label: 'Quick  (< 30 min)'},
              {key: 'medium', label: 'Medium  (30 – 60 min)'},
              {key: 'long',   label: 'Long  (> 60 min)'},
            ] as const).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.optionRow, filterDuration === opt.key && styles.optionRowActive]}
                activeOpacity={0.7}
                onPress={() => setFilterDuration(opt.key)}>
                <Ionicons name="time-outline" size={sw(18)} color={filterDuration === opt.key ? '#105641' : '#414141'} />
                <Text style={[styles.optionLabel, filterDuration === opt.key && styles.optionLabelActive]}>{opt.label}</Text>
                {filterDuration === opt.key && <Ionicons name="checkmark-circle" size={sw(20)} color="#105641" style={{marginLeft: 'auto'}} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.sheetAddBtn, {marginTop: sw(20)}]}
              activeOpacity={0.85}
              onPress={() => setShowFilterSheet(false)}>
              <Text style={styles.sheetAddBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Service Detail Bottom Sheet ── */}
      <Modal
        visible={!!detailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailItem(null)}>
        <View style={styles.sheetContainer}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setDetailItem(null)} />

          {detailItem && (
            <View style={[styles.sheet, {paddingBottom: insets.bottom + sw(16)}]}>

              {/* ── Hero image with gradient + close button ── */}
              <View style={styles.sheetHero}>
                {detailItem.image
                  ? <Image source={{uri: detailItem.image}} style={styles.sheetHeroImg} resizeMode="cover" />
                  : <View style={[styles.sheetHeroImg, {backgroundColor: '#E8F3EF'}]} />
                }
                {/* Dark fade at bottom of image */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.55)']}
                  style={styles.sheetHeroGradient}
                />
                {/* Price badge over image */}
                <View style={styles.sheetHeroPriceBadge}>
                  <Text style={styles.sheetHeroPrice}>{detailItem.priceStartsFrom ? 'Starts at ' : ''}₹{formatAmount(detailItem.price)}</Text>
                  {detailItem.originalPrice > detailItem.price && (
                    <Text style={styles.sheetHeroOriginal}>₹{formatAmount(detailItem.originalPrice)}</Text>
                  )}
                </View>
                {/* Close button */}
                <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setDetailItem(null)} activeOpacity={0.8}>
                  <Ionicons name="close" size={sw(18)} color="#171816" />
                </TouchableOpacity>
                {/* Handle */}
                <View style={styles.sheetHandle} />
              </View>

              {/* ── Scrollable body ── */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScrollContent}>

                {/* Name */}
                <Text style={styles.sheetName}>{detailItem.name}</Text>

                {/* Pills row */}
                <View style={styles.sheetPillsRow}>
                  {!!detailItem.duration && (
                    <View style={styles.sheetPill}>
                      <Ionicons name="time-outline" size={sw(13)} color="#105641" />
                      <Text style={styles.sheetPillText}>{detailItem.duration}</Text>
                    </View>
                  )}
                  {detailItem.discountPct > 0 && (
                    <View style={[styles.sheetPill, styles.sheetPillGreen]}>
                      <Ionicons name="pricetag-outline" size={sw(13)} color="#008F30" />
                      <Text style={[styles.sheetPillText, {color: '#008F30'}]}>{detailItem.discountPct}% OFF</Text>
                    </View>
                  )}
                  {!!detailItem.bookedCount && (
                    <View style={styles.sheetPill}>
                      <Ionicons name="people-outline" size={sw(13)} color="#0068F0" />
                      <Text style={[styles.sheetPillText, {color: '#0068F0'}]}>{detailItem.bookedCount}</Text>
                    </View>
                  )}
                </View>

                {/* Divider */}
                {!!detailItem.bullets && <View style={styles.sheetDivider} />}

                {/* What's included */}
                {!!detailItem.bullets && (
                  <>
                    <Text style={styles.sheetSectionLabel}>What's Included</Text>
                    {detailItem.bullets.split('\n').map((line: string, i: number) =>
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

              {/* ── Bottom CTA ── */}
              <View style={styles.sheetFooter}>
                {(quantities[String(detailItem.id)] ?? 0) === 0 ? (
                  <TouchableOpacity
                    style={styles.sheetAddBtn}
                    activeOpacity={0.85}
                    onPress={() => { increment(String(detailItem.id)); setDetailItem(null); }}>
                    <Text style={styles.sheetAddBtnText}>Add to Cart</Text>
                    <View style={styles.sheetAddBtnPriceBadge}>
                      <Text style={styles.sheetAddBtnPrice}>₹{formatAmount(detailItem.price)}</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.sheetStepperRow}>
                    <View style={styles.sheetStepper}>
                      <TouchableOpacity style={styles.sheetStepBtn} activeOpacity={0.7} onPress={() => decrement(String(detailItem.id))}>
                        <Ionicons name="remove" size={sw(18)} color="#105641" />
                      </TouchableOpacity>
                      <Text style={styles.sheetStepCount}>{quantities[String(detailItem.id)]}</Text>
                      <TouchableOpacity style={styles.sheetStepBtn} activeOpacity={0.7} onPress={() => increment(String(detailItem.id))} disabled={(quantities[String(detailItem.id)] ?? 0) >= MAX_SERVICE_QTY}>
                        <Ionicons name="add" size={sw(18)} color={(quantities[String(detailItem.id)] ?? 0) >= MAX_SERVICE_QTY ? '#B7CFC4' : '#105641'} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.sheetDoneBtn} activeOpacity={0.85} onPress={() => setDetailItem(null)}>
                      <Ionicons name="checkmark" size={sw(16)} color="#FFFFFF" />
                      <Text style={styles.sheetAddBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const ServiceCard = ({
  item,
  qty,
  onIncrement,
  onDecrement,
  onViewDetails,
}: {
  item: any;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onViewDetails: () => void;
}) => (
  <View style={styles.card}>
    <View style={styles.cardBody}>
      <View style={styles.cardLeft}>
        <View style={styles.cardTopInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          {!!item.duration && (
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={sw(14)} color="#8A6D1F" />
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          )}

          {!item.isFree && (
            <View style={styles.priceBlock}>
              {item.priceStartsFrom && <Text style={styles.startsAtLabel}>Starts at</Text>}
              <View style={styles.priceRow}>
                <Text style={styles.currentPrice}>₹{formatAmount(item.price)}</Text>
                {item.originalPrice > item.price && (
                  <Text style={styles.originalPrice}>₹{formatAmount(item.originalPrice)}</Text>
                )}
                {item.discountPct > 0 && (
                  <View style={styles.discountPill}>
                    <Text style={styles.discountPillText}>{item.discountPct}% OFF</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.cardMeta}>
          {!!item.bookedCount && (
            <Text style={styles.bookedCount}>{item.bookedCount}</Text>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onViewDetails}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            style={styles.viewDetailsBtn}>
            <Text style={styles.viewDetails}>View Details ›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardRight}>
        {!!item.image ? (
          <Image source={{uri: item.image}} style={styles.cardThumb} resizeMode="cover" />
        ) : (
          <View style={[styles.cardThumb, styles.cardThumbPlaceholder]}>
            <Ionicons name="image-outline" size={sw(22)} color="#C5C5C5" />
          </View>
        )}
        {item.isFree ? (
          <>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
            <View style={styles.freeLockedBtn}>
              <Ionicons name="checkmark-circle" size={sw(14)} color="#105641" />
              <Text style={styles.freeLockedText}>Added</Text>
            </View>
          </>
        ) : (
          <>
            {qty === 0 ? (
              <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={onIncrement}>
                <Text style={styles.addBtnText}>Add</Text>
                <Ionicons name="add" size={sw(14)} color="#105641" />
              </TouchableOpacity>
            ) : (
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7} onPress={onDecrement}>
                  <Ionicons name="remove" size={sw(14)} color="#105641" />
                </TouchableOpacity>
                <Text style={styles.stepCount}>{qty}</Text>
                <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7} onPress={onIncrement} disabled={qty >= MAX_SERVICE_QTY}>
                  <Ionicons name="add" size={sw(14)} color={qty >= MAX_SERVICE_QTY ? '#B7CFC4' : '#105641'} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FBEADB'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(12),
    backgroundColor: '#FBEADB',
  },
  titleBlock: {alignItems: 'center', gap: sw(8)},
  title: {fontFamily: fonts.primary, fontSize: sw(20), fontWeight: '400', color: '#171816', lineHeight: sw(23)},
  titleUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},

  categoryScroll: {flexGrow: 0, marginBottom: sw(12)},
  categoryContent: {paddingHorizontal: sw(16), gap: sw(14), alignItems: 'flex-start'},
  categoryItem: {alignItems: 'center', width: sw(70)},
  categoryActiveWrapper: {
    width: sw(70),
    minHeight: sw(84),
    borderRadius: sw(16),
    borderBottomLeftRadius: sw(8),
    borderBottomRightRadius: sw(8),
    alignItems: 'center',
    paddingBottom: sw(4),
    gap: sw(2),
  },
  categoryThumb: {width: sw(64), height: sw(64), borderRadius: sw(10)},
  categoryThumbActive: {borderWidth: 1, borderColor: '#105641'},
  categoryText: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    fontWeight: '600',
    color: '#414141',
    lineHeight: sw(13),
    textAlign: 'center',
    marginTop: sw(6),
  },
  categoryTextActive: {color: '#FEFEFE', marginTop: sw(2)},

  // Subcategory grid — image-forward cards above the Filter / Sort By controls,
  // matching the shared reference design (image on top, name below), 3 per row.
  // Deliberately lighter than the category strip above it so the hierarchy stays
  // readable. No fixed width/height here — `flex: 1` lets it take up whatever space
  // remains below the header/category strip, and its own ScrollView scrolls through
  // every subcategory the API returns, however many that is.
  subcatScroll: {flex: 1},
  subcatGrid: {
    paddingHorizontal: sw(16),
    paddingBottom: sw(24),
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: sw(12),
    columnGap: SUBCAT_GAP,
  },
  subcatCard: {
    width: SUBCAT_CARD_W,
    borderRadius: sw(14),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  subcatCardImg: {width: '100%', height: SUBCAT_CARD_W * 0.8, backgroundColor: '#F4E1CC'},
  subcatCardImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    gap: sw(4),
  },
  subcatCardImgPlaceholderText: {
    fontFamily: fonts.textFont,
    fontSize: sw(9),
    color: '#B5B5B5',
    textAlign: 'center',
    paddingHorizontal: sw(4),
  },
  subcatCardName: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    fontWeight: '600',
    color: '#292D32',
    textAlign: 'center',
    paddingVertical: sw(8),
    paddingHorizontal: sw(6),
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    marginBottom: sw(16),
  },
  filterLeft: {flexDirection: 'row', gap: sw(9)},
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8D2C4',
    borderRadius: sw(20),
    paddingHorizontal: sw(14),
    paddingVertical: sw(8),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  filterText: {fontFamily: 'Poppins-SemiBold', fontSize: sw(12), color: '#414141', lineHeight: sw(16), letterSpacing: 0.2},
  filterTextActive: {color: '#105641'},
  filterBtnActive: {borderColor: '#105641', backgroundColor: '#EAF5F0'},
  resultCount: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C', lineHeight: sw(18), letterSpacing: 0.2},

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: sw(16), gap: sw(20)},

  card: {
    borderRadius: sw(16),
    overflow: 'hidden',
    backgroundColor: '#FDF5F3',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageWrapper: {
    width: '100%',
    height: sw(164),
    borderTopLeftRadius: sw(16),
    borderTopRightRadius: sw(16),
    overflow: 'hidden',
  },
  cardImage: {width: '100%', height: '100%'},
  newLaunchBadge: {
    position: 'absolute',
    top: sw(14),
    left: 0,
    backgroundColor: '#008F30',
    borderTopRightRadius: sw(4),
    borderBottomRightRadius: sw(4),
    paddingHorizontal: sw(8),
    paddingVertical: sw(6),
  },
  newLaunchText: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '500', color: '#FFFFFF', lineHeight: sw(18)},
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    padding: sw(14),
    paddingBottom: sw(16),
    gap: sw(12),
  },
  cardLeft: {flex: 1, gap: sw(12)},
  cardTopInfo: {gap: sw(10)},
  serviceName: {fontFamily: 'Poppins-Medium', fontSize: sw(15), color: '#171816', lineHeight: sw(20)},
  durationRow: {flexDirection: 'row', alignItems: 'center', gap: sw(4)},
  durationText: {fontFamily: fonts.textFont, fontSize: sw(14), color: '#656565', lineHeight: sw(18)},
  cardMeta: {gap: sw(6)},
  bookedCount: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '500', color: '#0068F0', lineHeight: sw(12)},
  viewDetailsBtn: {
    paddingVertical: sw(4),
  },
  viewDetails: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    color: '#105641',
    lineHeight: sw(16),
    letterSpacing: 0.3,
  },

  cardRight: {alignItems: 'center', justifyContent: 'flex-start', gap: sw(8), width: sw(90)},
  cardThumb: {
    width: sw(90),
    height: sw(90),
    borderRadius: sw(12),
    backgroundColor: '#F4E1CC',
  },
  cardThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBlock: {alignItems: 'flex-start', gap: sw(6)},
  startsAtLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#8A8A8A'},
  priceRow: {flexDirection: 'row', alignItems: 'center', gap: sw(6), flexWrap: 'wrap'},
  currentPrice: {fontFamily: 'Poppins-SemiBold', fontSize: sw(15), color: '#012823', lineHeight: sw(20)},
  originalPrice: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '400', color: '#656565', lineHeight: sw(18), textDecorationLine: 'line-through'},
  discountRow: {flexDirection: 'row', alignItems: 'center', gap: sw(4)},
  discountText: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '600', color: '#008F30', lineHeight: sw(18)},
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(2),
    width: sw(90),
    height: sw(32),
    backgroundColor: 'rgba(16, 86, 65, 0.06)',
    borderWidth: 1,
    borderColor: '#105641',
    borderRadius: sw(20),
  },
  addBtnText: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    fontWeight: '600',
    color: '#105641',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: sw(35),
    borderWidth: 1,
    borderColor: '#105641',
    borderRadius: sw(20),
    overflow: 'hidden',
  },
  stepBtn: {
    width: sw(35),
    height: sw(35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#105641',
    minWidth: sw(22),
    textAlign: 'center',
  },

  freePriceBlock: {alignItems: 'center', gap: sw(3)},
  freeBadge: {backgroundColor: '#105641', borderRadius: sw(6), paddingHorizontal: sw(8), paddingVertical: sw(3)},
  freeBadgeText: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '800', color: '#FDD77A'},
  freeOriginalPrice: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#A3A3A3', textDecorationLine: 'line-through'},
  freeLockedBtn: {flexDirection: 'row', alignItems: 'center', gap: sw(4), borderWidth: 1, borderColor: '#105641', borderRadius: sw(6), paddingHorizontal: sw(8), paddingVertical: sw(5), marginTop: sw(6)},
  freeLockedText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#105641', fontWeight: '600'},

  offerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: sw(10),
    paddingHorizontal: sw(16), paddingVertical: sw(10),
  },
  offerBannerIcon: {fontSize: sw(20)},
  offerBannerTitle: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#FFFFFF'},
  offerBannerSub: {fontFamily: fonts.textFont, fontSize: sw(13), color: 'rgba(255,255,255,0.8)', marginTop: sw(2)},

  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#105641',
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cartPrice: {fontFamily: fonts.textFont, fontSize: sw(20), fontWeight: '700', color: '#012823'},
  cartSubRow: {flexDirection: 'row', alignItems: 'center', marginTop: sw(2)},
  cartSubText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#454545'},
  cartSavedText: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '600', color: '#008F30'},
  cartAddBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(6),
    paddingVertical: sw(8),
    paddingHorizontal: sw(32),
    alignItems: 'center',
    justifyContent: 'center',
    height: sw(35),
  },
  cartAddText: {fontFamily: fonts.textFont, fontSize: sw(16), fontWeight: '500', color: '#FFFFFF', lineHeight: sw(19)},

  /* ── Detail Bottom Sheet ── */
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
    alignSelf: 'center',
    position: 'absolute',
    top: sw(8),
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

  /* ── Sort / Filter option sheets ── */
  optionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sw(4),
  },
  optionSheetTitle: {
    fontFamily: fonts.title,
    fontSize: sw(17),
    fontWeight: '700',
    color: '#171816',
    marginBottom: sw(16),
  },
  optionClearText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#FF2F2F',
    fontWeight: '600',
    marginBottom: sw(16),
  },
  optionSectionLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#A3A3A3',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: sw(8),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
    paddingVertical: sw(13),
    paddingHorizontal: sw(12),
    borderRadius: sw(10),
    marginBottom: sw(4),
  },
  optionRowActive: {
    backgroundColor: '#EAF5F0',
  },
  optionLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#414141',
  },
  optionLabelActive: {
    color: '#105641',
    fontWeight: '600',
  },
  plainHandle: {
    width: sw(36),
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: sw(16),
  },
});

// Exported for reuse by SubcategoryServicesScreen, so its service list, cards, cart
// controls, filter/sort logic and styling stay in lockstep with this screen's.
export {normalizeService, ServiceCard, MAX_SERVICE_QTY, styles as serviceListingStyles};
export default ServiceListingScreen;
