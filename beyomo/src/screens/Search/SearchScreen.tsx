import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import type {RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

const EMPTY_RESULTS = {categories: [], services: [], packages: [], offers: []};

const SearchScreen = ({navigation}: {navigation: any}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedCity = useSelector((state: RootState) => state.City?.selectedCity);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Auto-focus the input as soon as the screen mounts, so tapping the search
  // icon on Home drops the user straight into typing.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      setSearched(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const cityParam = selectedCity?.id ? `&cityId=${selectedCity.id}` : '';
      api
        .get(`${endpoints.SEARCH}?q=${encodeURIComponent(q)}${cityParam}`)
        .then(res => {
          if (res.data?.status) setResults(res.data.data ?? EMPTY_RESULTS);
        })
        .catch(() => setResults(EMPTY_RESULTS))
        .finally(() => {
          setLoading(false);
          setSearched(true);
        });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedCity?.id]);

  const goToCategory = (cat: any) => {
    Keyboard.dismiss();
    navigation.navigate('ServiceListing', {categoryId: cat.id, category: cat.name});
  };

  const goToService = (svc: any) => {
    Keyboard.dismiss();
    navigation.navigate('ServiceListing', {
      categoryId: svc.categoryId ?? svc.category?.id,
      category: svc.category?.name ?? '',
    });
  };

  const goToPackage = (pkg: any) => {
    Keyboard.dismiss();
    navigation.navigate('PackageDetail', {packageId: pkg.id});
  };

  const goToOffer = (offer: any) => {
    Keyboard.dismiss();
    navigation.navigate('ServiceListing', {offer});
  };

  const hasAnyResults =
    (results.categories?.length ?? 0) > 0 ||
    (results.services?.length ?? 0) > 0 ||
    (results.packages?.length ?? 0) > 0 ||
    (results.offers?.length ?? 0) > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEDED" />

      <View style={[styles.header, {paddingTop: insets.top + sw(10)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={sw(22)} color="#012823" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={sw(18)} color="#8C8C8C" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search services, packages, categories…"
            placeholderTextColor="#9A9A9A"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={sw(18)} color="#B5B5B5" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(24)}]}>

        {loading && <ActivityIndicator size="large" color="#105641" style={{marginTop: sw(40)}} />}

        {!loading && query.trim().length < 2 && (
          <View style={styles.hintBox}>
            <Ionicons name="search-outline" size={sw(40)} color="#C5C5C5" />
            <Text style={styles.hintText}>Search for services, combo packages, categories and offers</Text>
          </View>
        )}

        {!loading && searched && query.trim().length >= 2 && !hasAnyResults && (
          <View style={styles.hintBox}>
            <Ionicons name="sad-outline" size={sw(40)} color="#C5C5C5" />
            <Text style={styles.hintText}>No results for "{query.trim()}"</Text>
          </View>
        )}

        {!loading && (results.categories?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Categories</Text>
            <View style={styles.chipsWrap}>
              {results.categories.map((cat: any) => (
                <TouchableOpacity
                  key={`cat-${cat.id}`}
                  style={styles.categoryChip}
                  activeOpacity={0.7}
                  onPress={() => goToCategory(cat)}>
                  {cat.icon ? <Text style={styles.categoryIcon}>{cat.icon}</Text> : null}
                  <Text style={styles.categoryChipText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!loading && (results.services?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Services</Text>
            {results.services.map((svc: any) => (
              <TouchableOpacity key={`svc-${svc.id}`} style={styles.row} activeOpacity={0.7} onPress={() => goToService(svc)}>
                <Image source={{uri: svc.image || FALLBACK_IMAGE}} style={styles.rowImage} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{svc.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {svc.category?.name ?? ''}{svc.duration ? ` · ${svc.duration} mins` : ''}
                  </Text>
                </View>
                <Text style={styles.rowPrice}>Starts at ₹{Math.round(svc.price ?? svc.basePrice ?? 0)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && (results.packages?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Packages</Text>
            {results.packages.map((pkg: any) => (
              <TouchableOpacity key={`pkg-${pkg.id}`} style={styles.row} activeOpacity={0.7} onPress={() => goToPackage(pkg)}>
                <Image source={{uri: pkg.image || FALLBACK_IMAGE}} style={styles.rowImage} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{pkg.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {pkg.packageType === 'flexible'
                      ? `Pick ${pkg.serviceCount ?? ''} services`
                      : `${(pkg.services ?? []).length} services included`}
                  </Text>
                </View>
                <Text style={styles.rowPrice}>₹{Math.round(pkg.price ?? 0)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && (results.offers?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Offers</Text>
            {results.offers.map((offer: any) => (
              <TouchableOpacity key={`offer-${offer.id}`} style={styles.row} activeOpacity={0.7} onPress={() => goToOffer(offer)}>
                <View style={[styles.rowImage, styles.offerIconBox]}>
                  <Ionicons name="pricetag" size={sw(20)} color="#C49738" />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{offer.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={2}>{offer.description ?? ''}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEEDED'},
  header: {
    flexDirection: 'row', alignItems: 'center', gap: sw(10),
    paddingHorizontal: sw(16), paddingBottom: sw(12), backgroundColor: '#EEEDED',
  },
  backBtn: {width: sw(28), height: sw(28), justifyContent: 'center', alignItems: 'center'},
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: sw(8),
    backgroundColor: '#FFFFFF', borderRadius: sw(12), paddingHorizontal: sw(12), height: sw(44),
    borderWidth: 1, borderColor: '#E2E2E2',
  },
  searchInput: {flex: 1, fontFamily: fonts.textFont, fontSize: sw(14), color: '#012823', padding: 0},
  scroll: {paddingHorizontal: sw(16), paddingTop: sw(8), gap: sw(20)},
  hintBox: {alignItems: 'center', gap: sw(12), marginTop: sw(60), paddingHorizontal: sw(32)},
  hintText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#8C8C8C', textAlign: 'center', lineHeight: sw(20)},
  section: {gap: sw(10)},
  sectionLabel: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '600', color: '#5C5C5C'},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: sw(8)},
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: sw(6),
    backgroundColor: '#FFFFFF', borderRadius: sw(20), paddingHorizontal: sw(14), paddingVertical: sw(8),
    borderWidth: 1, borderColor: '#E2E2E2',
  },
  categoryIcon: {fontSize: sw(14)},
  categoryChipText: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '500', color: '#012823'},
  row: {
    flexDirection: 'row', alignItems: 'center', gap: sw(12),
    backgroundColor: '#FFFFFF', borderRadius: sw(12), padding: sw(10),
    elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 4,
  },
  rowImage: {width: sw(48), height: sw(48), borderRadius: sw(10), backgroundColor: '#F0F0F0'},
  offerIconBox: {justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E7'},
  rowBody: {flex: 1, gap: sw(2)},
  rowTitle: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '600', color: '#012823'},
  rowSub: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#8C8C8C'},
  rowPrice: {fontFamily: fonts.title, fontSize: sw(13), color: '#105641'},
});

export default SearchScreen;
