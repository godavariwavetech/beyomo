import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

export interface AppAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AppAlertConfig {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
}

interface Props {
  config: AppAlertConfig | null;
  onRequestClose: () => void;
}

const AppAlertModal = ({config, onRequestClose}: Props) => {
  if (!config) return null;
  const buttons: AppAlertButton[] = config.buttons?.length ? config.buttons : [{text: 'OK'}];
  const stacked = buttons.length > 2;

  const handlePress = (btn: AppAlertButton) => {
    onRequestClose();
    btn.onPress?.();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onRequestClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{config.title}</Text>
          {!!config.message && <Text style={styles.message}>{config.message}</Text>}
          <View style={[styles.btnRow, stacked && styles.btnColumn]}>
            {buttons.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.btn,
                  btn.style === 'destructive' ? styles.btnDestructive
                    : btn.style === 'cancel' ? styles.btnCancel
                    : styles.btnDefault,
                  stacked && styles.btnStacked,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePress(btn)}>
                <Text
                  style={[
                    styles.btnText,
                    btn.style === 'destructive' && styles.btnTextDestructive,
                    btn.style === 'cancel' && styles.btnTextCancel,
                  ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(1,40,35,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(28),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: sw(16),
    padding: sw(20),
    gap: sw(8),
  },
  title: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#171816',
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#5C5C5C',
    textAlign: 'center',
    lineHeight: sw(19),
    marginTop: sw(2),
  },
  btnRow: {
    flexDirection: 'row',
    gap: sw(10),
    marginTop: sw(16),
  },
  btnColumn: {
    flexDirection: 'column',
  },
  btn: {
    flex: 1,
    height: sw(44),
    borderRadius: sw(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnStacked: {
    flex: undefined,
    width: '100%',
  },
  btnDefault: {
    backgroundColor: '#105641',
  },
  btnCancel: {
    backgroundColor: '#F0F0F0',
  },
  btnDestructive: {
    backgroundColor: '#FEEAEA',
  },
  btnText: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnTextCancel: {
    color: '#5C5C5C',
  },
  btnTextDestructive: {
    color: '#DB1919',
  },
});

export default AppAlertModal;
