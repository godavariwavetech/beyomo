import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import type {RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const EarningsScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const job = route?.params?.job ?? null;
  const dashboard = useSelector((s: RootState) => s.Partner?.dashboard);
  const earnings = useSelector((s: RootState) => s.Partner?.earnings);

  // Derive from booking object
  const orderId = job?.bookingCode ?? (job?._id ? job._id.toString().slice(-8).toUpperCase() : '—');
  const serviceName = job?.services?.[0]?.name ?? job?.serviceId?.name ?? job?.service ?? '—';
  const duration = job?.serviceId?.duration ?? job?.duration ?? null;
  const completedAt = job?.completedAt
    ? new Date(job.completedAt).toLocaleDateString('en-IN', {day: '2-digit', month: 'long', year: 'numeric'})
    : '—';
  const customerName = job?.userId?.name ?? job?.customerName ?? '—';
  const totalAmount = job?.totalAmount ?? 0;
  const partnerEarning = job?.partnerEarning ?? totalAmount;
  const deductions = totalAmount - partnerEarning;

  // Build breakdown rows from real data
  const breakdownItems = [
    {label: 'Service Earnings', amount: totalAmount, color: '#105641', isPositive: true},
    ...(deductions > 0 ? [{label: 'Platform Deductions', amount: -deductions, color: '#DB1919', isPositive: false}] : []),
    {label: 'Net Earnings', amount: partnerEarning, color: '#012823', isPositive: true, isBold: true},
  ];

  // Monthly stats from Redux
  const monthEarnings = earnings?.period === 'month' ? earnings : null;
  const monthJobs = monthEarnings?.stats?.jobs ?? dashboard?.bookingStats?.totalCompleted ?? 0;
  const monthEarned = monthEarnings?.stats?.earned ?? 0;
  const avgRating = earnings?.averageRating ?? dashboard?.ratings?.average;

  const handleAddToWallet = () => {
    Alert.alert(
      'Add to Wallet',
      `₹${partnerEarning.toLocaleString('en-IN')} will be transferred to your linked bank account within 2-3 business days.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Confirm', onPress: () => Alert.alert('Success', 'Transfer initiated!')},
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#022723" />

      <LinearGradient
        colors={['#0E5843', '#022723']}
        style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Summary</Text>
        <View style={{width: sw(22)}} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(32)}]}>

        {/* Success banner */}
        <LinearGradient
          colors={['#105641', '#012823']}
          style={styles.successBanner}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={sw(40)} color="#FDD77A" />
          </View>
          <Text style={styles.successTitle}>Service Completed Successfully!</Text>
          <Text style={styles.successSub}>Great job! Keep completing more services to earn more.</Text>
          <View style={styles.successEarning}>
            <Text style={styles.successEarningLabel}>You Earned</Text>
            <Text style={styles.successEarningAmt}>
              ₹{partnerEarning.toLocaleString('en-IN')}
            </Text>
          </View>
        </LinearGradient>

        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Order Summary</Text>

          <View style={styles.orderRow}>
            <Text style={styles.orderKey}>Order ID</Text>
            <Text style={styles.orderVal}>{orderId}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderKey}>Service</Text>
            <Text style={styles.orderVal}>{serviceName}</Text>
          </View>
          {!!duration && (
            <View style={styles.orderRow}>
              <Text style={styles.orderKey}>Duration</Text>
              <Text style={styles.orderVal}>{duration} mins</Text>
            </View>
          )}
          <View style={styles.orderRow}>
            <Text style={styles.orderKey}>Date</Text>
            <Text style={styles.orderVal}>{completedAt}</Text>
          </View>
          {!!customerName && customerName !== '—' && (
            <View style={styles.orderRow}>
              <Text style={styles.orderKey}>Customer</Text>
              <Text style={styles.orderVal}>{customerName}</Text>
            </View>
          )}
        </View>

        {/* Earnings breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Earnings Breakdown</Text>

          {breakdownItems.map((item, idx) => (
            <View
              key={item.label}
              style={[
                styles.breakdownRow,
                item.isBold && styles.breakdownRowBold,
                idx > 0 && !item.isBold && styles.breakdownRowBorder,
              ]}>
              <Text style={[styles.breakdownKey, item.isBold && styles.breakdownKeyBold]}>
                {item.label}
              </Text>
              <Text style={[styles.breakdownVal, {color: item.color}, item.isBold && styles.breakdownValBold]}>
                {item.isPositive ? '' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </View>

        {/* Monthly stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>This Month</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthJobs}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {monthEarned >= 100000
                  ? `₹${(monthEarned / 100000).toFixed(2)}L`
                  : `₹${monthEarned.toLocaleString('en-IN')}`}
              </Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={sw(13)} color="#F5A623" />
                <Text style={styles.statValue}>
                  {avgRating != null ? Number(avgRating).toFixed(1) : '—'}
                </Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.walletBtn} activeOpacity={0.85} onPress={handleAddToWallet}>
            <LinearGradient
              colors={['#0E5843', '#022723']}
              style={styles.walletBtnGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Ionicons name="wallet-outline" size={sw(20)} color="#FDD77A" />
              <Text style={styles.walletBtnText}>Add to Wallet</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Main')}>
            <Ionicons name="home-outline" size={sw(18)} color="#012823" />
            <Text style={styles.homeBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(14),
  },
  headerTitle: {fontFamily: fonts.title, fontSize: sw(17), fontWeight: '700', color: '#FFFFFF'},

  scroll: {padding: sw(16), gap: sw(14)},

  successBanner: {
    borderRadius: sw(14),
    padding: sw(20),
    alignItems: 'center',
    gap: sw(8),
  },
  successIcon: {
    width: sw(72),
    height: sw(72),
    borderRadius: sw(36),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(4),
  },
  successTitle: {fontFamily: fonts.title, fontSize: sw(17), fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: sw(23)},
  successSub: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: sw(18)},
  successEarning: {
    alignItems: 'center',
    marginTop: sw(8),
    backgroundColor: 'rgba(253,215,122,0.15)',
    borderRadius: sw(12),
    paddingHorizontal: sw(24),
    paddingVertical: sw(12),
    gap: sw(2),
  },
  successEarningLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.65)'},
  successEarningAmt: {fontFamily: fonts.title, fontSize: sw(30), fontWeight: '700', color: '#FDD77A'},

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(16),
    gap: sw(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  cardLabel: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816', marginBottom: sw(2)},

  orderRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  orderKey: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C'},
  orderVal: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500'},

  breakdownRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: sw(4)},
  breakdownRowBorder: {borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: sw(10), marginTop: sw(4)},
  breakdownRowBold: {borderTopWidth: 1.5, borderTopColor: '#EEEDED', paddingTop: sw(10), marginTop: sw(6)},
  breakdownKey: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C'},
  breakdownKeyBold: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},
  breakdownVal: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '600'},
  breakdownValBold: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700'},

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(16),
    gap: sw(14),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  statsRow: {flexDirection: 'row', alignItems: 'center'},
  statItem: {flex: 1, alignItems: 'center', gap: sw(4)},
  statDivider: {width: 1, height: sw(28), backgroundColor: '#EEEDED'},
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: sw(3)},
  statValue: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#012823'},
  statLabel: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#5C5C5C'},

  actionRow: {gap: sw(10)},
  walletBtn: {
    borderRadius: sw(12),
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#012823',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  walletBtnGradient: {
    height: sw(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(10),
  },
  walletBtnText: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#FFFFFF'},
  homeBtn: {
    height: sw(52),
    borderRadius: sw(12),
    borderWidth: 1.5,
    borderColor: '#012823',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
    backgroundColor: '#FFFFFF',
  },
  homeBtnText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#012823'},
});

export default EarningsScreen;
