import I18n from 'i18n-js';
import * as RNLocalize from 'react-native-localize';
import en from './locales/en';

const locales = RNLocalize.getLocales();

if (Array.isArray(locales)) {
  I18n.locale = locales[0].languageTag;
}

/**
 * i18n fallback precedence example
 * nb-NO -> nb -> en
 */
I18n.fallbacks = true;

/**
 ----- NOTE -----
 App Side,
 Currently only english is supported.
 That means, even if device locale is different from 'en', all the texts in mobile id will appear in english.
 In order to support other languages:
 1. translate texts in the corresponding files under ./locales directory
 2. import the translation file in this file (see how it is done for english)
 3. add to the list of I18n.translations below
 */
I18n.translations = {
  en,
};

export default I18n;
