import React, {useState, useEffect} from 'react';
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
  Modal,
  FlatList,
  Image,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {useDispatch} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import {refreshPartnerStatus} from '../../redux/reducers/auth';
import type {AppDispatch} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const STEPS = ['Personal Info', 'Location', 'Categories', 'Skills', 'Documents'];

interface City {
  id: number;
  name: string;
  state: string;
  lat: number;
  lng: number;
  radius: number;
}

interface Skill {
  id: number;
  name: string;
}

interface SkillCategory {
  id: number;
  name: string;
  skills: Skill[];
}

const RegisterScreen = ({navigation}: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Step 1 – Personal Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<{uri: string; base64?: string} | null>(null);

  // Step 2 – Location
  const [cityId, setCityId] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Data
  const [cities, setCities] = useState<City[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);

  // Step 3 – Categories (service categories)
  const [serviceCategories, setServiceCategories] = useState<{id: number; name: string; icon?: string}[]>([]);
  const [selectedServiceCategoryIds, setSelectedServiceCategoryIds] = useState<Set<number>>(new Set());

  // Step 4 – Skills (skill categories from Skills admin page)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());

  // Step 4 – Documents
  const [aadharImage, setAadharImage] = useState<{uri: string; base64?: string} | null>(null);
  const [agreementImage, setAgreementImage] = useState<{uri: string; base64?: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchingData(true);
      const [citiesRes, skillsRes, serviceCatsRes] = await Promise.all([
        api.get(endpoints.CITIES),
        api.get('/api/v1/skills/categories'),
        api.get('/api/v1/services/categories'),
      ]);
      setCities(citiesRes.data?.data || []);
      setSkillCategories(skillsRes.data?.data || []);
      setServiceCategories(serviceCatsRes.data?.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };

  const nextStep = () => {
    if (step === 0) {
      if (!name.trim()) {
        Alert.alert('Required', 'Please enter your full name.');
        return;
      }
    }
    if (step === 1) {
      if (!selectedCity) {
        Alert.alert('Required', 'Please select your city.');
        return;
      }
      if (!address.trim()) {
        Alert.alert('Required', 'Please enter your area/locality.');
        return;
      }
    }
    if (step === 2) {
      if (selectedServiceCategoryIds.size === 0) {
        Alert.alert('Required', 'Please select at least one service category.');
        return;
      }
    }
    if (step === 3) {
      if (selectedCategoryIds.size === 0) {
        Alert.alert('Required', 'Please select at least one skill.');
        return;
      }
    }
    setStep(s => s + 1);
  };

  const pickImage = (
    onPicked: (img: {uri: string; base64?: string}) => void,
  ) => {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.8, maxWidth: 1024, maxHeight: 1024, includeBase64: true},
      response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset) onPicked({uri: asset.uri || '', base64: asset.base64});
      },
    );
  };

  const toggleCategory = (catId: number) => {
    const next = new Set(selectedCategoryIds);
    next.has(catId) ? next.delete(catId) : next.add(catId);
    setSelectedCategoryIds(next);
  };

  const downloadAgreement = () => {
    const url = `${api.defaults.baseURL}/api/v1/partners/agreement.pdf`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open agreement. Please try again.'),
    );
  };

  const submit = async () => {
    if (!aadharImage) {
      Alert.alert('Required', 'Please upload your Aadhar card image.');
      return;
    }
    if (!agreementImage) {
      Alert.alert('Required', 'Please upload the signed agreement image.');
      return;
    }

    setLoading(true);
    try {
      // Update profile with skill categories
      const profilePayload: any = {
        name: name.trim(),
        email: email.trim() || undefined,
        experience: experience ? parseInt(experience, 10) : 0,
        bio: bio.trim() || undefined,
        cityId: selectedCity?.id,
        location: {
          city: selectedCity?.name,
          state: selectedCity?.state,
          address: address.trim(),
        },
        serviceCategoryIds: Array.from(selectedServiceCategoryIds),
        skillCategoryIds: Array.from(selectedCategoryIds),
      };
      if (profileImage?.base64) {
        profilePayload.profilePicture = `data:image/jpeg;base64,${profileImage.base64}`;
      }
      await api.patch(endpoints.PARTNER_PROFILE, profilePayload);

      // Upload documents
      const docsPayload: any = {};
      if (aadharImage?.base64) {
        docsPayload.aadhar = `data:image/jpeg;base64,${aadharImage.base64}`;
      }
      if (agreementImage?.base64) {
        docsPayload.agreement = `data:image/jpeg;base64,${agreementImage.base64}`;
      }
      await api.post(endpoints.PARTNER_DOCUMENTS || '/api/v1/partners/documents', docsPayload);

      await dispatch(refreshPartnerStatus());
      navigation.replace('AccountStatus');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <LinearGradient
        colors={['#0E5843', '#022723']}
        style={styles.container}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#FDD77A" />
          <Text style={styles.loaderText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0E5843', '#022723']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <Ionicons name="close" size={sw(24)} color="#FDD77A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cities}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.cityItem,
                    selectedCity?.id === item.id && styles.cityItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCity(item);
                    setCityId(item.id);
                    setState(item.state);
                    setShowCityPicker(false);
                  }}>
                  <View>
                    <Text style={styles.cityName}>{item.name}</Text>
                    <Text style={styles.cityState}>{item.state}</Text>
                  </View>
                  {selectedCity?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={sw(24)} color="#FDD77A" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>BEYOMO</Text>
            <View style={styles.taglineRow}>
              <View style={styles.taglineLine} />
              <Text style={styles.tagline}>PARTNER REGISTRATION</Text>
              <View style={styles.taglineLine} />
            </View>
          </View>

          {/* Step indicators */}
          <View style={styles.stepRow}>
            {STEPS.map((label, i) => (
              <View key={i} style={styles.stepItem}>
                <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                  {i < step ? (
                    <Ionicons name="checkmark" size={sw(12)} color="#1a1a1a" />
                  ) : (
                    <Text style={[styles.stepNum, i === step && styles.stepNumActive]}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
                )}
              </View>
            ))}
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* ── Step 1: Personal Info ── */}
            {step === 0 && (
              <>
                <View style={styles.cardTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="person-outline" size={sw(24)} color="#FDD77A" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Tell Us About You</Text>
                    <Text style={styles.cardSubtitle}>Step 1 of 4 · Personal Info</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Priya Sharma" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} returnKeyType="next" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput style={styles.input} placeholder="priya@example.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Years of Experience</Text>
                  <TextInput style={styles.input} placeholder="e.g. 3" placeholderTextColor="#9CA3AF" value={experience} onChangeText={setExperience} keyboardType="number-pad" returnKeyType="next" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Short Bio</Text>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Tell customers about your skills and expertise…" placeholderTextColor="#9CA3AF" value={bio} onChangeText={setBio} multiline numberOfLines={3} returnKeyType="done" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Profile Picture</Text>
                  <TouchableOpacity
                    style={[styles.profileImageButton, profileImage && styles.profileImageSelected]}
                    onPress={() => pickImage(setProfileImage)}>
                    {profileImage ? (
                      <Image source={{uri: profileImage.uri}} style={styles.profileImagePreview} />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={sw(32)} color="#FDD77A" />
                        <Text style={styles.profileImageText}>Tap to add profile picture</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.btnWrapper} activeOpacity={0.85} onPress={nextStep}>
                  <LinearGradient colors={['#E4BA69', '#FDD77A', '#E3BB67']} style={styles.btn} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                    <Text style={styles.btnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={sw(16)} color="#1a1a1a" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* ── Step 2: Location ── */}
            {step === 1 && (
              <>
                <View style={styles.cardTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="location-outline" size={sw(24)} color="#FDD77A" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Your Location</Text>
                    <Text style={styles.cardSubtitle}>Step 2 of 4 · Service Area</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TouchableOpacity style={styles.input} onPress={() => setShowCityPicker(true)}>
                    <View style={styles.cityPickerContent}>
                      <Text style={selectedCity ? styles.cityPickerText : styles.cityPickerPlaceholder}>
                        {selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : 'Select city'}
                      </Text>
                      <Ionicons name="chevron-down" size={sw(20)} color="#FDD77A" />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput style={styles.input} placeholder="e.g. Maharashtra" placeholderTextColor="#9CA3AF" value={state} onChangeText={setState} editable={false} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Area / Locality *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Andheri West" placeholderTextColor="#9CA3AF" value={address} onChangeText={setAddress} returnKeyType="done" />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => setStep(0)}>
                    <Ionicons name="arrow-back" size={sw(18)} color="#FDD77A" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnWrapper, styles.btnFlex]} activeOpacity={0.85} onPress={nextStep}>
                    <LinearGradient colors={['#E4BA69', '#FDD77A', '#E3BB67']} style={styles.btn} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                      <Text style={styles.btnText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={sw(16)} color="#1a1a1a" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Step 3: Service Categories ── */}
            {step === 2 && (
              <>
                <View style={styles.cardTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="grid-outline" size={sw(24)} color="#FDD77A" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Service Categories</Text>
                    <Text style={styles.cardSubtitle}>Step 3 of 5 · What you offer</Text>
                  </View>
                </View>

                <Text style={styles.servicesLabel}>
                  Select the service categories you work in *
                </Text>

                <View style={styles.categoriesGrid}>
                  {serviceCategories.map(cat => {
                    const sel = selectedServiceCategoryIds.has(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChip, sel && styles.categoryChipSelected]}
                        onPress={() => {
                          const next = new Set(selectedServiceCategoryIds);
                          sel ? next.delete(cat.id) : next.add(cat.id);
                          setSelectedServiceCategoryIds(next);
                        }}>
                        {sel && (
                          <Ionicons name="checkmark-circle" size={sw(16)} color="#1a1a1a" style={{marginRight: sw(4)}} />
                        )}
                        <Text style={[styles.categoryChipText, sel && styles.categoryChipTextSelected]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedServiceCategoryIds.size > 0 && (
                  <View style={styles.infoBox}>
                    <Ionicons name="checkmark-circle-outline" size={sw(16)} color="#FDD77A" />
                    <Text style={styles.infoText}>
                      {selectedServiceCategoryIds.size} categor{selectedServiceCategoryIds.size === 1 ? 'y' : 'ies'} selected
                    </Text>
                  </View>
                )}

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => setStep(1)}>
                    <Ionicons name="arrow-back" size={sw(18)} color="#FDD77A" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnWrapper, styles.btnFlex]} activeOpacity={0.85} onPress={nextStep}>
                    <LinearGradient colors={['#E4BA69', '#FDD77A', '#E3BB67']} style={styles.btn} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                      <Text style={styles.btnText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={sw(16)} color="#1a1a1a" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Step 4: Skill Categories ── */}
            {step === 3 && (
              <>
                <View style={styles.cardTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="briefcase-outline" size={sw(24)} color="#FDD77A" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Your Skills</Text>
                    <Text style={styles.cardSubtitle}>Step 4 of 5 · Select Skills</Text>
                  </View>
                </View>

                <Text style={styles.servicesLabel}>
                  Select all skill areas you specialise in *
                </Text>

                <View style={styles.categoriesGrid}>
                  {skillCategories.map(cat => {
                    const sel = selectedCategoryIds.has(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChip, sel && styles.categoryChipSelected]}
                        onPress={() => toggleCategory(cat.id)}>
                        {sel && (
                          <Ionicons name="checkmark-circle" size={sw(16)} color="#1a1a1a" style={{marginRight: sw(4)}} />
                        )}
                        <Text style={[styles.categoryChipText, sel && styles.categoryChipTextSelected]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedCategoryIds.size > 0 && (
                  <View style={styles.infoBox}>
                    <Ionicons name="checkmark-circle-outline" size={sw(16)} color="#FDD77A" />
                    <Text style={styles.infoText}>
                      {selectedCategoryIds.size} skill{selectedCategoryIds.size === 1 ? '' : 's'} selected
                    </Text>
                  </View>
                )}

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => setStep(2)}>
                    <Ionicons name="arrow-back" size={sw(18)} color="#FDD77A" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnWrapper, styles.btnFlex]} activeOpacity={0.85} onPress={nextStep}>
                    <LinearGradient colors={['#E4BA69', '#FDD77A', '#E3BB67']} style={styles.btn} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                      <Text style={styles.btnText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={sw(16)} color="#1a1a1a" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Step 5: Documents ── */}
            {step === 4 && (
              <>
                <View style={styles.cardTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="document-text-outline" size={sw(24)} color="#FDD77A" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Documents</Text>
                    <Text style={styles.cardSubtitle}>Step 5 of 5 · Verification</Text>
                  </View>
                </View>

                {/* Agreement section */}
                <View style={styles.agreementBox}>
                  <View style={styles.agreementHeader}>
                    <Ionicons name="shield-checkmark-outline" size={sw(20)} color="#FDD77A" />
                    <Text style={styles.agreementTitle}>Partner Agreement</Text>
                  </View>
                  <Text style={styles.agreementDesc}>
                    Download the agreement, sign it, and upload a photo of the signed document.
                  </Text>
                  <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.8} onPress={downloadAgreement}>
                    <Ionicons name="download-outline" size={sw(18)} color="#1a1a1a" />
                    <Text style={styles.downloadBtnText}>Download Agreement PDF</Text>
                  </TouchableOpacity>
                </View>

                {/* Upload signed agreement */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Upload Signed Agreement *</Text>
                  <TouchableOpacity
                    style={[styles.docUploadBtn, agreementImage && styles.docUploadSelected]}
                    onPress={() => pickImage(setAgreementImage)}>
                    {agreementImage ? (
                      <Image source={{uri: agreementImage.uri}} style={styles.docImagePreview} />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={sw(28)} color="#FDD77A" />
                        <Text style={styles.docUploadText}>Tap to upload signed agreement</Text>
                        <Text style={styles.docUploadHint}>Photo of signed agreement document</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Upload Aadhar */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Upload Aadhar Card *</Text>
                  <TouchableOpacity
                    style={[styles.docUploadBtn, aadharImage && styles.docUploadSelected]}
                    onPress={() => pickImage(setAadharImage)}>
                    {aadharImage ? (
                      <Image source={{uri: aadharImage.uri}} style={styles.docImagePreview} />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={sw(28)} color="#FDD77A" />
                        <Text style={styles.docUploadText}>Tap to upload Aadhar card</Text>
                        <Text style={styles.docUploadHint}>Front side of your Aadhar card</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={sw(16)} color="#FDD77A" />
                  <Text style={styles.infoText}>
                    Your account will be reviewed by our team. You'll be notified once approved.
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => setStep(3)}>
                    <Ionicons name="arrow-back" size={sw(18)} color="#FDD77A" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnWrapper, styles.btnFlex]}
                    activeOpacity={0.85}
                    onPress={submit}
                    disabled={loading}>
                    <LinearGradient
                      colors={loading ? ['#888', '#888'] : ['#E4BA69', '#FDD77A', '#E3BB67']}
                      style={styles.btn}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}>
                      {loading ? (
                        <ActivityIndicator color="#1a1a1a" />
                      ) : (
                        <>
                          <Text style={styles.btnText}>Submit Application</Text>
                          <Ionicons name="checkmark-circle" size={sw(16)} color="#1a1a1a" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

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
    paddingHorizontal: sw(24),
    paddingTop: sw(60),
    paddingBottom: sw(40),
  },

  header: {alignItems: 'center', marginBottom: sw(28)},
  appName: {
    fontFamily: fonts.title,
    fontSize: sw(36),
    fontWeight: '700',
    color: '#FEFEFE',
    letterSpacing: sw(4),
  },
  taglineRow: {flexDirection: 'row', alignItems: 'center', gap: sw(8), marginTop: sw(4)},
  taglineLine: {height: 1, width: sw(20), backgroundColor: '#C8A84C'},
  tagline: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#C8A84C', letterSpacing: sw(1.5)},

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(24),
    gap: 0,
  },
  stepItem: {flexDirection: 'row', alignItems: 'center', gap: sw(4)},
  stepDot: {
    width: sw(24),
    height: sw(24),
    borderRadius: sw(12),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {backgroundColor: '#FDD77A', borderColor: '#FDD77A'},
  stepNum: {fontFamily: fonts.title, fontSize: sw(11), color: 'rgba(255,255,255,0.5)', fontWeight: '700'},
  stepNumActive: {color: '#1a1a1a'},
  stepLabel: {fontFamily: fonts.textFont, fontSize: sw(9), color: 'rgba(255,255,255,0.45)', fontWeight: '500'},
  stepLabelActive: {color: '#FDD77A', fontWeight: '700'},
  stepLine: {width: sw(20), height: 1.5, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: sw(3)},
  stepLineDone: {backgroundColor: '#FDD77A'},

  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: sw(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: sw(24),
    gap: sw(16),
  },

  cardTitleRow: {flexDirection: 'row', alignItems: 'center', gap: sw(14), marginBottom: sw(4)},
  iconCircle: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(24),
    backgroundColor: 'rgba(253,215,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253,215,122,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardTitle: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#FEFEFE'},
  cardSubtitle: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.5)', marginTop: sw(2)},

  inputGroup: {gap: sw(6)},
  inputLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.65)', fontWeight: '600', letterSpacing: 0.3},
  input: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    height: sw(48),
    paddingHorizontal: sw(14),
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#FEFEFE',
  },
  textArea: {height: sw(80), paddingTop: sw(12), textAlignVertical: 'top'},

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(8),
    backgroundColor: 'rgba(253,215,122,0.08)',
    borderRadius: sw(10),
    borderWidth: 1,
    borderColor: 'rgba(253,215,122,0.2)',
    padding: sw(12),
  },
  infoText: {flex: 1, fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.65)', lineHeight: sw(18)},

  btnWrapper: {borderRadius: sw(12), overflow: 'hidden', marginTop: sw(4)},
  btnFlex: {flex: 1},
  btn: {height: sw(52), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: sw(8)},
  btnText: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#1a1a1a'},

  btnRow: {flexDirection: 'row', gap: sw(10), alignItems: 'center'},
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    paddingVertical: sw(14),
    paddingHorizontal: sw(12),
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backBtnText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FDD77A', fontWeight: '600'},

  centerLoader: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: sw(16)},
  loaderText: {fontFamily: fonts.textFont, fontSize: sw(14), color: '#FDD77A', fontWeight: '600'},

  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalContent: {backgroundColor: '#022723', borderTopLeftRadius: sw(20), borderTopRightRadius: sw(20), maxHeight: '80%'},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sw(24),
    paddingVertical: sw(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#FEFEFE'},

  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sw(24),
    paddingVertical: sw(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cityItemSelected: {backgroundColor: 'rgba(253,215,122,0.08)'},
  cityName: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '600', color: '#FEFEFE'},
  cityState: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.5)', marginTop: sw(2)},

  cityPickerContent: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: sw(48), paddingHorizontal: sw(14)},
  cityPickerText: {fontFamily: fonts.textFont, fontSize: sw(14), color: '#FEFEFE'},
  cityPickerPlaceholder: {fontFamily: fonts.textFont, fontSize: sw(14), color: '#9CA3AF'},

  servicesLabel: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: sw(4)},

  // Category grid (step 3)
  categoriesGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: sw(10)},
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sw(14),
    paddingVertical: sw(10),
    borderRadius: sw(20),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryChipSelected: {
    backgroundColor: '#FDD77A',
    borderColor: '#FDD77A',
  },
  categoryChipText: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '600', color: '#FEFEFE'},
  categoryChipTextSelected: {color: '#1a1a1a'},
  categoryChipCount: {fontFamily: fonts.textFont, fontSize: sw(11), color: 'rgba(255,255,255,0.5)'},
  categoryChipCountSelected: {color: 'rgba(26,26,26,0.6)'},

  // Profile image (step 1)
  profileImageButton: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: sw(12),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    borderStyle: 'dashed',
    height: sw(120),
    justifyContent: 'center',
    alignItems: 'center',
    gap: sw(8),
  },
  profileImageSelected: {borderColor: '#FDD77A', borderStyle: 'solid'},
  profileImagePreview: {width: '100%', height: '100%', borderRadius: sw(10)},
  profileImageText: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.65)', textAlign: 'center'},

  // Agreement box (step 4)
  agreementBox: {
    backgroundColor: 'rgba(253,215,122,0.06)',
    borderRadius: sw(14),
    borderWidth: 1,
    borderColor: 'rgba(253,215,122,0.25)',
    padding: sw(16),
    gap: sw(10),
  },
  agreementHeader: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  agreementTitle: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#FDD77A'},
  agreementDesc: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.65)', lineHeight: sw(18)},
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
    backgroundColor: '#FDD77A',
    borderRadius: sw(10),
    paddingVertical: sw(12),
  },
  downloadBtnText: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#1a1a1a'},

  // Document upload (step 4)
  docUploadBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: sw(12),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    borderStyle: 'dashed',
    height: sw(130),
    justifyContent: 'center',
    alignItems: 'center',
    gap: sw(6),
  },
  docUploadSelected: {borderColor: '#FDD77A', borderStyle: 'solid'},
  docImagePreview: {width: '100%', height: '100%', borderRadius: sw(10)},
  docUploadText: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '600', color: 'rgba(255,255,255,0.8)'},
  docUploadHint: {fontFamily: fonts.textFont, fontSize: sw(11), color: 'rgba(255,255,255,0.45)'},
});

export default RegisterScreen;
