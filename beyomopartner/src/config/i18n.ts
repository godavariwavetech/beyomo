import {I18n} from 'i18n-js';
import en from './locales/en';
import fr from './locales/fr';
import hi from './locales/hi';

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';

const i18n = new I18n();
i18n.locale = 'en';
i18n.enableFallback = false;
i18n.translations = {en, fr, hi};
i18n.missingTranslation.get = text => `${text}`;

export const translate = (text: string) => i18n.t(text);

export const setAppLanguage = async (local: string) => {
  console.log('setAppLanguage: local ', local)
  if (local) {
    i18n.locale = local;
  }
  // const selectedLanguage = await AsyncStorage.getItem('SelectedLanguage');
  // if (selectedLanguage) {
  //   i18n.locale = selectedLanguage;
  // }
};

export const setCurrentLanguage = async (local: string = 'en') => {
  console.log('LOCAL: ', local)
  await AsyncStorage.setItem('SelectedLanguage', local);
  RNRestart.restart();
};

// To add extra language add local entry in this array
export const getAvailableLocales = () => ['en', 'hi'];

export default i18n;
