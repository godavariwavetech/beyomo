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

const STEPS = ['Personal Info', 'Location', 'Services'];

interface City {
  id: number;
  name: string;
  state: string;
  lat: number;
  lng: number;
  radius: number;
}

interface Service {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  basePrice: string;
  duration: number;
  category: {name: string; icon: string | null; image: string};
}

interface Category {
  id: number;
  name: string;
  services: Service[];
}

const RegisterScreen = ({navigation}: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<{uri: string; base64?: string} | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchCitiesAndServices();
  }, []);

  const fetchCitiesAndServices = async () => {
    try {
      setFetchingData(true);
      const [citiesRes, servicesRes] = await Promise.all([
        api.get(endpoints.CITIES),
        api.get(endpoints.SERVICES),
      ]);

      setCities(citiesRes.data?.data || []);

      const services = servicesRes.data?.data || [];
      const categoriesMap = new Map<number, Category>();

      services.forEach((service: Service) => {
        if (!categoriesMap.has(service.categoryId)) {
          categoriesMap.set(service.categoryId, {
            id: service.categoryId,
            name: service.category.name,
            services: [],
          });
        }
        categoriesMap.get(service.categoryId)!.services.push(service);
      });

      setCategories(Array.from(categoriesMap.values()));
    } catch (e: any) {
      Alert.alert('Error', 'Failed to load cities and services. Please try again.');
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
    setStep(s => s + 1);
  };

  const pickProfileImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: true,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', 'Failed to pick image');
          return;
        }
        if (response.assets?.[0]) {
          const asset = response.assets[0];
          setProfileImage({
            uri: asset.uri || '',
            base64: asset.base64,
          });
        }
      },
    );
  };

  const toggleService = (serviceId: number) => {
    const newServices = new Set(selectedServices);
    if (newServices.has(serviceId)) {
      newServices.delete(serviceId);
    } else {
      newServices.add(serviceId);
    }
    setSelectedServices(newServices);
  };

  const submit = async () => {
    if (selectedServices.size === 0) {
      Alert.alert('Required', 'Please select at least one service.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
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
        services: Array.from(selectedServices),
      };

      if (profileImage?.base64) {
        payload.profilePicture = `data:image/jpeg;base64,${profileImage.base64}`;
      }

      await api.patch(endpoints.PARTNER_PROFILE, payload);
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
          <Text style={styles.loaderText}>Loading services...</Text>
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
            {step === 0 ? (
              <>
                <View style={styles.cardTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="person-outline" size={sw(24)} color="#FDD77A" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Tell Us About You</Text>
                    <Text style={styles.cardSubtitle}>Step 1 of 3 · Personal Info</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Priya Sharma"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="priya@example.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Years of Experience</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 3"
                    placeholderTextColor="#9CA3AF"
                    value={experience}
                    onChangeText={setExperience}
                    keyboardType="number-pad"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Short Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tell customers about your skills and expertise…"
                    placeholderTextColor="#9CA3AF"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={3}
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Profile Picture</Text>
                  <TouchableOpacity
                    style={[styles.profileImageButton, profileImage && styles.profileImageSelected]}
                    onPress={pickProfileImage}>
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

                <TouchableOpacity
                  style={styles.btnWrapper}
                  activeOpacity={0.85}
                  onPress={nextStep}>
                  <LinearGradient
                    colors={['#E4BA69', '#FDD77A', '#E3BB67']}
                    style={styles.btn}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    <Text style={styles.btnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={sw(16)} color="#1a1a1a" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : step === 1 ? (
              <>
                <View style={styles.cardTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="location-outline" size={sw(24)} color="#FDD77A" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Your Location</Text>
                    <Text style={styles.cardSubtitle}>Step 2 of 3 · Service Area</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowCityPicker(true)}>
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
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Maharashtra"
                    placeholderTextColor="#9CA3AF"
                    value={state}
                    onChangeText={setState}
                    editable={false}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Area / Locality *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Andheri West"
                    placeholderTextColor="#9CA3AF"
                    value={address}
                    onChangeText={setAddress}
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(0)}>
                    <Ionicons name="arrow-back" size={sw(18)} color="#FDD77A" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnWrapper, styles.btnFlex]}
                    activeOpacity={0.85}
                    onPress={nextStep}>
                    <LinearGradient
                      colors={['#E4BA69', '#FDD77A', '#E3BB67']}
                      style={styles.btn}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}>
                      <Text style={styles.btnText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={sw(16)} color="#1a1a1a" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.cardTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="briefcase-outline" size={sw(24)} color="#FDD77A" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Your Services</Text>
                    <Text style={styles.cardSubtitle}>Step 3 of 3 · Select Services</Text>
                  </View>
                </View>

                <Text style={styles.servicesLabel}>Select the services you can provide *</Text>

                {categories.map(category => (
                  <View key={category.id} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    <View style={styles.servicesGrid}>
                      {category.services.map(service => (
                        <TouchableOpacity
                          key={service.id}
                          style={[
                            styles.serviceCard,
                            selectedServices.has(service.id) && styles.serviceCardSelected,
                          ]}
                          onPress={() => toggleService(service.id)}>
                          <View style={styles.serviceCheckbox}>
                            {selectedServices.has(service.id) && (
                              <Ionicons name="checkmark" size={sw(14)} color="#1a1a1a" />
                            )}
                          </View>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          <Text style={styles.servicePrice}>₹{service.basePrice}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={sw(16)} color="#FDD77A" />
                  <Text style={styles.infoText}>
                    Your account will be reviewed by our team. You'll be notified once approved.
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(1)}>
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
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    marginTop: sw(4),
  },
  taglineLine: {height: 1, width: sw(20), backgroundColor: '#C8A84C'},
  tagline: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: '#C8A84C',
    letterSpacing: sw(1.5),
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(24),
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
  },
  stepDot: {
    width: sw(28),
    height: sw(28),
    borderRadius: sw(14),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#FDD77A',
    borderColor: '#FDD77A',
  },
  stepNum: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
  },
  stepNumActive: {color: '#1a1a1a'},
  stepLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  stepLabelActive: {color: '#FDD77A', fontWeight: '700'},
  stepLine: {
    width: sw(32),
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: sw(6),
  },
  stepLineDone: {backgroundColor: '#FDD77A'},

  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: sw(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: sw(24),
    gap: sw(16),
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(14),
    marginBottom: sw(4),
  },
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
  cardTitle: {
    fontFamily: fonts.title,
    fontSize: sw(18),
    fontWeight: '700',
    color: '#FEFEFE',
  },
  cardSubtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.5)',
    marginTop: sw(2),
  },

  inputGroup: {gap: sw(6)},
  inputLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
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
  textArea: {
    height: sw(80),
    paddingTop: sw(12),
    textAlignVertical: 'top',
  },

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
  infoText: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.65)',
    lineHeight: sw(18),
  },

  btnWrapper: {borderRadius: sw(12), overflow: 'hidden', marginTop: sw(4)},
  btnFlex: {flex: 1},
  btn: {
    height: sw(52),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: sw(8),
  },
  btnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#1a1a1a',
  },

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
  backBtnText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#FDD77A',
    fontWeight: '600',
  },

  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: sw(16),
  },
  loaderText: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#FDD77A',
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#022723',
    borderTopLeftRadius: sw(20),
    borderTopRightRadius: sw(20),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sw(24),
    paddingVertical: sw(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#FEFEFE',
  },

  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sw(24),
    paddingVertical: sw(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cityItemSelected: {
    backgroundColor: 'rgba(253,215,122,0.08)',
  },
  cityName: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '600',
    color: '#FEFEFE',
  },
  cityState: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.5)',
    marginTop: sw(2),
  },

  cityPickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: sw(48),
    paddingHorizontal: sw(14),
  },
  cityPickerText: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#FEFEFE',
  },
  cityPickerPlaceholder: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#9CA3AF',
  },

  servicesLabel: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: sw(4),
  },
  categorySection: {
    marginVertical: sw(12),
  },
  categoryTitle: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#FDD77A',
    marginBottom: sw(10),
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sw(10),
  },
  serviceCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: sw(12),
    gap: sw(8),
    alignItems: 'flex-start',
  },
  serviceCardSelected: {
    backgroundColor: 'rgba(253,215,122,0.15)',
    borderColor: '#FDD77A',
  },
  serviceCheckbox: {
    width: sw(20),
    height: sw(20),
    borderRadius: sw(4),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  serviceName: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '600',
    color: '#FEFEFE',
    flexShrink: 1,
  },
  servicePrice: {
    fontFamily: fonts.title,
    fontSize: sw(11),
    fontWeight: '700',
    color: '#FDD77A',
  },

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
  profileImageSelected: {
    borderColor: '#FDD77A',
    borderStyle: 'solid',
  },
  profileImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: sw(10),
  },
  profileImageText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
});

export default RegisterScreen;
