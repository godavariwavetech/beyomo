import React, {useState, useEffect, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  AppState,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {refreshPartnerStatus} from '../../redux/reducers/auth';
import {navigationRef} from '../../navigation/navigationRef';
import type {AppDispatch, RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

// How often the signed-in app re-reads its own partner status. The admin suspends from the
// dashboard, and nothing pushes that down the socket, so the app has to notice on its own.
// Matches the 10s cadence the Home and Earnings screens already poll at.
const POLL_MS = 10000;

// Suspension is announced by the partner's own profile record — the same `status` field
// AccountStatusScreen reads at login, refreshed through the existing refreshPartnerStatus
// thunk. No new endpoint and no new state: the token stays valid while suspended, so the
// profile keeps answering and simply reports the new status.
const SUSPENDED = 'suspended';

// The route the Help & Support button sends them to. Keeping the modal mounted over it
// would hide the very screen they asked for, so it stands down while that screen is open
// and comes back when they leave it.
const HELP_ROUTE = 'HelpSupport';

const AccountSuspendedModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const partner = useSelector((state: RootState) => state.Auth.partner);
  const token = useSelector((state: RootState) => state.Auth.token);
  const [routeName, setRouteName] = useState<string | undefined>(undefined);

  const suspended = (partner as any)?.status === SUSPENDED;

  // Only poll while someone is actually signed in — before login there is no partner to
  // check and the request would just 401.
  useEffect(() => {
    if (!token) return;

    const check = () => dispatch(refreshPartnerStatus());
    check();

    let interval: ReturnType<typeof setInterval> | null = setInterval(check, POLL_MS);

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        if (!interval) {
          check();
          interval = setInterval(check, POLL_MS);
        }
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    });

    return () => {
      if (interval) clearInterval(interval);
      sub.remove();
    };
  }, [dispatch, token]);

  // Track the active route through the shared navigation ref. A component rendered beside
  // the navigator has no navigation context, so the hooks are unavailable here — the ref's
  // own 'state' event is what makes the current route observable from out here.
  useEffect(() => {
    const sync = () => setRouteName(navigationRef.getCurrentRoute()?.name);
    if (navigationRef.isReady()) sync();
    const unsub = navigationRef.addListener('state', sync);
    return unsub;
  }, []);

  const openHelp = useCallback(() => {
    if (!navigationRef.isReady()) return;
    navigationRef.navigate(HELP_ROUTE as never);
  }, []);

  if (!suspended || routeName === HELP_ROUTE) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      // Deliberately inert: a suspended account cannot be dismissed back into the app, so
      // the Android back button must not close this.
      onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle-outline" size={sw(38)} color="#EF4444" />
          </View>

          <Text style={styles.title}>Account Suspended</Text>
          <Text style={styles.message}>
            Your partner account has been suspended. You cannot accept or manage bookings
            right now. Please contact our support team to resolve this.
          </Text>

          <TouchableOpacity style={styles.helpBtn} activeOpacity={0.85} onPress={openHelp}>
            <Ionicons name="chatbubble-ellipses-outline" size={sw(16)} color="#FFFFFF" />
            <Text style={styles.helpBtnText}>Help &amp; Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(24),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: sw(18),
    paddingVertical: sw(24),
    paddingHorizontal: sw(20),
    alignItems: 'center',
    gap: sw(12),
  },
  iconWrap: {
    width: sw(64),
    height: sw(64),
    borderRadius: sw(32),
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.title,
    fontSize: sw(19),
    fontWeight: '700',
    color: '#171816',
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    lineHeight: sw(19),
    color: '#666666',
    textAlign: 'center',
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
    alignSelf: 'stretch',
    marginTop: sw(4),
    backgroundColor: '#105641',
    borderRadius: sw(12),
    paddingVertical: sw(13),
  },
  helpBtnText: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AccountSuspendedModal;
