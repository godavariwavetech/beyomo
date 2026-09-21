import React, {useEffect, useMemo, useState} from 'react';
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
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {fetchServices} from '../../redux/reducers/services';
import {addServicesToCart, decrementServiceQty} from '../../redux/reducers/cart';
import {formatAmount} from '../../utils/utils';
import {variantKeyOf} from '../../utils/serviceVariants';
import {getCachedServices, setCachedServices, clearCachedServices} from '../../utils/servicesCache';
import {
  normalizeService,
  ServiceCard,
  MAX_SERVICE_QTY,
  serviceListingStyles as styles,
} from './ServiceListingScreen';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

interface Props {
  navigation?: any;
  route?: any;
}

/**
 * Items belonging to a single subcategory (e.g. Waxing -> Honey), reached by tapping a
 * card in ServiceListingScreen's subcategory grid. Reuses that screen's cards, styling,
 * cart wiring, and filter/sort logic — only the list itself is scoped, to this
 * subcategory rather than the whole category.
 */
const SubcategoryServicesScreen = ({navigation, route}: Props) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();

  const categoryId = route?.params?.categoryId ?? null;
  // A real subcategory row matches on this id; a derived (name-variant) one has none,
  // and matches on the variant its own name ends with instead — same split
  // ServiceListingScreen used before this screen existed.
  const subcategoryId = route?.params?.subcategoryId ?? null;
  const subcategoryKey = route?.params?.subcategoryKey ?? null;
  const subcategoryName = route?.params?.subcategoryName ?? 'Services';

  const selectedCityId = useSelector((s: any) => s.City?.selectedCity?.id ?? null);
  const cityParam = selectedCityId ? {cityId: selectedCityId} : {};

  const cartServices = useSelector((st: any) => st.Cart?.services ?? []);

  const [detailItem, setDetailItem] = useState<any>(null);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'popular'>('default');
  const [filterDiscount, setFilterDiscount] = useState(false);
  const [filterDuration, setFilterDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');

  // This screen's own copy of the parent category's services, shared with
  // ServiceListingScreen's session cache (keyed by category+city) — so arriving here
  // from a category already browsed this session (or from a sibling subcategory of the
  // same category) shows instantly instead of re-fetching every time a card is tapped.
  const [localServices, setLocalServices] = useState<any[] | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!categoryId) return;
    const cached = getCachedServices(categoryId, selectedCityId);
    if (cached) {
      setLocalServices(cached);
      setLocalLoading(false);
      return;
    }
    let cancelled = false;
    setLocalServices(null);
    setLocalLoading(true);
    dispatch(fetchServices({categoryId, ...cityParam}))
      .then((action: any) => {
        if (cancelled) return;
        const data = Array.isArray(action?.payload) ? action.payload : [];
        setCachedServices(categoryId, selectedCityId, data);
        setLocalServices(data);
      })
      .finally(() => { if (!cancelled) setLocalLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, selectedCityId]);

  // Pull-to-refresh — forces a fresh fetch for the parent category, bypassing the cache.
  const onRefresh = async () => {
    if (!categoryId) return;
    setRefreshing(true);
    clearCachedServices(categoryId, selectedCityId);
    try {
      const action: any = await dispatch(fetchServices({categoryId, ...cityParam}));
      const data = Array.isArray(action?.payload) ? action.payload : [];
      setCachedServices(categoryId, selectedCityId, data);
      setLocalServices(data);
    } catch {}
    setRefreshing(false);
  };

  const quantities: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const svc of cartServices) map[String(svc.id)] = svc.qty;
    return map;
  }, [cartServices]);

  const addedServicesMap: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    for (const svc of cartServices) map[String(svc.id)] = svc;
    return map;
  }, [cartServices]);

  const currentServices = (localServices ?? []).map(normalizeService);

  const subcategoryServices = useMemo(() => currentServices.filter((s: any) =>
    subcategoryId != null
      ? Number(s.subcategoryId) === Number(subcategoryId)
      : variantKeyOf(s.name) === subcategoryKey,
  ), [currentServices, subcategoryId, subcategoryKey]);

  // Same filter/sort behaviour as ServiceListingScreen's own list — scoped down to
  // just this subcategory's services, and owned entirely by this screen.
  const displayServices = (() => {
    let list = [...subcategoryServices];
    if (filterDiscount) list = list.filter(s => s.discountPct > 0);
    if (filterDuration === 'short') list = list.filter(s => parseInt(String(s.duration)) < 30);
    else if (filterDuration === 'medium') list = list.filter(s => { const d = parseInt(String(s.duration)); return d >= 30 && d <= 60; });
    else if (filterDuration === 'long') list = list.filter(s => parseInt(String(s.duration)) > 60);
    if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'popular') list.sort((a, b) => (parseInt(String(b.bookedCount)) || 0) - (parseInt(String(a.bookedCount)) || 0));
    return list;
  })();

  const activeFilterCount = (filterDiscount ? 1 : 0) + (filterDuration !== 'all' ? 1 : 0);

  const increment = (id: string) => {
    const svc = currentServices.find((s: any) => String(s.id) === id) ?? addedServicesMap[id];
    if (!svc) return;
    dispatch(addServicesToCart([{...svc, id: String(svc.id), qty: 1}]));
  };

  const decrement = (id: string) => {
    dispatch(decrementServiceQty(id));
  };

  const addedCount = Object.values(quantities).reduce((a: number, qty: number) => a + qty, 0);
  const totalSaved = Object.entries(quantities).reduce((acc, [id, qty]) => {
    const svc = addedServicesMap[id];
    return svc ? acc + ((svc.originalPrice ?? svc.price) - svc.price) * qty : acc;
  }, 0);
  const cartTotal = Object.entries(quantities).reduce((acc, [id, qty]) => {
    const svc = addedServicesMap[id];
    return svc && !svc.isFree ? acc + svc.price * qty : acc;
  }, 0);

  const handleCheckout = () => {
    navigation?.navigate('AddressPayment', {
      services: undefined, packageId: undefined, packagePrice: undefined, packageTitle: undefined,
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
          <Text style={styles.title}>{subcategoryName}</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      {/* Filter / Sort By / item count — scoped to this subcategory's list only */}
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
          {localLoading ? '...' : `${displayServices.length} Results`}
        </Text>
      </View>

      {localLoading && displayServices.length === 0 ? (
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
              No services available in this subcategory.
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

      {addedCount > 0 && (
        <View style={[styles.cartBar, {paddingBottom: insets.bottom + sw(8)}]}>
          <View>
            <Text style={styles.cartPrice}>₹{formatAmount(cartTotal)}</Text>
            <View style={styles.cartSubRow}>
              <Text style={styles.cartSubText}>
                {addedCount} item{addedCount !== 1 ? 's' : ''}
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

              <View style={styles.sheetHero}>
                {detailItem.image
                  ? <Image source={{uri: detailItem.image}} style={styles.sheetHeroImg} resizeMode="cover" />
                  : <View style={[styles.sheetHeroImg, {backgroundColor: '#E8F3EF'}]} />
                }
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.55)']}
                  style={styles.sheetHeroGradient}
                />
                <View style={styles.sheetHeroPriceBadge}>
                  <Text style={styles.sheetHeroPrice}>{detailItem.priceStartsFrom ? 'Starts at ' : ''}₹{formatAmount(detailItem.price)}</Text>
                  {detailItem.originalPrice > detailItem.price && (
                    <Text style={styles.sheetHeroOriginal}>₹{formatAmount(detailItem.originalPrice)}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setDetailItem(null)} activeOpacity={0.8}>
                  <Ionicons name="close" size={sw(18)} color="#171816" />
                </TouchableOpacity>
                <View style={styles.sheetHandle} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScrollContent}>

                <Text style={styles.sheetName}>{detailItem.name}</Text>

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

                {!!detailItem.bullets && <View style={styles.sheetDivider} />}

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

export default SubcategoryServicesScreen;
