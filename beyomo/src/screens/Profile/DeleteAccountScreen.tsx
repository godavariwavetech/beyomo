import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {useDispatch} from 'react-redux';
import {deleteAccount, actionLogout} from '../../redux/reducers/auth';
import {resetToLogin} from '../../navigation/navigationReset';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const CONSEQUENCES = [
  'Your profile, saved addresses, and preferences will be permanently removed.',
  'You will lose access to your booking history and Beyomo wallet balance.',
  'This action cannot be undone.',
];

interface Props {
  navigation?: any;
}

const DeleteAccountScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const [loading, setLoading] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This cannot be undone. Are you sure you want to continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
      ],
    );
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await dispatch(deleteAccount()).unwrap();
      dispatch(actionLogout());
      resetToLogin(navigation);
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Something went wrong', typeof error === 'string' ? error : 'Failed to delete account. Please try again.');
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
          <Text style={styles.headerTitle}>Delete Account</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(24)}]}>

        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={sw(28)} color="#DB1919" />
          <Text style={styles.warningTitle}>Deleting your account is permanent</Text>
          <Text style={styles.warningText}>
            Before you continue, please review what happens when your account is deleted:
          </Text>
        </View>

        <View style={styles.listCard}>
          {CONSEQUENCES.map((item, idx) => (
            <View key={idx} style={styles.listRow}>
              <Ionicons name="close-circle-outline" size={sw(18)} color="#DB1919" />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.deleteBtn, loading && styles.deleteBtnDisabled]}
          activeOpacity={0.85}
          disabled={loading}
          onPress={confirmDelete}>
          {loading ? (
            <ActivityIndicator color="#FEFEFE" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={sw(20)} color="#FEFEFE" />
              <Text style={styles.deleteText}>Delete My Account</Text>
            </>
          )}
        </TouchableOpacity>
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
    paddingBottom: sw(10),
    backgroundColor: '#EEEDED',
  },
  titleBlock: {alignItems: 'center', gap: sw(6)},
  headerTitle: {fontFamily: fonts.primary, fontSize: sw(20), fontWeight: '400', color: '#012823', lineHeight: sw(23)},
  titleUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},

  scroll: {paddingHorizontal: sw(16), paddingTop: sw(12), gap: sw(16)},

  warningCard: {
    backgroundColor: '#FEFEFE',
    borderWidth: 1,
    borderColor: '#F1C6C6',
    borderRadius: sw(12),
    padding: sw(16),
    gap: sw(8),
    alignItems: 'flex-start',
  },
  warningTitle: {fontFamily: fonts.textFont, fontSize: sw(15), fontWeight: '700', color: '#373737', lineHeight: sw(21)},
  warningText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#5C5C5C', lineHeight: sw(18)},

  listCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: sw(12),
    padding: sw(16),
    gap: sw(14),
  },
  listRow: {flexDirection: 'row', alignItems: 'flex-start', gap: sw(10)},
  listText: {flex: 1, fontFamily: fonts.textFont, fontSize: sw(12), color: '#373737', lineHeight: sw(18)},

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(10),
    backgroundColor: '#DB1919',
    borderRadius: sw(8),
    paddingVertical: sw(14),
  },
  deleteBtnDisabled: {opacity: 0.6},
  deleteText: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '600', color: '#FEFEFE'},
});

export default DeleteAccountScreen;
