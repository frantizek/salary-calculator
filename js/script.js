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

    const monthlySalary = parseFloat(this.salary.value);
    const exchangeRate = parseFloat(this.exchangeRate.value);
    const hoursPerWeek = parseInt(document.querySelector('input[name="hours"]:checked').value);

    // Calculate all salary periods
    // Base: 4.33 weeks per month average, 5 work days per week, 8 hours per day
    const hoursPerMonth = hoursPerWeek * 4.33;
    const hourlyRateMXN = monthlySalary / hoursPerMonth;
    const hourlyRateUSD = hourlyRateMXN / exchangeRate;

    // Build table data - SORTED BY TIME PERIOD (shortest to longest)
    const tableData = [
      {
        label: 'results.hourly',
        mxn: hourlyRateMXN,
        usd: hourlyRateUSD,
        order: 1
      },
      {
        label: 'results.daily',
        mxn: hourlyRateMXN * 8,
        usd: (hourlyRateMXN * 8) / exchangeRate,
        order: 2
      },
      {
        label: 'results.weekly',
        mxn: hourlyRateMXN * hoursPerWeek,
        usd: (hourlyRateMXN * hoursPerWeek) / exchangeRate,
        order: 3
      },
      {
        label: 'results.biweekly',
        mxn: monthlySalary / 2,
        usd: monthlySalary / 2 / exchangeRate,
        order: 4
      },
      {
        label: 'results.monthly',
        mxn: monthlySalary,
        usd: monthlySalary / exchangeRate,
        order: 5
      },
      {
        label: 'results.bimonthly',
        mxn: monthlySalary * 2,
        usd: (monthlySalary * 2) / exchangeRate,
        order: 6
      },
      {
        label: 'results.quarterly',
        mxn: monthlySalary * 3,
        usd: (monthlySalary * 3) / exchangeRate,
        order: 7
      },
      {
        label: 'results.semiannual',
        mxn: monthlySalary * 6,
        usd: (monthlySalary * 6) / exchangeRate,
        order: 8
      },
      {
        label: 'results.annual',
        mxn: monthlySalary * 12,
        usd: (monthlySalary * 12) / exchangeRate,
        order: 9
      }
    ];

    // Sort by order (already in correct order, but explicit for clarity)
    tableData.sort((a, b) => a.order - b.order);

    // Render table
    this.renderResultsTable(tableData);

    // Show results section
    this.resultsSection.classList.remove('hidden');
    this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    this.saveData();
  }

  renderResultsTable(data) {
    const tableContainer = document.getElementById('resultsTableContainer');
    tableContainer.innerHTML = '';

    // Create table
    const table = document.createElement('table');
    table.className = 'results-table';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headerLabel = document.createElement('th');
    headerLabel.setAttribute('data-i18n', 'results.parameter');
    headerLabel.textContent = i18nManager.get('results.parameter');
    headerRow.appendChild(headerLabel);

    const headerMXN = document.createElement('th');
    headerMXN.setAttribute('data-i18n', 'results.valueMXN');
    headerMXN.textContent = i18nManager.get('results.valueMXN');
    headerRow.appendChild(headerMXN);

    const headerUSD = document.createElement('th');
    headerUSD.setAttribute('data-i18n', 'results.valueUSD');
    headerUSD.textContent = i18nManager.get('results.valueUSD');
    headerRow.appendChild(headerUSD);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    data.forEach((item, index) => {
      const row = document.createElement('tr');
      if (index % 2 === 0) {
        row.classList.add('striped');
      }

      const labelCell = document.createElement('td');
      labelCell.setAttribute('data-i18n', item.label);
      labelCell.textContent = i18nManager.get(item.label);
      labelCell.classList.add('label-cell');
      row.appendChild(labelCell);

      const mxnCell = document.createElement('td');
      mxnCell.textContent = this.formatCurrency(item.mxn, 2);
      mxnCell.classList.add('number');
      row.appendChild(mxnCell);

      const usdCell = document.createElement('td');
      usdCell.textContent = this.formatCurrency(item.usd, 2);
      usdCell.classList.add('number');
      row.appendChild(usdCell);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
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