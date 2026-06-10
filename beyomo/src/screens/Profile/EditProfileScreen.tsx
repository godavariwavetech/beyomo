import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {fetchProfile, updateProfile} from '../../redux/reducers/user';
import type {AppDispatch} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const EditProfileScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((s: any) => s.User?.profile);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!profile) {
      dispatch(fetchProfile());
    } else {
      setName(profile.name ?? profile.fullName ?? '');
      setEmail(profile.email ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    const result = await dispatch(updateProfile({name: name.trim(), email: email.trim() || undefined}));
    setSaving(false);
    if (updateProfile.fulfilled.match(result)) {
      Alert.alert('Success', 'Profile updated successfully.', [
        {text: 'OK', onPress: () => navigation?.goBack()},
      ]);
    } else {
      Alert.alert('Error', (result.payload as string) ?? 'Failed to update profile.');
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
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Avatar placeholder */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {name ? name[0].toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={styles.avatarHint}>Profile photo coming soon</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={sw(18)} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor="#AAAAAA"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={sw(18)} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputRow, styles.inputDisabled]}>
                <Ionicons name="call-outline" size={sw(18)} color="#AAAAAA" style={styles.inputIcon} />
                <Text style={styles.disabledText}>
                  {profile?.phone ?? '—'}
                </Text>
              </View>
              <Text style={styles.hint}>Phone number cannot be changed</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={sw(20)} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEEDED'},
  flex: {flex: 1},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(20),
    paddingBottom: sw(14),
    backgroundColor: '#EEEDED',
  },
  titleBlock: {alignItems: 'center'},
  title: {
    fontFamily: fonts.title,
    fontSize: sw(18),
    fontWeight: '700',
    color: '#171816',
  },
  titleUnderline: {
    height: 3,
    width: sw(28),
    backgroundColor: '#105641',
    borderRadius: 2,
    marginTop: sw(3),
  },

  scroll: {
    paddingHorizontal: sw(20),
    paddingTop: sw(24),
    paddingBottom: sw(40),
  },

  avatarSection: {alignItems: 'center', marginBottom: sw(28)},
  avatarCircle: {
    width: sw(88),
    height: sw(88),
    borderRadius: sw(44),
    backgroundColor: '#105641',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sw(8),
  },
  avatarText: {
    fontFamily: fonts.title,
    fontSize: sw(36),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarHint: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#888888',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(16),
    padding: sw(20),
    gap: sw(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    marginBottom: sw(24),
  },

  inputGroup: {gap: sw(6)},
  label: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '600',
    color: '#444444',
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: sw(12),
    height: sw(48),
  },
  inputIcon: {marginRight: sw(8)},
  input: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#171816',
  },
  inputDisabled: {backgroundColor: '#F0F0F0', borderColor: '#E8E8E8'},
  disabledText: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#AAAAAA',
  },
  hint: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#AAAAAA',
    marginTop: sw(2),
  },

  saveBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(14),
    height: sw(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
  },
  saveBtnDisabled: {opacity: 0.6},
  saveBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EditProfileScreen;
