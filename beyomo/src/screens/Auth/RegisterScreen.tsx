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
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {fonts} from '../../config/theme';
import {updateProfile} from '../../redux/reducers/user';
import type {AppDispatch} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const RegisterScreen = ({navigation}: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    setLoading(true);
    try {
      const result = await dispatch(
        updateProfile({
          name: name.trim(),
          ...(email.trim() ? {email: email.trim()} : {}),
        }),
      );
      if (updateProfile.fulfilled.match(result)) {
        navigation.replace('Main');
      } else {
        Alert.alert('Error', (result.payload as string) ?? 'Could not save profile. Please try again.');
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={styles.logoSection}>
            <Text style={styles.appName}>BEYOMO</Text>
            <View style={styles.taglineRow}>
              <View style={styles.taglineLine} />
              <Text style={styles.tagline}>SALON COMES HOME</Text>
              <View style={styles.taglineLine} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Complete Your Profile</Text>
            <Text style={styles.cardSubtitle}>Tell us your name to get started</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={sw(18)} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name *"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={sw(18)} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email (optional)"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={!name.trim() || loading}
              style={[styles.btnWrapper, (!name.trim() || loading) && styles.btnDisabled]}>
              <LinearGradient
                colors={name.trim() && !loading ? ['#E4BA69', '#FDD77A', '#E3BB67'] : ['#888', '#888']}
                style={styles.btn}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                {loading ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <Text style={styles.btnText}>Get Started</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomDeco}>
            <View style={styles.decoLine} />
            <Ionicons name="leaf-outline" size={sw(16)} color="#C8A84C" />
            <View style={styles.decoLine} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: sw(24),
    paddingVertical: sw(60),
  },
  logoSection: {alignItems: 'center', marginBottom: sw(48)},
  appName: {
    fontFamily: fonts.title,
    fontSize: sw(42),
    fontWeight: '700',
    color: '#FEFEFE',
    letterSpacing: sw(4),
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    marginTop: sw(4),
  },
  taglineLine: {height: 1, width: sw(30), backgroundColor: '#C8A84C'},
  tagline: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#C8A84C',
    letterSpacing: sw(2),
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: sw(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: sw(24),
    gap: sw(16),
  },
  cardTitle: {
    fontFamily: fonts.title,
    fontSize: sw(24),
    fontWeight: '700',
    color: '#FEFEFE',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginTop: -sw(8),
  },
  inputGroup: {gap: sw(12)},
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    height: sw(52),
    paddingHorizontal: sw(14),
    overflow: 'hidden',
  },
  inputIcon: {marginRight: sw(10)},
  input: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(15),
    color: '#FEFEFE',
    height: '100%',
  },
  btnWrapper: {borderRadius: sw(12), overflow: 'hidden', marginTop: sw(4)},
  btnDisabled: {opacity: 0.6},
  btn: {height: sw(52), justifyContent: 'center', alignItems: 'center'},
  btnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: sw(0.5),
  },
  bottomDeco: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: sw(40),
    gap: sw(12),
  },
  decoLine: {flex: 1, height: 1, backgroundColor: 'rgba(200, 168, 76, 0.4)'},
});

export default RegisterScreen;
