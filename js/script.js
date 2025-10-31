class SalaryCalculator {
  constructor() {
    this.salary = document.getElementById('salary');
    this.exchangeRate = document.getElementById('exchangeRate');
    this.hoursRadios = document.querySelectorAll('input[name="hours"]');
    this.calculateBtn = document.getElementById('calculateBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.themeToggle = document.getElementById('themeToggle');
    this.languageSelect = document.getElementById('languageSelect');
    this.resultsSection = document.getElementById('resultsSection');
    
    this.init();
  }

  init() {
    this.setupTheme();
    this.attachEventListeners();
    this.loadSavedData();
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateThemeButton(isDark);
  }

  updateThemeButton(isDark) {
    const icon = this.themeToggle.querySelector('.icon');
    icon.textContent = isDark ? '☀️' : '🌙';
  }

  attachEventListeners() {
    this.calculateBtn.addEventListener('click', () => this.calculate());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.languageSelect.addEventListener('change', (e) => {
      i18nManager.setLanguage(e.target.value);
      this.languageSelect.value = i18nManager.currentLanguage;
    });

    // Allow Enter key to calculate
    this.salary.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.calculate();
    });
    this.exchangeRate.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.calculate();
    });

    // Save data on input
    this.salary.addEventListener('change', () => this.saveData());
    this.exchangeRate.addEventListener('change', () => this.saveData());

    // Update theme button text when language changes
    document.addEventListener('languageChanged', () => {
      this.updateLanguageSelectValue();
    });
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  saveData() {
    const data = {
      salary: this.salary.value,
      exchangeRate: this.exchangeRate.value,
      hours: document.querySelector('input[name="hours"]:checked').value
    };
    localStorage.setItem('calculatorData', JSON.stringify(data));
  }

  loadSavedData() {
    const saved = localStorage.getItem('calculatorData');
    if (saved) {
      const data = JSON.parse(saved);
      this.salary.value = data.salary || '';
      this.exchangeRate.value = data.exchangeRate || '';
      document.querySelector(`input[name="hours"][value="${data.hours}"]`).checked = true;
    }
  }

  validate() {
    const salary = parseFloat(this.salary.value);
    const exchange = parseFloat(this.exchangeRate.value);

    let isValid = true;

    // Validate salary
    if (!salary || salary <= 0 || isNaN(salary)) {
      this.showError('salaryError', 'errors.invalidSalary');
      isValid = false;
    } else {
      this.clearError('salaryError');
    }

    // Validate exchange rate
    if (!exchange || exchange <= 0 || isNaN(exchange)) {
      this.showError('exchangeError', 'errors.invalidExchange');
      isValid = false;
    } else {
      this.clearError('exchangeError');
    }

    return isValid;
  }

  showError(elementId, i18nKey) {
    const element = document.getElementById(elementId);
    element.textContent = i18nManager.get(i18nKey);
    element.style.display = 'block';
  }

  clearError(elementId) {
    const element = document.getElementById(elementId);
    element.textContent = '';
    element.style.display = 'none';
  }

  calculate() {
    if (!this.validate()) return;

    const salary = parseFloat(this.salary.value);
    const exchangeRate = parseFloat(this.exchangeRate.value);
    const hours = parseInt(document.querySelector('input[name="hours"]:checked').value);

    // Calculate working hours per month (assuming 4.33 weeks per month average)
    const weeklyHours = hours;
    const monthlyHours = weeklyHours * 4.33;

    // Calculate hourly rate in MXN
    const hourlyMXN = salary / monthlyHours;

    // Calculate hourly rate in USD
    const hourlyUSD = hourlyMXN / exchangeRate;

    // Calculate daily rate (8 hours)
    const dailyMXN = hourlyMXN * 8;
    const dailyUSD = hourlyUSD * 8;

    // Calculate weekly rate
    const weeklyMXN = hourlyMXN * weeklyHours;
    const weeklyUSD = hourlyUSD * weeklyHours;

    // Display results
    document.getElementById('mxnHourly').textContent = this.formatCurrency(hourlyMXN, 2);
    document.getElementById('mxnDaily').textContent = this.formatCurrency(dailyMXN, 2);
    document.getElementById('mxnWeekly').textContent = this.formatCurrency(weeklyMXN, 2);

    document.getElementById('usdHourly').textContent = this.formatCurrency(hourlyUSD, 2);
    document.getElementById('usdDaily').textContent = this.formatCurrency(dailyUSD, 2);
    document.getElementById('usdWeekly').textContent = this.formatCurrency(weeklyUSD, 2);

    // Show results section
    this.resultsSection.classList.remove('hidden');
    this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    this.saveData();
  }

  formatCurrency(value, decimals = 2) {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  reset() {
    this.salary.value = '';
    this.exchangeRate.value = '';
    document.querySelector('input[name="hours"][value="40"]').checked = true;
    this.resultsSection.classList.add('hidden');
    this.clearError('salaryError');
    this.clearError('exchangeError');
    localStorage.removeItem('calculatorData');
  }

  updateLanguageSelectValue() {
    this.languageSelect.value = i18nManager.currentLanguage;
  }
}

// Initialize calculator when i18n is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for i18n to load
  setTimeout(() => {
    const calculator = new SalaryCalculator();
  }, 500);
});