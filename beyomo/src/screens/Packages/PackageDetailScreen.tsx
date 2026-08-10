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
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import {addPackageToCart} from '../../redux/reducers/cart';
import CartBar from '../../components/CartBar/CartBar';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

interface ServiceItem {
  serviceId: number;
  name: string;
  price: number;
  duration?: number;
  image?: string;
}

interface Package {
  id: number;
  title: string;
  description?: string;
  image?: string;
  packageType: 'fixed' | 'flexible';
  price: number;
  originalPrice?: number;
  serviceCount?: number;
  categoryId?: number;
  services?: ServiceItem[];
}

interface PickableService {
  id: number;
  name: string;
  basePrice: number;
  duration?: number;
  image?: string;
  categoryId?: number;
}

const PackageDetailScreen = ({navigation, route}: {navigation: any; route: any}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const pkg: Package = route?.params?.package;

  const [fullPkg, setFullPkg] = useState<Package | null>(pkg ?? null);
  const [loading, setLoading] = useState(!pkg);
  const [allServices, setAllServices] = useState<PickableService[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [packageQty, setPackageQty] = useState(1);

  useEffect(() => {
    if (!fullPkg && route?.params?.packageId) {
      api
        .get(`${endpoints.PACKAGES}/${route.params.packageId}`)
        .then(res => {
          if (res.data?.status) setFullPkg(res.data.data);
        })
        .catch(() => Alert.alert('Error', 'Could not load package.'))
        .finally(() => setLoading(false));
    }
  }, []);

  // For flexible packages, the pickable services come from the admin's curated
  // "Eligible Services" list (in the order the admin set) when one was configured.
  // An empty list is the admin's explicit "entire catalog" choice, so fall back
  // to fetching the (optionally category-restricted) catalog in that case.
  useEffect(() => {
    if (fullPkg?.packageType !== 'flexible') return;
    if (fullPkg.services && fullPkg.services.length > 0) {
      setAllServices(fullPkg.services.map(s => ({
        id: s.serviceId,
        name: s.name,
        basePrice: s.price,
        duration: s.duration,
        image: s.image,
      })));
      return;
    }
    const url = fullPkg.categoryId
      ? `${endpoints.SERVICES}?categoryId=${fullPkg.categoryId}&limit=50`
      : `${endpoints.SERVICES}?limit=50`;
    api
      .get(url)
      .then(res => {
        if (res.data?.status) setAllServices(res.data.data ?? []);
      })
      .catch(() => {});
  }, [fullPkg]);

  if (loading || !fullPkg) {
    return (
      <View style={[styles.root, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#105641" />
      </View>
    );
  }

  const savings =
    fullPkg.originalPrice && fullPkg.originalPrice > fullPkg.price
      ? Math.round(fullPkg.originalPrice - fullPkg.price)
      : null;

  const requiredCount = fullPkg.packageType === 'flexible' ? (fullPkg.serviceCount ?? 1) : 0;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= requiredCount) {
          Alert.alert('Limit reached', `You can pick only ${requiredCount} service${requiredCount > 1 ? 's' : ''} for this package.`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleBook = () => {
    let packageServices: any[];

    if (fullPkg.packageType === 'fixed') {
      if (!fullPkg.services || fullPkg.services.length === 0) {
        Alert.alert('No services', 'This package has no services configured.');
        return;
      }
      packageServices = (fullPkg.services ?? []).map(s => ({
        id: s.serviceId,
        name: s.name,
        price: s.price,
        duration: s.duration,
        image: s.image,
      }));
    } else {
      if (selectedIds.size < requiredCount) {
        Alert.alert('Select services', `Please select ${requiredCount} service${requiredCount > 1 ? 's' : ''} to continue.`);
        return;
      }
      packageServices = allServices
        .filter(s => selectedIds.has(s.id))
        .map(s => ({
          id: s.id,
          name: s.name,
          price: s.basePrice,
          duration: s.duration,
          image: s.image,
        }));
    }

    dispatch(addPackageToCart({
      packageId: fullPkg.id,
      packageTitle: fullPkg.title,
      packagePrice: fullPkg.price,
      packageOriginalPrice: fullPkg.originalPrice ?? fullPkg.price,
      packageType: fullPkg.packageType,
      qty: packageQty,
      services: packageServices,
    }));
    // Explicitly clear these so a stale legacy single-flow visit to this screen
    // (services/packageId params from before) can't leak into cart mode.
    navigation.navigate('AddressPayment', {
      services: undefined, packageId: undefined, packagePrice: undefined, packageTitle: undefined, offerId: undefined,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header image / gradient — combos (fixed) show a solid brand background instead of a photo */}
      <View style={[styles.heroContainer, {paddingTop: insets.top}]}>
        {fullPkg.packageType === 'fixed' ? (
          <View style={[StyleSheet.absoluteFillObject, styles.comboHeroBg]} />
        ) : fullPkg.image ? (
          <Image source={{uri: fullPkg.image}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <Image source={{uri: FALLBACK_IMAGE}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        )}
        <LinearGradient
          colors={['rgba(1,40,35,0.3)', 'rgba(1,40,35,0.85)']}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.heroContent}>
          {savings ? (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save ₹{savings}</Text>
            </View>
          ) : null}
          <Text style={styles.heroTitle}>{fullPkg.title}</Text>
          {fullPkg.description ? (
            <Text style={styles.heroDesc}>{fullPkg.description}</Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.packagePrice}>₹{Math.round(fullPkg.price)}</Text>
            {fullPkg.originalPrice && fullPkg.originalPrice > fullPkg.price ? (
              <Text style={styles.originalPrice}>₹{Math.round(fullPkg.originalPrice)}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: sw(100)}]}
        showsVerticalScrollIndicator={false}>

        {/* ── Fixed package: list included services ── */}
        {fullPkg.packageType === 'fixed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Included Services</Text>
            <View style={styles.titleUnderline} />
            {(fullPkg.services ?? []).map((svc, i) => (
              <View key={i} style={styles.serviceRow}>
                <Image
                  source={{uri: svc.image ?? FALLBACK_IMAGE}}
                  style={styles.serviceImg}
                  resizeMode="cover"
                />
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  {svc.duration ? (
                    <Text style={styles.serviceMeta}>{svc.duration} min</Text>
                  ) : null}
                </View>
                <View style={styles.includedBadge}>
                  <Ionicons name="checkmark-circle" size={sw(20)} color="#105641" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Flexible package: service picker ── */}
        {fullPkg.packageType === 'flexible' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pick {requiredCount} Service{requiredCount > 1 ? 's' : ''}
            </Text>
            <View style={styles.titleUnderline} />
            <Text style={styles.pickerHint}>
              {selectedIds.size}/{requiredCount} selected
            </Text>
            {allServices.length === 0 ? (
              <ActivityIndicator size="small" color="#105641" style={{marginTop: sw(20)}} />
            ) : (
              allServices.map(svc => {
                const selected = selectedIds.has(svc.id);
                return (
                  <TouchableOpacity
                    key={svc.id}
                    style={[styles.serviceRow, selected && styles.serviceRowSelected]}
                    activeOpacity={0.8}
                    onPress={() => toggleSelect(svc.id)}>
                    <Image
                      source={{uri: svc.image ?? FALLBACK_IMAGE}}
                      style={styles.serviceImg}
                      resizeMode="cover"
                    />
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{svc.name}</Text>
                      <Text style={styles.serviceMeta}>
                        {svc.duration ? `${svc.duration} min · ` : ''}Starts at ₹{Math.round(svc.basePrice)}
                      </Text>
                    </View>
                    <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
                      {selected ? (
                        <Ionicons name="checkmark" size={sw(14)} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Selected services tray (flexible only, when ≥1 selected) ── */}
      {fullPkg.packageType === 'flexible' && selectedIds.size > 0 && (
        <View style={styles.selectedTray}>
          <View style={styles.selectedTrayHeader}>
            <Ionicons name="checkmark-circle" size={sw(15)} color="#105641" />
            <Text style={styles.selectedTrayTitle}>
              Selected ({selectedIds.size}/{requiredCount})
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedChipRow}>
            {allServices
              .filter(s => selectedIds.has(s.id))
              .map(s => (
                <View key={s.id} style={styles.selectedChip}>
                  <Text style={styles.selectedChipText} numberOfLines={1}>{s.name}</Text>
                  <TouchableOpacity
                    hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
                    onPress={() => toggleSelect(s.id)}>
                    <Ionicons name="close-circle" size={sw(15)} color="#FF2F2F" />
                  </TouchableOpacity>
                </View>
              ))}
          </ScrollView>
        </View>
      )}

      {/* ── Quantity stepper — how many copies of this package/combo ── */}
      <View style={styles.qtyBar}>
        <Text style={styles.qtyLabel}>Quantity</Text>
        <View style={styles.qtyStepper}>
          <TouchableOpacity
            style={styles.qtyStepBtn}
            activeOpacity={0.7}
            onPress={() => setPackageQty(q => Math.max(1, q - 1))}>
            <Ionicons name="remove" size={sw(16)} color="#105641" />
          </TouchableOpacity>
          <Text style={styles.qtyCount}>{packageQty}</Text>
          <TouchableOpacity
            style={styles.qtyStepBtn}
            activeOpacity={0.7}
            onPress={() => setPackageQty(q => q + 1)}>
            <Ionicons name="add" size={sw(16)} color="#105641" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sticky Book Now button ── */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + sw(12)}]}>
        <View style={styles.footerPriceSummary}>
          <Text style={styles.footerLabel}>Package Total</Text>
          <Text style={styles.footerPrice}>₹{Math.round(fullPkg.price * packageQty)}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.88} onPress={handleBook} style={styles.bookBtn}>
          <LinearGradient colors={['#105641', '#012823']} style={styles.bookBtnGradient}>
            <Text style={styles.bookBtnText}>
              {fullPkg.packageType === 'flexible' && selectedIds.size < requiredCount
                ? `Pick ${requiredCount - selectedIds.size} more`
                : 'Add to Cart'}
            </Text>
            <Ionicons name="cart-outline" size={sw(16)} color="#FDD77A" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <CartBar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FCF8F3'},

  heroContainer: {
    height: sw(260),
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  comboHeroBg: {
    backgroundColor: '#0E5843',
  },
  heroContent: {
    padding: sw(20),
    gap: sw(6),
  },
  backBtn: {
    position: 'absolute',
    top: sw(50),
    left: sw(16),
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDD77A',
    borderRadius: sw(8),
    paddingHorizontal: sw(10),
    paddingVertical: sw(3),
  },
  savingsText: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#012823',
  },
  heroTitle: {
    fontFamily: fonts.primary,
    fontSize: sw(24),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: sw(28),
  },
  heroDesc: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.75)',
    lineHeight: sw(16),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    marginTop: sw(4),
  },
  packagePrice: {
    fontFamily: fonts.title,
    fontSize: sw(28),
    fontWeight: '800',
    color: '#FDD77A',
  },
  originalPrice: {
    fontFamily: fonts.textFont,
    fontSize: sw(16),
    color: 'rgba(255,255,255,0.55)',
    textDecorationLine: 'line-through',
  },

  scroll: {flex: 1},
  scrollContent: {paddingTop: sw(20)},

  section: {
    paddingHorizontal: sw(16),
    marginBottom: sw(16),
  },
  sectionTitle: {
    fontFamily: fonts.primary,
    fontSize: sw(18),
    fontWeight: '400',
    color: '#171816',
  },
  titleUnderline: {
    width: sw(29),
    height: 2,
    backgroundColor: '#C8A84C',
    marginTop: sw(4),
    marginBottom: sw(16),
  },
  pickerHint: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#105641',
    fontWeight: '600',
    marginBottom: sw(12),
  },

  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(12),
    marginBottom: sw(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  serviceRowSelected: {
    borderWidth: 1.5,
    borderColor: '#105641',
    backgroundColor: '#F0FAF5',
  },
  serviceImg: {
    width: sw(52),
    height: sw(52),
    borderRadius: sw(8),
  },
  serviceInfo: {flex: 1, gap: sw(3)},
  serviceName: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#171816',
  },
  serviceMeta: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#888',
  },
  includedBadge: {
    width: sw(28),
    alignItems: 'center',
  },
  checkCircle: {
    width: sw(24),
    height: sw(24),
    borderRadius: sw(12),
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#105641',
    borderColor: '#105641',
  },

  selectedTray: {
    backgroundColor: '#F0FAF5',
    borderTopWidth: 1,
    borderTopColor: '#D0EDE0',
    paddingVertical: sw(10),
    paddingHorizontal: sw(16),
    gap: sw(8),
  },
  selectedTrayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
  },
  selectedTrayTitle: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    fontWeight: '700',
    color: '#105641',
  },
  selectedChipRow: {
    gap: sw(8),
    paddingRight: sw(4),
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#105641',
    borderRadius: sw(20),
    paddingHorizontal: sw(10),
    paddingVertical: sw(5),
    maxWidth: sw(160),
  },
  selectedChipText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#105641',
    flexShrink: 1,
  },

  qtyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  qtyLabel: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#171816',
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(14),
    borderWidth: 1,
    borderColor: '#E0DCD4',
    borderRadius: sw(20),
    paddingHorizontal: sw(6),
    paddingVertical: sw(4),
  },
  qtyStepBtn: {
    width: sw(26),
    height: sw(26),
    borderRadius: sw(13),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,86,65,0.08)',
  },
  qtyCount: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#171816',
    minWidth: sw(18),
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    backgroundColor: '#FFFFFF',
    gap: sw(12),
  },
  footerPriceSummary: {flex: 1},
  footerLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#888',
  },
  footerPrice: {
    fontFamily: fonts.title,
    fontSize: sw(22),
    fontWeight: '800',
    color: '#012823',
  },
  bookBtn: {
    flex: 1,
    borderRadius: sw(12),
    overflow: 'hidden',
  },
  bookBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
    paddingVertical: sw(14),
  },
  bookBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#FDD77A',
  },
});

export default PackageDetailScreen;
