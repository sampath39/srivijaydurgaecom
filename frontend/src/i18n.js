import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav.home": "Home",
      "nav.products": "Products",
      "nav.orders": "Orders",
      "nav.login": "Login",
      "nav.search_placeholder": "Search for sarees...",
      "home.hero_title": "Authentic Kadi\nTextiles of India",
      "home.hero_subtitle": "Handspun. Handwoven. Handcrafted with love.",
      "home.shop_now": "Explore Collection",
      "home.categories": "Shop by Category",
      "home.categories_subtitle": "Discover our authentic collection of handcrafted textiles.",
      "home.visit_store": "Visit Our Store",
    }
  },
  te: {
    translation: {
      "nav.home": "హోమ్",
      "nav.products": "ఉత్పత్తులు",
      "nav.orders": "ఆర్డర్లు",
      "nav.login": "లాగిన్",
      "nav.search_placeholder": "చీరల కోసం వెతకండి...",
      "home.hero_title": "భారతదేశపు అసలైన\nఖాదీ వస్త్రాలు",
      "home.hero_subtitle": "చేనేత. ప్రేమతో తయారు చేయబడినవి.",
      "home.shop_now": "కలెక్షన్‌ను అన్వేషించండి",
      "home.categories": "కేటగిరీ ద్వారా షాపింగ్ చేయండి",
      "home.categories_subtitle": "చేతితో నేసిన వస్త్రాల మా అసలైన సేకరణను కనుగొనండి.",
      "home.visit_store": "మా స్టోర్ సందర్శించండి",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    }
  });

export default i18n;
