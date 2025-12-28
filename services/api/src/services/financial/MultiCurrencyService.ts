/**
 * Multi-Currency Service - Phase 14 Week 2
 * Manages currency conversion, exchange rates, and multi-currency pricing
 */

import { EventEmitter } from 'events';
import axios from 'axios';

export interface Currency {
  code: string; // ISO 4217 currency code
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
  supported: boolean;
}

export interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  timestamp: Date;
  source: 'manual' | 'api' | 'cached';
}

export interface PriceConversion {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  convertedAmount: number;
  timestamp: Date;
}

export interface CurrencyConfig {
  baseCurrency: string; // Default: USD
  autoUpdateRates: boolean;
  updateIntervalHours: number;
  fallbackToManual: boolean;
  exchangeRateApiKey?: string;
  exchangeRateProvider: 'fixer' | 'openexchangerates' | 'currencyapi' | 'manual';
}

export class MultiCurrencyService extends EventEmitter {
  private config: CurrencyConfig;
  private exchangeRates: Map<string, Map<string, ExchangeRate>> = new Map(); // baseCurrency -> targetCurrency -> rate
  private updateInterval?: NodeJS.Timeout;

  // Supported currencies
  private readonly currencies: Map<string, Currency> = new Map([
    ['USD', {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      decimals: 2,
      symbolPosition: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
      supported: true,
    }],
    ['EUR', {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      decimals: 2,
      symbolPosition: 'before',
      thousandsSeparator: '.',
      decimalSeparator: ',',
      supported: true,
    }],
    ['GBP', {
      code: 'GBP',
      symbol: '£',
      name: 'British Pound',
      decimals: 2,
      symbolPosition: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
      supported: true,
    }],
    ['CAD', {
      code: 'CAD',
      symbol: 'CA$',
      name: 'Canadian Dollar',
      decimals: 2,
      symbolPosition: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
      supported: true,
    }],
    ['AUD', {
      code: 'AUD',
      symbol: 'A$',
      name: 'Australian Dollar',
      decimals: 2,
      symbolPosition: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
      supported: true,
    }],
    ['JPY', {
      code: 'JPY',
      symbol: '¥',
      name: 'Japanese Yen',
      decimals: 0,
      symbolPosition: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
      supported: true,
    }],
    ['BRL', {
      code: 'BRL',
      symbol: 'R$',
      name: 'Brazilian Real',
      decimals: 2,
      symbolPosition: 'before',
      thousandsSeparator: '.',
      decimalSeparator: ',',
      supported: true,
    }],
    ['MXN', {
      code: 'MXN',
      symbol: '$',
      name: 'Mexican Peso',
      decimals: 2,
      symbolPosition: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
      supported: true,
    }],
    ['INR', {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee',
      decimals: 2,
      symbolPosition: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
      supported: true,
    }],
    ['CNY', {
      code: 'CNY',
      symbol: '¥',
      name: 'Chinese Yuan',
      decimals: 2,
      symbolPosition: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
      supported: true,
    }],
  ]);

  constructor(config?: Partial<CurrencyConfig>) {
    super();

    this.config = {
      baseCurrency: 'USD',
      autoUpdateRates: true,
      updateIntervalHours: 24,
      fallbackToManual: true,
      exchangeRateProvider: 'manual',
      ...config,
    };

    // Start auto-update if enabled
    if (this.config.autoUpdateRates) {
      this.startAutoUpdate();
    }
  }

  /**
   * Start automatic exchange rate updates
   */
  private startAutoUpdate(): void {
    const intervalMs = this.config.updateIntervalHours * 60 * 60 * 1000;

    this.updateInterval = setInterval(async () => {
      try {
        await this.updateExchangeRates();
      } catch (error) {
        this.emit('rates:update_error', error);
      }
    }, intervalMs);

    // Initial update
    this.updateExchangeRates().catch(error => {
      this.emit('rates:update_error', error);
    });
  }

  /**
   * Stop automatic exchange rate updates
   */
  stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Update exchange rates from external API
   */
  async updateExchangeRates(): Promise<void> {
    try {
      let rates: Record<string, number> = {};

      switch (this.config.exchangeRateProvider) {
        case 'fixer':
          rates = await this.fetchFromFixer();
          break;
        case 'openexchangerates':
          rates = await this.fetchFromOpenExchangeRates();
          break;
        case 'currencyapi':
          rates = await this.fetchFromCurrencyAPI();
          break;
        case 'manual':
        default:
          // Use manual rates
          rates = this.getManualRates();
          break;
      }

      // Store rates
      const baseCurrency = this.config.baseCurrency;
      const baseRates = this.exchangeRates.get(baseCurrency) || new Map();

      for (const [currency, rate] of Object.entries(rates)) {
        const exchangeRate: ExchangeRate = {
          baseCurrency,
          targetCurrency: currency,
          rate,
          timestamp: new Date(),
          source: this.config.exchangeRateProvider === 'manual' ? 'manual' : 'api',
        };

        baseRates.set(currency, exchangeRate);
      }

      this.exchangeRates.set(baseCurrency, baseRates);
      this.emit('rates:updated', { baseCurrency, rates });
    } catch (error) {
      if (this.config.fallbackToManual) {
        // Fallback to manual rates
        const rates = this.getManualRates();
        const baseCurrency = this.config.baseCurrency;
        const baseRates = this.exchangeRates.get(baseCurrency) || new Map();

        for (const [currency, rate] of Object.entries(rates)) {
          const exchangeRate: ExchangeRate = {
            baseCurrency,
            targetCurrency: currency,
            rate,
            timestamp: new Date(),
            source: 'manual',
          };

          baseRates.set(currency, exchangeRate);
        }

        this.exchangeRates.set(baseCurrency, baseRates);
        this.emit('rates:fallback_to_manual', { baseCurrency });
      } else {
        throw error;
      }
    }
  }

  /**
   * Fetch rates from Fixer.io
   */
  private async fetchFromFixer(): Promise<Record<string, number>> {
    if (!this.config.exchangeRateApiKey) {
      throw new Error('Fixer API key is required');
    }

    const response = await axios.get(`https://api.fixer.io/latest`, {
      params: {
        access_key: this.config.exchangeRateApiKey,
        base: this.config.baseCurrency,
      },
    });

    return response.data.rates;
  }

  /**
   * Fetch rates from OpenExchangeRates
   */
  private async fetchFromOpenExchangeRates(): Promise<Record<string, number>> {
    if (!this.config.exchangeRateApiKey) {
      throw new Error('OpenExchangeRates API key is required');
    }

    const response = await axios.get(`https://openexchangerates.org/api/latest.json`, {
      params: {
        app_id: this.config.exchangeRateApiKey,
        base: this.config.baseCurrency,
      },
    });

    return response.data.rates;
  }

  /**
   * Fetch rates from CurrencyAPI
   */
  private async fetchFromCurrencyAPI(): Promise<Record<string, number>> {
    if (!this.config.exchangeRateApiKey) {
      throw new Error('CurrencyAPI key is required');
    }

    const response = await axios.get(`https://api.currencyapi.com/v3/latest`, {
      params: {
        apikey: this.config.exchangeRateApiKey,
        base_currency: this.config.baseCurrency,
      },
    });

    // Transform response format
    const rates: Record<string, number> = {};
    for (const [currency, data] of Object.entries<any>(response.data.data)) {
      rates[currency] = data.value;
    }

    return rates;
  }

  /**
   * Get manual/fallback exchange rates
   * These are approximate rates for fallback purposes
   */
  private getManualRates(): Record<string, number> {
    // Approximate rates as of Dec 2024 (for fallback only)
    return {
      USD: 1.00,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.36,
      AUD: 1.52,
      JPY: 149.50,
      BRL: 4.98,
      MXN: 17.05,
      INR: 83.12,
      CNY: 7.24,
    };
  }

  /**
   * Convert amount from one currency to another
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<PriceConversion> {
    // Same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return {
        amount,
        fromCurrency,
        toCurrency,
        exchangeRate: 1,
        convertedAmount: amount,
        timestamp: new Date(),
      };
    }

    // Get exchange rate
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);

    if (!rate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} -> ${toCurrency}`);
    }

    const convertedAmount = amount * rate.rate;

    return {
      amount,
      fromCurrency,
      toCurrency,
      exchangeRate: rate.rate,
      convertedAmount,
      timestamp: new Date(),
    };
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRate | null> {
    const baseCurrency = this.config.baseCurrency;

    // Direct rate from base currency
    if (fromCurrency === baseCurrency) {
      const rates = this.exchangeRates.get(baseCurrency);
      return rates?.get(toCurrency) || null;
    }

    // Inverse rate to base currency
    if (toCurrency === baseCurrency) {
      const rates = this.exchangeRates.get(baseCurrency);
      const rate = rates?.get(fromCurrency);

      if (rate) {
        return {
          baseCurrency: fromCurrency,
          targetCurrency: toCurrency,
          rate: 1 / rate.rate,
          timestamp: rate.timestamp,
          source: rate.source,
        };
      }
    }

    // Cross rate (from -> base -> to)
    const rates = this.exchangeRates.get(baseCurrency);
    const fromRate = rates?.get(fromCurrency);
    const toRate = rates?.get(toCurrency);

    if (fromRate && toRate) {
      return {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate: toRate.rate / fromRate.rate,
        timestamp: new Date(Math.min(fromRate.timestamp.getTime(), toRate.timestamp.getTime())),
        source: 'cached',
      };
    }

    return null;
  }

  /**
   * Format amount as currency string
   */
  formatCurrency(amount: number, currencyCode: string): string {
    const currency = this.currencies.get(currencyCode);

    if (!currency) {
      return `${amount.toFixed(2)} ${currencyCode}`;
    }

    // Round to appropriate decimals
    const rounded = amount.toFixed(currency.decimals);

    // Split into integer and decimal parts
    const parts = rounded.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add thousands separators
    const withSeparators = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      currency.thousandsSeparator
    );

    // Combine with decimal separator
    const formatted = decimalPart
      ? `${withSeparators}${currency.decimalSeparator}${decimalPart}`
      : withSeparators;

    // Add currency symbol
    return currency.symbolPosition === 'before'
      ? `${currency.symbol}${formatted}`
      : `${formatted}${currency.symbol}`;
  }

  /**
   * Get currency info
   */
  getCurrency(code: string): Currency | undefined {
    return this.currencies.get(code);
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): Currency[] {
    return Array.from(this.currencies.values()).filter(c => c.supported);
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(code: string): boolean {
    const currency = this.currencies.get(code);
    return currency?.supported || false;
  }

  /**
   * Manually set exchange rate
   */
  async setExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number
  ): Promise<void> {
    const baseRates = this.exchangeRates.get(fromCurrency) || new Map();

    const exchangeRate: ExchangeRate = {
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      rate,
      timestamp: new Date(),
      source: 'manual',
    };

    baseRates.set(toCurrency, exchangeRate);
    this.exchangeRates.set(fromCurrency, baseRates);

    this.emit('rate:manual_set', exchangeRate);
  }

  /**
   * Get all exchange rates for a base currency
   */
  getAllRates(baseCurrency: string): ExchangeRate[] {
    const rates = this.exchangeRates.get(baseCurrency);
    return rates ? Array.from(rates.values()) : [];
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    supportedCurrencies: number;
    baseCurrency: string;
    lastUpdate: Date | null;
    ratesCount: number;
    autoUpdateEnabled: boolean;
  } {
    const rates = this.exchangeRates.get(this.config.baseCurrency);
    const ratesArray = rates ? Array.from(rates.values()) : [];

    const lastUpdate = ratesArray.length > 0
      ? new Date(Math.max(...ratesArray.map(r => r.timestamp.getTime())))
      : null;

    return {
      supportedCurrencies: this.getSupportedCurrencies().length,
      baseCurrency: this.config.baseCurrency,
      lastUpdate,
      ratesCount: ratesArray.length,
      autoUpdateEnabled: this.config.autoUpdateRates,
    };
  }
}

// Singleton instance
export const multiCurrencyService = new MultiCurrencyService();
