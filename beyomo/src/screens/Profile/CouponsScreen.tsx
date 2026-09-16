import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import {formatAmount} from '../../utils/utils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const formatDiscount = (c: any): string => {
  if (c.discountType === 'flat' || c.discountType === 'fixed') return `₹${formatAmount(c.discountValue ?? 0)}`;
  return `${c.discountValue ?? 0}%`;
};

const formatExpiry = (c: any): string => {
  if (c.expiresAt) {
    const d = new Date(c.expiresAt);
    return `Expires ${d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}`;
  }
  return '';
};

interface SelectedCoupon {
  code: string;
  discountAmount: number;
  description?: string;
}

interface Props {
  navigation?: any;
  route?: any;
}

const CouponsScreen = ({navigation, route}: Props) => {
  const insets = useSafeAreaInsets();
  const selectedCity = useSelector((s: any) => s.City?.selectedCity ?? s.city?.selectedCity);
  const orderAmount: number | undefined = route?.params?.orderAmount;
  const onSelect: ((coupon: SelectedCoupon) => void) | undefined = route?.params?.onSelect;
  const isPickerMode = typeof onSelect === 'function';

  const [promoCode, setPromoCode] = useState('');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    const url = selectedCity?.id
      ? `${endpoints.COUPONS}?cityId=${selectedCity.id}`
      : endpoints.COUPONS;
    api.get(url)
      .then(res => setCoupons(res.data?.data?.coupons ?? res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCity?.id]);

  const applyAndReturn = useCallback(async (code: string, cardId?: string) => {
    if (!code) return;
    if (cardId) setApplyingId(cardId);
    else setApplying(true);
    try {
      if (isPickerMode && orderAmount != null) {
        const res = await api.post(endpoints.COUPON_APPLY, {code, orderAmount});
        const d = res.data?.data;
        onSelect!({code: d.code, discountAmount: d.discountAmount, description: d.description});
        navigation?.goBack();
      } else {
        const res = await api.post(endpoints.COUPON_VALIDATE, {code});
        const data = res.data?.data ?? res.data;
        Alert.alert(
          'Coupon Valid',
          data?.message ?? `Coupon "${code}" is valid. Apply it at checkout to save!`,
        );
        setPromoCode('');
      }
    } catch (err: any) {
      Alert.alert('Invalid Coupon', err.response?.data?.message ?? 'This coupon code is not valid or has expired.');
    } finally {
      setApplying(false);
      setApplyingId(null);
    }
  }, [isPickerMode, orderAmount, onSelect, navigation]);

  const handleCardApply = (coupon: any, cid: string) => {
    if (isPickerMode) {
      applyAndReturn(coupon.code, cid);
    } else {
      setPromoCode(coupon.code);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEDED" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#000000" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>Coupons & Offers</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      {isPickerMode && orderAmount != null && (
        <View style={styles.pickerBanner}>
          <Ionicons name="pricetag" size={sw(14)} color="#105641" />
          <Text style={styles.pickerBannerText}>
            Order ₹{formatAmount(orderAmount)} — tap a coupon to apply it instantly
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(24)}]}>

        <View style={styles.promoBox}>
          <TextInput
            style={styles.promoInput}
            placeholder="Enter promo code"
            placeholderTextColor="#BBBBBB"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={() => applyAndReturn(promoCode.trim().toUpperCase())}
          />
          <TouchableOpacity
            style={[styles.applyBtn, (!promoCode || applying) && styles.applyBtnDisabled]}
            onPress={() => applyAndReturn(promoCode.trim().toUpperCase())}
            disabled={!promoCode || applying}
            activeOpacity={0.8}>
            {applying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyBtnText}>{isPickerMode ? 'Apply' : 'Check'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Available Coupons</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#105641" style={{marginTop: sw(32)}} />
        ) : coupons.length === 0 ? (
          <Text style={styles.emptyText}>No coupons available right now.</Text>
        ) : (
          coupons.map((coupon: any) => {
            const cid = String(coupon._id ?? coupon.id);
            const discount = formatDiscount(coupon);
            const expiry = formatExpiry(coupon);
            const desc = coupon.desc ?? coupon.description ?? '';
            const minOrder = coupon.minOrderAmount ?? 0;
            const isApplyingThis = applyingId === cid;
            const meetsMin = orderAmount == null || minOrder === 0 || orderAmount >= minOrder;

            return (
              <View
                key={cid}
                style={[styles.couponCard, !meetsMin && styles.couponCardDimmed]}>
                <LinearGradient
                  colors={meetsMin ? ['#0E5843', '#022723'] : ['#888', '#555']}
                  style={styles.couponLeft}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}>
                  <Text style={styles.discountText}>{discount}</Text>
                  <Text style={styles.discountLabel}>OFF</Text>
                </LinearGradient>

                <View style={styles.dashedDivider} />

                <View style={styles.couponRight}>
                  <View style={styles.couponCodeRow}>
                    <Text style={[styles.couponCode, !meetsMin && {color: '#888'}]}>
                      {coupon.code}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={isApplyingThis || !meetsMin}
                      onPress={() => handleCardApply(coupon, cid)}
                      style={[styles.applyChip, !meetsMin && styles.applyChipDisabled]}>
                      {isApplyingThis ? (
                        <ActivityIndicator size="small" color="#105641" style={{width: sw(32)}} />
                      ) : (
                        <Text style={[styles.applyChipText, !meetsMin && {color: '#AAA', borderColor: '#CCC'}]}>
                          {isPickerMode ? 'APPLY' : 'USE'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {!!desc && <Text style={styles.couponDesc} numberOfLines={2}>{desc}</Text>}

                  <View style={styles.couponMeta}>
                    {minOrder > 0 && (
                      <Text style={[styles.minOrderText, !meetsMin && {color: '#E05151'}]}>
                        Min ₹{formatAmount(minOrder)}
                        {!meetsMin ? ' (order too low)' : ''}
                      </Text>
                    )}
                    {!!expiry && (
                      <View style={styles.expiryRow}>
                        <Ionicons name="time-outline" size={sw(11)} color="#A3A3A3" />
                        <Text style={styles.expiryText}>{expiry}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEEDED'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(12),
    backgroundColor: '#EEEDED',
  },
  titleBlock: {alignItems: 'center', gap: sw(6)},
  headerTitle: {fontFamily: fonts.primary, fontSize: sw(20), fontWeight: '400', color: '#012823'},
  titleUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},

  pickerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    backgroundColor: '#EAF5F0',
    paddingHorizontal: sw(16),
    paddingVertical: sw(10),
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6DC',
  },
  pickerBannerText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#105641',
    flex: 1,
  },

  scroll: {paddingHorizontal: sw(16), paddingTop: sw(12), gap: sw(12)},

  promoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: sw(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: sw(48),
  },
  promoInput: {
    flex: 1,
    paddingHorizontal: sw(14),
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#171816',
  },
  applyBtn: {
    backgroundColor: '#105641',
    paddingHorizontal: sw(18),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: sw(72),
  },
  applyBtnDisabled: {backgroundColor: '#AAAAAA'},
  applyBtnText: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#FFFFFF'},

  sectionLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#373737',
  },

  emptyText: {
    textAlign: 'center',
    color: '#A3A3A3',
    marginTop: sw(32),
    fontFamily: fonts.textFont,
    fontSize: sw(13),
  },

  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  couponCardDimmed: {opacity: 0.65},

  couponLeft: {
    width: sw(76),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sw(16),
    gap: sw(2),
  },
  discountText: {fontFamily: fonts.title, fontSize: sw(22), fontWeight: '700', color: '#FDD77A'},
  discountLabel: {fontFamily: fonts.textFont, fontSize: sw(13), color: 'rgba(255,255,255,0.8)'},

  dashedDivider: {
    width: 1,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  couponRight: {flex: 1, padding: sw(12), gap: sw(5)},
  couponCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponCode: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#105641',
    letterSpacing: 1,
    flex: 1,
  },
  applyChip: {
    borderWidth: 1,
    borderColor: '#105641',
    borderRadius: sw(4),
    paddingHorizontal: sw(8),
    paddingVertical: sw(2),
    minWidth: sw(44),
    alignItems: 'center',
  },
  applyChipDisabled: {borderColor: '#CCC'},
  applyChipText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#105641',
  },
  couponDesc: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#5C5C5C', lineHeight: sw(17)},
  couponMeta: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: sw(4)},
  minOrderText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#888'},
  expiryRow: {flexDirection: 'row', alignItems: 'center', gap: sw(3)},
  expiryText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#A3A3A3'},
});

export default CouponsScreen;
