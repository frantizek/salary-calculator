class i18n {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'es';
    this.translations = {};
    this.init();
  }

  async init() {
    await this.loadTranslations('es');
    await this.loadTranslations('en');
    this.setLanguage(this.currentLanguage);
  }

  async loadTranslations(lang) {
    try {
      const response = await fetch(`./locales/${lang}.json`);
      this.translations[lang] = await response.json();
    } catch (error) {
      console.error(`Error loading ${lang} translations:`, error);
    }
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
      this.updateUI();
    }
  }

  get(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }

  updateUI() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.get(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.get(key);
    });

    // Trigger custom event
    document.dispatchEvent(new Event('languageChanged'));
  }
}

// Initialize i18n globally
const i18nManager = new i18n();