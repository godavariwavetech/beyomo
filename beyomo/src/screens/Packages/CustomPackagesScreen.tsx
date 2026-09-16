import React, {useEffect, useRef, useState} from 'react';
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
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector, useDispatch} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import {addPackageToCart} from '../../redux/reducers/cart';
import CartBar from '../../components/CartBar/CartBar';
import type {RootState} from '../../redux/store';
import {formatAmount} from '../../utils/utils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

interface Props {
  navigation: any;
}

// Groups packages by their category scope so packages sharing a category (or no
// category — "any service") only cost a single services request between them,
// instead of firing one request per package.
const categoryKey = (pkg: any): string => pkg.categoryId ? String(pkg.categoryId) : 'all';

const CustomPackagesScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const selectedCity = useSelector((state: RootState) => state.City?.selectedCity);
  // Appended to service requests so the picker only offers services available in the
  // user's city (the backend applies each service's city mapping off this). Named
  // distinctly from the `?cityId=` prefix built inside the effect below, which would
  // otherwise shadow this and yield a malformed "?limit=50?cityId=..." URL.
  const citySuffix = selectedCity?.id ? `&cityId=${selectedCity.id}` : '';

  const [packages, setPackages] = useState<any[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<number, Set<number>>>({});

  const scrollRef = useRef<ScrollView>(null);
  const cardOffsets = useRef<Record<number, number>>({}).current;

  const scrollToPackage = (pkgId: number) => {
    const y = cardOffsets[pkgId];
    if (y != null) scrollRef.current?.scrollTo({y: Math.max(y - sw(12), 0), animated: true});
  };

  useEffect(() => {
    setLoading(true);
    const cityParam = selectedCity?.id ? `?cityId=${selectedCity.id}` : '';
    api.get(`${endpoints.PACKAGES}${cityParam}`).then(async res => {
      if (!res.data?.status) { setLoading(false); return; }
      const flexible = (res.data.data ?? [])
        .filter((p: any) => p.packageType === 'flexible')
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setPackages(flexible);

      // Only packages the admin left with an empty "Eligible Services" list need a
      // catalog fetch — everything else uses its own curated, ordered list directly
      // (see getPackageServices below), matching what the admin actually configured.
      const needsCatalog = flexible.filter((pkg: any) => !pkg.services || pkg.services.length === 0);
      const uniqueKeys: string[] = [];
      needsCatalog.forEach((pkg: any) => {
        const key = categoryKey(pkg);
        if (!uniqueKeys.includes(key)) uniqueKeys.push(key);
      });
      const results = await Promise.all(
        uniqueKeys.map(key => {
          // citySuffix keeps this picker to services actually offered in the user's
          // city — without it a city-specific service could be added to the cart.
          const url = key === 'all'
            ? `${endpoints.SERVICES}?limit=50${citySuffix}`
            : `${endpoints.SERVICES}?categoryId=${key}&limit=50${citySuffix}`;
          return api.get(url).then(r => (r.data?.status ? r.data.data ?? [] : [])).catch(() => []);
        }),
      );
      const map: Record<string, any[]> = {};
      uniqueKeys.forEach((key, i) => { map[key] = results[i]; });
      setServicesByCategory(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedCity?.id]);

  // Admin's curated "Eligible Services" list (in the order the admin set), when one
  // was configured; an empty list is the admin's explicit "entire catalog" choice.
  const getPackageServices = (pkg: any): any[] => {
    if (pkg.services && pkg.services.length > 0) {
      return pkg.services.map((s: any) => ({
        id: s.serviceId,
        name: s.name,
        basePrice: s.price,
        duration: s.duration,
        image: s.image,
      }));
    }
    return servicesByCategory[categoryKey(pkg)] ?? [];
  };

  const toggleService = (pkgId: number, serviceId: number, requiredCount: number) => {
    setSelections(prev => {
      const current = new Set(prev[pkgId] ?? []);
      if (current.has(serviceId)) {
        current.delete(serviceId);
      } else {
        if (current.size >= requiredCount) return prev;
        current.add(serviceId);
      }
      return {...prev, [pkgId]: current};
    });
  };

  const handleAdd = (pkg: any) => {
    const selectedIds = selections[pkg.id] ?? new Set<number>();
    if (selectedIds.size < pkg.serviceCount) {
      Alert.alert('Select services', `Please select ${pkg.serviceCount} services to continue.`);
      return;
    }
    const selectedServices = getPackageServices(pkg)
      .filter((s: any) => selectedIds.has(s.id))
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        price: s.basePrice,
        duration: s.duration,
        image: s.image,
      }));
    dispatch(addPackageToCart({
      packageId: pkg.id,
      packageTitle: pkg.title,
      packagePrice: pkg.price,
      packageOriginalPrice: pkg.originalPrice ?? pkg.price,
      packageType: 'flexible',
      services: selectedServices,
    }));
    // Reset this package's checklist so it doesn't stay stuck on "ready to add".
    setSelections(prev => ({...prev, [pkg.id]: new Set<number>()}));
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCF8F3" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#171816" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Choose Your Custom Package</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#105641" style={{marginTop: sw(40)}} />
      ) : (
        <>
          {packages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickScroll}
              contentContainerStyle={styles.quickScrollContent}>
              {packages.map((pkg: any) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.quickCard}
                  activeOpacity={0.85}
                  onPress={() => scrollToPackage(pkg.id)}>
                  <Text style={styles.quickCardTitle} numberOfLines={2}>{pkg.title}</Text>
                  <Text style={styles.quickCardPrice}>₹{formatAmount(pkg.price)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
          {packages.length === 0 ? (
            <Text style={styles.emptyText}>No custom packages available right now.</Text>
          ) : (
            packages.map((pkg: any) => {
              const selected = selections[pkg.id] ?? new Set<number>();
              const services = getPackageServices(pkg);
              const discountPct = pkg.originalPrice && pkg.originalPrice > pkg.price
                ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
                : 0;
              const ready = selected.size === pkg.serviceCount;
              return (
                <View
                  key={pkg.id}
                  style={styles.card}
                  onLayout={e => { cardOffsets[pkg.id] = e.nativeEvent.layout.y; }}>
                  <View style={styles.cardHeader}>
                    <View style={{flex: 1}}>
                      <Text style={styles.cardTitle}>{pkg.title}</Text>
                      <Text style={styles.cardSub}>
                        Pick any {pkg.serviceCount} service{pkg.serviceCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addBtn, ready && styles.addBtnReady]}
                      activeOpacity={0.8}
                      onPress={() => handleAdd(pkg)}>
                      <Text style={[styles.addBtnText, ready && styles.addBtnTextReady]}>
                        {ready ? 'ADD +' : `${selected.size}/${pkg.serviceCount}`}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {pkg.image ? (
                    <Image source={{uri: pkg.image}} style={styles.cardImage} resizeMode="cover" />
                  ) : null}

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{formatAmount(pkg.price)}</Text>
                    {pkg.originalPrice > pkg.price && (
                      <Text style={styles.originalPrice}>₹{formatAmount(pkg.originalPrice)}</Text>
                    )}
                    {discountPct > 0 && (
                      <Text style={styles.discount}>{discountPct}% OFF</Text>
                    )}
                  </View>

                  <View style={styles.checklist}>
                    {services.length === 0 ? (
                      <ActivityIndicator size="small" color="#105641" style={{marginTop: sw(8)}} />
                    ) : (
                      services.map((svc: any) => {
                        const checked = selected.has(svc.id);
                        return (
                          <TouchableOpacity
                            key={svc.id}
                            style={styles.checkRow}
                            activeOpacity={0.7}
                            onPress={() => toggleService(pkg.id, svc.id, pkg.serviceCount)}>
                            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                              {checked && <Ionicons name="checkmark" size={sw(14)} color="#FFFFFF" />}
                            </View>
                            <Text style={styles.checkLabel}>{svc.name}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>
              );
            })
          )}
          </ScrollView>
        </>
      )}
      <CartBar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FCF8F3'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(12),
    backgroundColor: '#FCF8F3',
  },
  titleBlock: {alignItems: 'center', gap: sw(8)},
  title: {fontFamily: fonts.primary, fontSize: sw(18), fontWeight: '400', color: '#171816', lineHeight: sw(21), textAlign: 'center'},
  titleUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},

  /* ── Quick-jump horizontal strip — pinned above the full vertical list ── */
  quickScroll: {flexGrow: 0, marginBottom: sw(14)},
  quickScrollContent: {paddingHorizontal: sw(16), gap: sw(10)},
  quickCard: {
    width: sw(130),
    backgroundColor: '#FEFEFE',
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: sw(10),
    gap: sw(6),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickCardTitle: {fontFamily: fonts.title, fontSize: sw(12), fontWeight: '700', color: '#171816', lineHeight: sw(15)},
  quickCardPrice: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '800', color: '#105641'},

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
    backgroundColor: '#FEFEFE',
    borderRadius: sw(16),
    padding: sw(14),
    gap: sw(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(10),
  },
  cardTitle: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#171816'},
  cardSub: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565', marginTop: sw(3)},
  cardImage: {
    width: '100%',
    height: sw(120),
    borderRadius: sw(10),
  },
  addBtn: {
    minWidth: sw(64),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(12),
    height: sw(32),
    borderRadius: sw(8),
    borderWidth: 1,
    borderColor: '#105641',
    backgroundColor: 'rgba(16, 86, 65, 0.05)',
  },
  addBtnReady: {backgroundColor: '#105641'},
  addBtnText: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '700', color: '#105641'},
  addBtnTextReady: {color: '#FFFFFF'},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
  },
  price: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '800', color: '#171816'},
  originalPrice: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#A3A3A3',
    textDecorationLine: 'line-through',
  },
  discount: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '600', color: '#008F30'},
  checklist: {gap: sw(4)},
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    paddingVertical: sw(7),
  },
  checkbox: {
    width: sw(20),
    height: sw(20),
    borderRadius: sw(5),
    borderWidth: 1.5,
    borderColor: '#C5C5C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {backgroundColor: '#105641', borderColor: '#105641'},
  checkLabel: {flex: 1, fontFamily: fonts.textFont, fontSize: sw(14), color: '#414141'},
});

export default CustomPackagesScreen;
