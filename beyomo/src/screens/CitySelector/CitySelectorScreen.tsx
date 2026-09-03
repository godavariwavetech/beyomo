import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {BASE_URL, endpoints} from '../../config/config';
import {setSelectedCity} from '../../redux/reducers/city';
import type {RootState} from '../../redux/store';
import type {CityGeo} from '../../utils/geoUtils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

interface Props {
  navigation?: any;
  route?: any;
}

const CitySelectorScreen = ({navigation, route}: Props) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const token = useSelector((state: RootState) => state.Auth?.token);
  const currentCity = useSelector((state: RootState) => (state as any).City?.selectedCity);

  const [cities, setCities] = useState<CityGeo[]>([]);
  const [loading, setLoading] = useState(true);
  // Pre-select whatever city is currently active so the user sees it highlighted
  // (radio filled + card outlined) instead of an empty selection.
  const [selected, setSelected] = useState<CityGeo | null>(currentCity ?? null);

  // nextRoute lets SplashScreen tell us where to go after city selection
  const nextRoute: string = route?.params?.nextRoute ?? (token ? 'Main' : 'Login');
  const returnToHome: boolean = route?.params?.returnToHome ?? false;

  useEffect(() => {
    fetch(`${BASE_URL}${endpoints.CITIES}`)
      .then(r => r.json())
      .then(data => setCities(Array.isArray(data.data) ? data.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const confirm = () => {
    if (!selected) {
      Alert.alert('Select City', 'Please select a city to continue.');
      return;
    }
    dispatch(setSelectedCity(selected));
    if (returnToHome) {
      navigation?.goBack();
    } else {
      navigation?.replace(nextRoute);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0E5843" />

      {/* Header */}
      <LinearGradient
        colors={['#0E5843', '#022723']}
        style={[styles.header, {paddingTop: insets.top + sw(24)}]}>
        {returnToHome && (
          <TouchableOpacity
            style={[styles.backBtn, {top: insets.top + sw(24)}]}
            activeOpacity={0.7}
            onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Ionicons name="location" size={sw(32)} color="#C8A84C" />
        <Text style={styles.title}>Select Your City</Text>
        <Text style={styles.subtitle}>
          We're currently available in select cities.{'\n'}Choose where you'd like service.
        </Text>
      </LinearGradient>

      {/* City list */}
      <View style={styles.listWrap}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#105641" />
            <Text style={styles.loadingText}>Loading available cities…</Text>
          </View>
        ) : cities.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="sad-outline" size={sw(48)} color="#CBCBCB" />
            <Text style={styles.emptyText}>No cities available yet.{'\n'}Please check back soon.</Text>
          </View>
        ) : (
          <FlatList
            data={cities}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => {
              const isSelected = selected?.id === item.id;
              return (
                <TouchableOpacity
                  style={[styles.cityCard, isSelected && styles.cityCardSelected]}
                  activeOpacity={0.75}
                  onPress={() => setSelected(item)}>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.cityCardBody}>
                    <View style={[styles.cityIconBox, isSelected && styles.cityIconBoxSelected]}>
                      <Ionicons
                        name="location-sharp"
                        size={sw(18)}
                        color={isSelected ? '#FFFFFF' : '#105641'}
                      />
                    </View>
                    <View style={styles.cityTextWrap}>
                      <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                        {item.name}
                      </Text>
                      {item.state ? (
                        <Text style={styles.cityState}>{item.state}</Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Confirm button */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + sw(8)}]}>
        <TouchableOpacity
          style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
          activeOpacity={0.85}
          onPress={confirm}
          disabled={!selected}>
          <Text style={styles.confirmText}>
            {selected ? `Continue in ${selected.name}` : 'Select a City to Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={sw(18)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},

  header: {
    paddingBottom: sw(28),
    paddingHorizontal: sw(24),
    alignItems: 'center',
    gap: sw(8),
  },
  backBtn: {
    position: 'absolute',
    left: sw(16),
    padding: sw(6),
  },
  title: {
    fontFamily: fonts.title,
    fontSize: sw(22),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: sw(4),
  },
  subtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: sw(20),
  },

  listWrap: {flex: 1},
  listContent: {padding: sw(16), gap: sw(10)},

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(12),
    paddingHorizontal: sw(32),
  },
  loadingText: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#888',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: sw(22),
  },

  cityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(14),
    padding: sw(14),
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
  },
  cityCardSelected: {
    borderColor: '#105641',
    backgroundColor: '#F0FAF6',
  },
  radioOuter: {
    width: sw(20),
    height: sw(20),
    borderRadius: sw(10),
    borderWidth: 2,
    borderColor: '#CBCBCB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#105641',
  },
  radioInner: {
    width: sw(10),
    height: sw(10),
    borderRadius: sw(5),
    backgroundColor: '#105641',
  },
  cityCardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
  },
  cityIconBox: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(10),
    backgroundColor: '#E8F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityIconBoxSelected: {
    backgroundColor: '#105641',
  },
  cityTextWrap: {flex: 1},
  cityName: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '600',
    color: '#171816',
  },
  cityNameSelected: {
    color: '#105641',
  },
  cityState: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#888888',
    marginTop: sw(2),
  },

  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
  },
  confirmBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(32),
    paddingVertical: sw(14),
    paddingHorizontal: sw(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
  },
  confirmBtnDisabled: {
    backgroundColor: '#AAAAAA',
  },
  confirmText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CitySelectorScreen;
