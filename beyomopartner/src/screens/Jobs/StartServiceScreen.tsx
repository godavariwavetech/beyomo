import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Linking,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {resolveImageUrl} from '../../utils/utils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=80';

const parseServices = (s: any): any[] => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

const StartServiceScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const job = route?.params?.job ?? null;

  const orderId      = job?.bookingCode ?? `#${String(job?.id ?? '').slice(-8).toUpperCase()}`;
  const customerName = job?.user?.name ?? job?.userId?.name ?? job?.customerName ?? '—';
  const customerPhone = job?.user?.phone ?? job?.userId?.phone ?? job?.userPhone ?? null;
  const totalAmount  = Number(job?.totalAmount ?? 0);
  const earnings     = Number(job?.partnerEarning ?? totalAmount);

  const _parsedServices = parseServices(job?.services);
  const servicesList: any[] = _parsedServices.length > 0
    ? _parsedServices
    : job?.service
    ? [{name: job.service?.name ?? job.service, image: job.service?.image,
        duration: job.service?.duration, price: job.service?.basePrice ?? totalAmount}]
    : [];

  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    navigation.navigate('ActiveJob', {job});
    setStarting(false);
  };

  return (
    <View style={[styles.root, {paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor="#022723" />

      {/* Header */}
      <LinearGradient colors={['#0E5843', '#022723']}
        style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={sw(20)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: sw(10)}}>
          <Text style={styles.headerTitle}>Start Service</Text>
          <Text style={styles.headerSub}>{orderId}</Text>
        </View>
        <View style={styles.readyBadge}>
          <Text style={styles.readyBadgeText}>Ready</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: sw(16), gap: sw(14), paddingBottom: sw(110)}}>

        {/* Hero */}
        <LinearGradient colors={['#0E5843', '#022723']} style={styles.heroBanner}
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="cut" size={sw(40)} color="#FDD77A" />
          </View>
          <Text style={styles.heroTitle}>All Set!</Text>
          <Text style={styles.heroSub}>Review your services and tap Start when ready.</Text>
        </LinearGradient>

        {/* Customer */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{customerName[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{customerName}</Text>
              {customerPhone && <Text style={styles.sub}>{customerPhone}</Text>}
            </View>
            {customerPhone && (
              <TouchableOpacity style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${customerPhone}`)} activeOpacity={0.8}>
                <Ionicons name="call" size={sw(18)} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Services */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {servicesList.length > 1 ? `Services (${servicesList.length})` : 'Service'}
          </Text>
          {servicesList.map((svc: any, idx: number) => {
            const imgUri = resolveImageUrl(svc.image ?? job?.service?.image) ?? FALLBACK_IMG;
            const isFree = svc.addedByOffer || svc.price === 0;
            return (
              <View key={idx} style={[styles.svcRow, idx > 0 && styles.svcBorder]}>
                <Image source={{uri: imgUri}} style={styles.svcImg} resizeMode="cover" />
                <View style={{flex: 1}}>
                  <View style={styles.svcNameRow}>
                    <Text style={styles.svcName} numberOfLines={1}>{svc.name}</Text>
                    {svc.addedByPartner && (
                      <View style={styles.addedBadge}>
                        <Text style={styles.addedBadgeText}>Added</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.svcMeta}>
                    {svc.duration ? (
                      <View style={styles.chip}>
                        <Ionicons name="time-outline" size={sw(10)} color="#5C5C5C" />
                        <Text style={styles.chipText}>{svc.duration} min</Text>
                      </View>
                    ) : null}
                    {svc.qty && svc.qty > 1 ? (
                      <View style={styles.chip}><Text style={styles.chipText}>×{svc.qty}</Text></View>
                    ) : null}
                  </View>
                </View>
                <Text style={[styles.svcPrice, isFree && {color: '#9CA3AF'}]}>
                  {isFree ? 'FREE' : `₹${Number(svc.price * (svc.qty || 1)).toLocaleString('en-IN')}`}
                </Text>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Your Earnings</Text>
            <Text style={styles.totalValue}>₹{earnings.toLocaleString('en-IN')}</Text>
          </View>
        </View>

      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + sw(8)}]}>
        <TouchableOpacity onPress={handleStart} disabled={starting} activeOpacity={0.88}>
          <LinearGradient colors={starting ? ['#888','#888'] : ['#0E5843','#022723']} style={styles.startBtn}
            start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
            {starting ? <ActivityIndicator color="#FFFFFF" /> : (
              <><Ionicons name="play-circle" size={sw(22)} color="#FDD77A" />
              <Text style={styles.startBtnText}>Start Service</Text></>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F4F6F8'},

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: sw(16), paddingBottom: sw(16),
  },
  backBtn: {
    width: sw(36), height: sw(36), borderRadius: sw(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#FFFFFF'},
  headerSub: {fontFamily: fonts.textFont, fontSize: sw(11), color: 'rgba(255,255,255,0.6)', marginTop: sw(2)},
  readyBadge: {
    backgroundColor: '#FDD77A', borderRadius: sw(6),
    paddingHorizontal: sw(10), paddingVertical: sw(4),
  },
  readyBadgeText: {fontFamily: fonts.title, fontSize: sw(11), fontWeight: '800', color: '#012823'},

  heroBanner: {
    borderRadius: sw(16), padding: sw(24),
    alignItems: 'center', gap: sw(8),
  },
  heroIconCircle: {
    width: sw(80), height: sw(80), borderRadius: sw(40),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: sw(4),
  },
  heroTitle: {fontFamily: fonts.title, fontSize: sw(22), fontWeight: '700', color: '#FFFFFF'},
  heroSub: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.7)', textAlign: 'center'},

  card: {
    backgroundColor: '#FFFFFF', borderRadius: sw(16), padding: sw(14), gap: sw(10),
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: sw(12)},
  label: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF'},
  value: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500', marginTop: sw(2)},
  sub: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF', marginTop: sw(2)},

  avatarCircle: {
    width: sw(44), height: sw(44), borderRadius: sw(22),
    backgroundColor: '#012823', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarInitial: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#FDD77A'},
  callBtn: {
    width: sw(40), height: sw(40), borderRadius: sw(20),
    backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center',
  },

  sectionTitle: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},
  svcRow: {flexDirection: 'row', alignItems: 'center', gap: sw(12), paddingVertical: sw(8)},
  svcBorder: {borderTopWidth: 1, borderTopColor: '#F5F5F5'},
  svcImg: {width: sw(52), height: sw(52), borderRadius: sw(10), backgroundColor: '#E5E5E5', flexShrink: 0},
  svcNameRow: {flexDirection: 'row', alignItems: 'center', gap: sw(6)},
  svcName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '600', flex: 1},
  addedBadge: {
    backgroundColor: '#FEF3C7', borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2),
  },
  addedBadgeText: {fontFamily: fonts.textFont, fontSize: sw(9), color: '#92400E', fontWeight: '700'},
  svcMeta: {flexDirection: 'row', gap: sw(6), marginTop: sw(4)},
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: sw(3),
    backgroundColor: '#F0F0F0', borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2),
  },
  chipText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#5C5C5C'},
  svcPrice: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#105641'},
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1.5, borderTopColor: '#F0F0F0', paddingTop: sw(10), marginTop: sw(2),
  },
  totalLabel: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C', fontWeight: '600'},
  totalValue: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '800', color: '#012823'},

  footer: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEEDED',
    paddingHorizontal: sw(16), paddingTop: sw(12),
  },
  startBtn: {
    borderRadius: sw(14), height: sw(56),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(10),
  },
  startBtnText: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#FFFFFF'},
});

export default StartServiceScreen;
