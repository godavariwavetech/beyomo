import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {launchImageLibrary} from 'react-native-image-picker';
import {fonts} from '../../config/theme';
import {updatePartnerProfile} from '../../redux/reducers/partner';
import type {AppDispatch, RootState} from '../../redux/store';
import {useAppAlert} from '../../hooks/useAppAlert';
import AppAlertModal from '../../components/AppAlertModal/AppAlertModal';
import {resolveImageUrl} from '../../utils/utils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const Field = ({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.inputWrapperMulti]}>
      <Ionicons name={icon} size={sw(18)} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  </View>
);

const EditProfileScreen = ({navigation}: {navigation: any}) => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((s: RootState) => s.Partner?.profile as any);
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [experience, setExperience] = useState(String(profile?.experience ?? ''));
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [city, setCity] = useState(profile?.locationCity ?? profile?.city ?? '');
  const [state, setState] = useState(profile?.locationState ?? profile?.state ?? '');
  const [loading, setLoading] = useState(false);
  const {alertConfig, showAlert, hideAlert} = useAppAlert();

  // Preview shows either the existing remote picture or a just-picked local
  // file; newPhotoBase64 is only set (and only sent to the server) when the
  // partner actually picks a new image.
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    resolveImageUrl(profile?.profilePicture) ?? null,
  );
  const [newPhotoBase64, setNewPhotoBase64] = useState<string | null>(null);

  const handlePickPhoto = () => {
    launchImageLibrary(
      {mediaType: 'photo', includeBase64: true, quality: 0.6, maxWidth: 800, maxHeight: 800},
      response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset?.base64 || !asset.uri) return;
        setAvatarPreview(asset.uri);
        setNewPhotoBase64(`data:${asset.type ?? 'image/jpeg'};base64,${asset.base64}`);
      },
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Required', 'Name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const result = await dispatch(
        updatePartnerProfile({
          name: name.trim(),
          ...(email.trim() ? {email: email.trim()} : {}),
          ...(experience ? {experience: parseInt(experience, 10)} : {}),
          ...(bio.trim() ? {bio: bio.trim()} : {}),
          ...(newPhotoBase64 ? {profilePicture: newPhotoBase64} : {}),
          location: {
            city: city.trim() || undefined,
            state: state.trim() || undefined,
          },
        }),
      );
      if (updatePartnerProfile.fulfilled.match(result)) {
        showAlert('Success', 'Profile updated successfully.', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        showAlert('Error', (result.payload as string) ?? 'Failed to update profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0E5843', '#022723']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FEFEFE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{width: sw(36)}} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(32)}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8} style={styles.avatarWrap}>
              {avatarPreview ? (
                <Image source={{uri: avatarPreview}} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={sw(14)} color="#1a1a1a" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          <View style={styles.card}>
            <Field icon="person-outline" label="Full Name *" value={name} onChangeText={setName} placeholder="Your full name" />
            <Field icon="mail-outline" label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" />
            <Field icon="briefcase-outline" label="Experience (years)" value={experience} onChangeText={setExperience} placeholder="e.g. 3" keyboardType="numeric" />
            <Field icon="document-text-outline" label="Bio" value={bio} onChangeText={setBio} placeholder="Tell customers about yourself…" multiline />

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Location</Text>

            <Field icon="location-outline" label="City" value={city} onChangeText={setCity} placeholder="e.g. Hyderabad" />
            <Field icon="map-outline" label="State" value={state} onChangeText={setState} placeholder="e.g. Telangana" />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={loading}
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}>
            <LinearGradient
              colors={!loading ? ['#E4BA69', '#FDD77A', '#E3BB67'] : ['#888', '#888']}
              style={styles.saveBtnGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              {loading ? (
                <ActivityIndicator color="#1a1a1a" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <AppAlertModal config={alertConfig} onRequestClose={hideAlert} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(12),
  },
  backBtn: {padding: sw(4)},
  headerTitle: {
    fontFamily: fonts.title,
    fontSize: sw(18),
    fontWeight: '600',
    color: '#FEFEFE',
  },
  scroll: {
    paddingHorizontal: sw(20),
    paddingTop: sw(16),
  },
  avatarSection: {alignItems: 'center', marginBottom: sw(20)},
  avatarWrap: {width: sw(88), height: sw(88)},
  avatar: {width: '100%', height: '100%', borderRadius: sw(44), borderWidth: 2, borderColor: '#FDD77A'},
  avatarFallback: {backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  avatarInitial: {fontFamily: fonts.title, fontSize: sw(30), fontWeight: '700', color: '#FFFFFF'},
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: sw(28),
    height: sw(28),
    borderRadius: sw(14),
    backgroundColor: '#FDD77A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0E5843',
  },
  avatarHint: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.6)',
    marginTop: sw(8),
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: sw(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: sw(20),
    gap: sw(16),
  },
  fieldGroup: {gap: sw(6)},
  fieldLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginLeft: sw(4),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    height: sw(50),
    paddingHorizontal: sw(14),
    overflow: 'hidden',
  },
  inputWrapperMulti: {
    height: sw(90),
    alignItems: 'flex-start',
    paddingTop: sw(12),
  },
  inputIcon: {marginRight: sw(10), marginTop: sw(1)},
  input: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#FEFEFE',
    height: '100%',
  },
  inputMulti: {height: sw(70)},
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: sw(4),
  },
  sectionTitle: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '600',
    color: '#FDD77A',
    marginLeft: sw(2),
    marginBottom: sw(4),
  },
  saveBtn: {
    borderRadius: sw(14),
    overflow: 'hidden',
    marginTop: sw(24),
  },
  saveBtnDisabled: {opacity: 0.6},
  saveBtnGradient: {
    height: sw(54),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: sw(0.5),
  },
});

export default EditProfileScreen;
