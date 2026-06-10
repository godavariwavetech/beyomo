import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

type FAQ = {id: string; q: string; a: string};

const FAQS: FAQ[] = [
  {id: '1', q: 'How do I reschedule a booking?', a: 'Go to My Bookings → select the booking → tap Reschedule. You can reschedule up to 4 hours before the appointment.'},
  {id: '2', q: 'Can I cancel my booking?', a: 'Yes, you can cancel from My Bookings. Cancellations made 2+ hours in advance are eligible for a full refund as Beyomo credits.'},
  {id: '3', q: 'How long does it take to get a refund?', a: 'Refunds are processed within 5–7 business days to your original payment method, or instantly to your Beyomo wallet.'},
  {id: '4', q: 'Are the beauty experts verified?', a: 'Yes, all Beyomo experts are trained, background-checked, and have undergone a 50-hour certification programme.'},
  {id: '5', q: 'What safety measures are followed?', a: 'All experts carry sanitised kits, wear gloves, and follow strict hygiene protocols during every session.'},
  {id: '6', q: 'How do I apply a coupon code?', a: 'On the checkout screen, tap "Add Coupon" and enter your code. Applicable discounts will be applied automatically.'},
];

const CONTACT = [
  {id: 'call', icon: 'call-outline', label: 'Call Us', value: '+91 9876543210', action: () => Linking.openURL('tel:+919876543210')},
  {id: 'email', icon: 'mail-outline', label: 'Email Us', value: 'support@beyomo.com', action: () => Linking.openURL('mailto:support@beyomo.com')},
  {id: 'whatsapp', icon: 'logo-whatsapp', label: 'WhatsApp', value: 'Chat with us', action: () => Linking.openURL('https://wa.me/919876543210')},
];

const HelpSupportScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId(prev => (prev === id ? null : id));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEDED" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#000000" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(24)}]}>

        {/* Contact options */}
        <Text style={styles.sectionLabel}>Contact Us</Text>
        <View style={styles.contactCard}>
          {CONTACT.map((c, idx) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.contactRow, idx < CONTACT.length - 1 && styles.contactRowBorder]}
              activeOpacity={0.7}
              onPress={c.action}>
              <View style={styles.contactIconWrap}>
                <Ionicons name={c.icon as any} size={sw(20)} color="#105641" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.contactLabel}>{c.label}</Text>
                <Text style={styles.contactValue}>{c.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={sw(16)} color="#C5C5C5" />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={styles.faqCard}>
          {FAQS.map((faq, idx) => {
            const isOpen = expandedId === faq.id;
            return (
              <TouchableOpacity
                key={faq.id}
                style={[styles.faqRow, idx < FAQS.length - 1 && styles.faqRowBorder]}
                activeOpacity={0.7}
                onPress={() => toggle(faq.id)}>
                <View style={styles.faqQuestion}>
                  <Text style={styles.faqQ}>{faq.q}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={sw(16)}
                    color="#5C5C5C"
                  />
                </View>
                {isOpen && <Text style={styles.faqA}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
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
    paddingBottom: sw(12),
    backgroundColor: '#EEEDED',
  },
  titleBlock: {alignItems: 'center', gap: sw(6)},
  headerTitle: {fontFamily: fonts.primary, fontSize: sw(20), fontWeight: '400', color: '#012823'},
  titleUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},

  scroll: {paddingHorizontal: sw(16), paddingTop: sw(8), gap: sw(12)},
  sectionLabel: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '700', color: '#373737'},

  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
    padding: sw(14),
  },
  contactRowBorder: {borderBottomWidth: 1, borderBottomColor: '#F0F0F0'},
  contactIconWrap: {
    width: sw(40),
    height: sw(40),
    borderRadius: sw(20),
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '600', color: '#171816'},
  contactValue: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565'},

  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  faqRow: {padding: sw(14), gap: sw(8)},
  faqRowBorder: {borderBottomWidth: 1, borderBottomColor: '#F0F0F0'},
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sw(12),
  },
  faqQ: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#171816',
    flex: 1,
    lineHeight: sw(19),
  },
  faqA: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#656565',
    lineHeight: sw(19),
    paddingTop: sw(4),
  },
});

export default HelpSupportScreen;
