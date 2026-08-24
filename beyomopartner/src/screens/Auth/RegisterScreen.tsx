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
  Modal,
  FlatList,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import {refreshPartnerStatus} from '../../redux/reducers/auth';
import type {AppDispatch} from '../../redux/store';
import {useAppAlert} from '../../hooks/useAppAlert';
import AppAlertModal from '../../components/AppAlertModal/AppAlertModal';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const STEPS = ['Personal Info', 'Location'];

// Matches the fixed profession list on the website's "Join Now" form exactly
const PROFESSIONS = ['Beautician', 'Female Hairdresser', 'Men Hairdresser', 'Makeup Artist', 'Mehendi Artist', 'Spa Therapist', 'Aesthetician', 'Nail Artist'];

interface City {
  id: number;
  name: string;
  state: string;
  lat: number;
  lng: number;
  radius: number;
}

const RegisterScreen = ({navigation}: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Step 1 – Personal Info (same fields as the website's "Join Now" form)
  const [name, setName] = useState('');
  const [professions, setProfessions] = useState<Set<string>>(new Set());
  const [otherProfession, setOtherProfession] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [homeServicesConsent, setHomeServicesConsent] = useState(false);

  // Step 2 – Location
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const {alertConfig, showAlert, hideAlert} = useAppAlert();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchingData(true);
      const citiesRes = await api.get(endpoints.CITIES);
      setCities(citiesRes.data?.data || []);
    } catch {
      showAlert('Error', 'Failed to load data. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };

  const nextStep = () => {
    if (step === 0) {
      if (!name.trim()) {
        showAlert('Required', 'Please enter your full name.');
        return;
      }
      if (!homeServicesConsent) {
        showAlert('Required', 'Please confirm you are comfortable for Home Services.');
        return;
      }
      if (professions.has('others') && !otherProfession.trim()) {
        showAlert('Required', 'Please specify your profession.');
        return;
      }
    }
    setStep(s => s + 1);
  };

  const submit = async () => {
    if (!selectedCity) {
      showAlert('Required', 'Please select your city.');
      return;
    }

    setLoading(true);
    try {
      const profilePayload: any = {
        name: name.trim(),
        cityId: selectedCity.id,
        location: {
          city: selectedCity.name,
          state: selectedCity.state,
        },
        professions: professions.has('others')
          ? [...Array.from(professions).filter(p => p !== 'others'), otherProfession.trim()]
          : Array.from(professions),
        gender,
        homeServicesConsent,
      };
      await api.patch(endpoints.PARTNER_PROFILE, profilePayload);

      await dispatch(refreshPartnerStatus());
      navigation.replace('AccountStatus');
    } catch (e: any) {
      showAlert('Error', e.response?.data?.message ?? 'Something went wrong. Please try again.');
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
            <Image
              source={require('../../assets/beyomo_logo_icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
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
                    <Text style={styles.cardSubtitle}>Step 1 of 2 · Personal Info</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Priya Sharma" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} returnKeyType="next" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>What is Your Profession?</Text>
                  <View style={styles.categoriesGrid}>
                    {PROFESSIONS.map(profession => {
                      const sel = professions.has(profession);
                      return (
                        <TouchableOpacity
                          key={profession}
                          style={[styles.categoryChip, sel && styles.categoryChipSelected]}
                          onPress={() => {
                            const next = new Set(professions);
                            sel ? next.delete(profession) : next.add(profession);
                            setProfessions(next);
                          }}>
                          {sel && (
                            <Ionicons name="checkmark-circle" size={sw(16)} color="#1a1a1a" style={{marginRight: sw(4)}} />
                          )}
                          <Text style={[styles.categoryChipText, sel && styles.categoryChipTextSelected]}>
                            {profession}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {(() => {
                      const sel = professions.has('others');
                      return (
                        <TouchableOpacity
                          style={[styles.categoryChip, sel && styles.categoryChipSelected]}
                          onPress={() => {
                            const next = new Set(professions);
                            if (sel) {
                              next.delete('others');
                              setOtherProfession('');
                            } else {
                              next.add('others');
                            }
                            setProfessions(next);
                          }}>
                          {sel && (
                            <Ionicons name="checkmark-circle" size={sw(16)} color="#1a1a1a" style={{marginRight: sw(4)}} />
                          )}
                          <Text style={[styles.categoryChipText, sel && styles.categoryChipTextSelected]}>
                            Others
                          </Text>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                  {professions.has('others') && (
                    <TextInput
                      style={styles.input}
                      placeholder="Please specify your profession"
                      placeholderTextColor="#9CA3AF"
                      value={otherProfession}
                      onChangeText={setOtherProfession}
                      returnKeyType="next"
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Gender</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity style={styles.genderOption} activeOpacity={0.7} onPress={() => setGender('female')}>
                      <Ionicons name={gender === 'female' ? 'radio-button-on' : 'radio-button-off'} size={sw(20)} color="#FDD77A" />
                      <Text style={styles.genderOptionText}>Female</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.genderOption} activeOpacity={0.7} onPress={() => setGender('male')}>
                      <Ionicons name={gender === 'male' ? 'radio-button-on' : 'radio-button-off'} size={sw(20)} color="#FDD77A" />
                      <Text style={styles.genderOptionText}>Male</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.consentRow}
                  activeOpacity={0.7}
                  onPress={() => setHomeServicesConsent(!homeServicesConsent)}>
                  <Ionicons name={homeServicesConsent ? 'checkbox' : 'square-outline'} size={sw(20)} color="#FDD77A" />
                  <Text style={styles.consentText}>I am comfortable for Home Services *</Text>
                </TouchableOpacity>

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
                    <Text style={styles.cardSubtitle}>Step 2 of 2 · Service Area</Text>
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

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={sw(16)} color="#FDD77A" />
                  <Text style={styles.infoText}>
                    Your account will be reviewed by our team. You'll be notified once approved.
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => setStep(0)}>
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

      <AppAlertModal config={alertConfig} onRequestClose={hideAlert} />
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
  logo: {
    width: sw(180),
    height: sw(180 * (196 / 499)),
    marginBottom: sw(4),
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
  genderRow: {flexDirection: 'row', gap: sw(20)},
  genderOption: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  genderOptionText: {fontFamily: fonts.textFont, fontSize: sw(14), color: '#FEFEFE'},
  consentRow: {flexDirection: 'row', alignItems: 'center', gap: sw(10), paddingVertical: sw(4)},
  consentText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FEFEFE', flex: 1},
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

  // Profession checkboxes (step 1)
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
});

export default RegisterScreen;
