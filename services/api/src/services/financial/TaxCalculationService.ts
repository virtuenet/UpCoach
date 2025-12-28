/**
 * Tax Calculation Service - Phase 14 Week 2
 * Handles regional tax calculations (VAT, GST, sales tax, etc.)
 */

import { EventEmitter } from 'events';

export interface TaxRule {
  id: string;
  country: string;
  region?: string; // State/province (for US, Canada, etc.)
  taxType: 'VAT' | 'GST' | 'sales_tax' | 'service_tax' | 'none';
  rate: number; // Percentage
  name: string;
  applicableToDigitalServices: boolean;
  reverseCharge: boolean; // For B2B VAT
  thresholds?: {
    annual: number; // Annual revenue threshold
    perTransaction: number; // Per-transaction threshold
  };
}

export interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  taxType: string;
  country: string;
  region?: string;
  taxIncluded: boolean;
  breakdown: Array<{
    name: string;
    rate: number;
    amount: number;
  }>;
}

export interface TaxExemption {
  id: string;
  country: string;
  reason: 'nonprofit' | 'educational' | 'government' | 'reseller' | 'other';
  validUntil?: Date;
  taxIdNumber?: string;
}

export class TaxCalculationService extends EventEmitter {
  private taxRules: Map<string, TaxRule[]> = new Map(); // country -> rules
  private taxExemptions: Map<string, TaxExemption> = new Map(); // userId -> exemption

  constructor() {
    super();
    this.initializeTaxRules();
  }

  /**
   * Initialize tax rules for different regions
   */
  private initializeTaxRules(): void {
    const rules: TaxRule[] = [
      // European Union - VAT
      { id: 'eu-at', country: 'AT', taxType: 'VAT', rate: 20, name: 'Austrian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-be', country: 'BE', taxType: 'VAT', rate: 21, name: 'Belgian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-bg', country: 'BG', taxType: 'VAT', rate: 20, name: 'Bulgarian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-cy', country: 'CY', taxType: 'VAT', rate: 19, name: 'Cyprus VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-cz', country: 'CZ', taxType: 'VAT', rate: 21, name: 'Czech VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-de', country: 'DE', taxType: 'VAT', rate: 19, name: 'German VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-dk', country: 'DK', taxType: 'VAT', rate: 25, name: 'Danish VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-ee', country: 'EE', taxType: 'VAT', rate: 20, name: 'Estonian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-es', country: 'ES', taxType: 'VAT', rate: 21, name: 'Spanish VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-fi', country: 'FI', taxType: 'VAT', rate: 24, name: 'Finnish VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-fr', country: 'FR', taxType: 'VAT', rate: 20, name: 'French VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-gr', country: 'GR', taxType: 'VAT', rate: 24, name: 'Greek VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-hr', country: 'HR', taxType: 'VAT', rate: 25, name: 'Croatian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-hu', country: 'HU', taxType: 'VAT', rate: 27, name: 'Hungarian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-ie', country: 'IE', taxType: 'VAT', rate: 23, name: 'Irish VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-it', country: 'IT', taxType: 'VAT', rate: 22, name: 'Italian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-lt', country: 'LT', taxType: 'VAT', rate: 21, name: 'Lithuanian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-lu', country: 'LU', taxType: 'VAT', rate: 17, name: 'Luxembourg VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-lv', country: 'LV', taxType: 'VAT', rate: 21, name: 'Latvian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-mt', country: 'MT', taxType: 'VAT', rate: 18, name: 'Maltese VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-nl', country: 'NL', taxType: 'VAT', rate: 21, name: 'Dutch VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-pl', country: 'PL', taxType: 'VAT', rate: 23, name: 'Polish VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-pt', country: 'PT', taxType: 'VAT', rate: 23, name: 'Portuguese VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-ro', country: 'RO', taxType: 'VAT', rate: 19, name: 'Romanian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-se', country: 'SE', taxType: 'VAT', rate: 25, name: 'Swedish VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-si', country: 'SI', taxType: 'VAT', rate: 22, name: 'Slovenian VAT', applicableToDigitalServices: true, reverseCharge: true },
      { id: 'eu-sk', country: 'SK', taxType: 'VAT', rate: 20, name: 'Slovak VAT', applicableToDigitalServices: true, reverseCharge: true },

      // United Kingdom
      { id: 'gb-vat', country: 'GB', taxType: 'VAT', rate: 20, name: 'UK VAT', applicableToDigitalServices: true, reverseCharge: false },

      // Australia
      { id: 'au-gst', country: 'AU', taxType: 'GST', rate: 10, name: 'Australian GST', applicableToDigitalServices: true, reverseCharge: false },

      // New Zealand
      { id: 'nz-gst', country: 'NZ', taxType: 'GST', rate: 15, name: 'New Zealand GST', applicableToDigitalServices: true, reverseCharge: false },

      // Canada - GST/HST by province
      { id: 'ca-ab', country: 'CA', region: 'AB', taxType: 'GST', rate: 5, name: 'Alberta GST', applicableToDigitalServices: true, reverseCharge: false },
      { id: 'ca-bc', country: 'CA', region: 'BC', taxType: 'GST', rate: 12, name: 'British Columbia GST+PST', applicableToDigitalServices: true, reverseCharge: false },
      { id: 'ca-mb', country: 'CA', region: 'MB', taxType: 'GST', rate: 12, name: 'Manitoba GST+PST', applicableToDigitalServices: true, reverseCharge: false },
      { id: 'ca-nb', country: 'CA', region: 'NB', taxType: 'GST', rate: 15, name: 'New Brunswick HST', applicableToDigitalServices: true, reverseCharge: false },
      { id: 'ca-nl', country: 'CA', region: 'NL', taxType: 'GST', rate: 15, name: 'Newfoundland HST', applicableToDigitalServices: true, reverseCharge: false },
      { id: 'ca-ns', country: 'CA', region: 'NS', taxType: 'GST', rate: 15, name: 'Nova Scotia HST', applicableToDigitalServices: true, reverseCharge: false },
      { id: 'ca-on', country: 'CA', region: 'ON', taxType: 'GST', rate: 13, name: 'Ontario HST', applicableToDigitalServices: true, reverseCharge: false },
      { id: 'ca-pe', country: 'CA', region: 'PE', taxType: 'GST', rate: 15, name: 'Prince Edward Island HST', applicableToDigitalServices: true, reverseCharge: false },
      { id: 'ca-qc', country: 'CA', region: 'QC', taxType: 'GST', rate: 14.975, name: 'Quebec GST+QST', applicableToDigitalServices: true, reverseCharge: false },
      { id: 'ca-sk', country: 'CA', region: 'SK', taxType: 'GST', rate: 11, name: 'Saskatchewan GST+PST', applicableToDigitalServices: true, reverseCharge: false },

      // India
      { id: 'in-gst', country: 'IN', taxType: 'GST', rate: 18, name: 'Indian GST', applicableToDigitalServices: true, reverseCharge: false },

      // Singapore
      { id: 'sg-gst', country: 'SG', taxType: 'GST', rate: 8, name: 'Singapore GST', applicableToDigitalServices: true, reverseCharge: false },

      // Japan
      { id: 'jp-ct', country: 'JP', taxType: 'sales_tax', rate: 10, name: 'Japan Consumption Tax', applicableToDigitalServices: true, reverseCharge: false },

      // South Korea
      { id: 'kr-vat', country: 'KR', taxType: 'VAT', rate: 10, name: 'South Korea VAT', applicableToDigitalServices: true, reverseCharge: false },

      // Brazil
      { id: 'br-icms', country: 'BR', taxType: 'service_tax', rate: 17, name: 'Brazil ICMS (avg)', applicableToDigitalServices: true, reverseCharge: false },

      // Mexico
      { id: 'mx-iva', country: 'MX', taxType: 'VAT', rate: 16, name: 'Mexico IVA', applicableToDigitalServices: true, reverseCharge: false },

      // South Africa
      { id: 'za-vat', country: 'ZA', taxType: 'VAT', rate: 15, name: 'South Africa VAT', applicableToDigitalServices: true, reverseCharge: false },

      // United States - No federal sales tax on digital services
      { id: 'us-none', country: 'US', taxType: 'none', rate: 0, name: 'No Tax', applicableToDigitalServices: true, reverseCharge: false },
    ];

    // Group by country
    for (const rule of rules) {
      const countryRules = this.taxRules.get(rule.country) || [];
      countryRules.push(rule);
      this.taxRules.set(rule.country, countryRules);
    }
  }

  /**
   * Calculate tax for a transaction
   */
  calculateTax(params: {
    amount: number;
    country: string;
    region?: string;
    isBusinessCustomer?: boolean;
    customerTaxId?: string;
    taxIncluded?: boolean;
  }): TaxCalculation {
    const {
      amount,
      country,
      region,
      isBusinessCustomer = false,
      customerTaxId,
      taxIncluded = false,
    } = params;

    // Get applicable tax rule
    const rule = this.getTaxRule(country, region);

    if (!rule || rule.taxType === 'none') {
      return {
        subtotal: amount,
        taxAmount: 0,
        taxRate: 0,
        total: amount,
        taxType: 'none',
        country,
        region,
        taxIncluded,
        breakdown: [],
      };
    }

    // Check for reverse charge (B2B VAT)
    if (isBusinessCustomer && rule.reverseCharge && customerTaxId) {
      // Reverse charge applies - customer pays VAT in their country
      return {
        subtotal: amount,
        taxAmount: 0,
        taxRate: 0,
        total: amount,
        taxType: `${rule.taxType} (Reverse Charge)`,
        country,
        region,
        taxIncluded: false,
        breakdown: [
          {
            name: 'Reverse Charge',
            rate: rule.rate,
            amount: 0,
          },
        ],
      };
    }

    // Calculate tax amount
    let subtotal: number;
    let taxAmount: number;

    if (taxIncluded) {
      // Tax is included in amount - extract it
      subtotal = amount / (1 + rule.rate / 100);
      taxAmount = amount - subtotal;
    } else {
      // Tax not included - add it
      subtotal = amount;
      taxAmount = amount * (rule.rate / 100);
    }

    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      taxRate: rule.rate,
      total,
      taxType: rule.taxType,
      country,
      region,
      taxIncluded,
      breakdown: [
        {
          name: rule.name,
          rate: rule.rate,
          amount: taxAmount,
        },
      ],
    };
  }

  /**
   * Get tax rule for a country/region
   */
  getTaxRule(country: string, region?: string): TaxRule | null {
    const countryRules = this.taxRules.get(country.toUpperCase());

    if (!countryRules || countryRules.length === 0) {
      return null;
    }

    // If region specified, try to find region-specific rule
    if (region) {
      const regionRule = countryRules.find(
        r => r.region?.toUpperCase() === region.toUpperCase()
      );

      if (regionRule) {
        return regionRule;
      }
    }

    // Return first rule (usually country-level)
    return countryRules[0];
  }

  /**
   * Get all tax rules for a country
   */
  getTaxRules(country: string): TaxRule[] {
    return this.taxRules.get(country.toUpperCase()) || [];
  }

  /**
   * Register tax exemption
   */
  registerTaxExemption(
    userId: string,
    exemption: Omit<TaxExemption, 'id'>
  ): TaxExemption {
    const taxExemption: TaxExemption = {
      ...exemption,
      id: `exemption-${userId}-${Date.now()}`,
    };

    this.taxExemptions.set(userId, taxExemption);
    this.emit('exemption:registered', taxExemption);

    return taxExemption;
  }

  /**
   * Check if user has tax exemption
   */
  hasTaxExemption(userId: string, country: string): boolean {
    const exemption = this.taxExemptions.get(userId);

    if (!exemption) {
      return false;
    }

    // Check if exemption is valid
    if (exemption.country !== country) {
      return false;
    }

    if (exemption.validUntil && exemption.validUntil < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Validate EU VAT number (basic format validation)
   */
  validateEUVATNumber(vatNumber: string, country: string): boolean {
    const patterns: Record<string, RegExp> = {
      AT: /^ATU\d{8}$/,
      BE: /^BE0\d{9}$/,
      BG: /^BG\d{9,10}$/,
      CY: /^CY\d{8}[A-Z]$/,
      CZ: /^CZ\d{8,10}$/,
      DE: /^DE\d{9}$/,
      DK: /^DK\d{8}$/,
      EE: /^EE\d{9}$/,
      ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
      FI: /^FI\d{8}$/,
      FR: /^FR[A-Z0-9]{2}\d{9}$/,
      GB: /^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$/,
      GR: /^EL\d{9}$/,
      HR: /^HR\d{11}$/,
      HU: /^HU\d{8}$/,
      IE: /^IE\d[A-Z0-9]\d{5}[A-Z]$/,
      IT: /^IT\d{11}$/,
      LT: /^LT\d{9,12}$/,
      LU: /^LU\d{8}$/,
      LV: /^LV\d{11}$/,
      MT: /^MT\d{8}$/,
      NL: /^NL\d{9}B\d{2}$/,
      PL: /^PL\d{10}$/,
      PT: /^PT\d{9}$/,
      RO: /^RO\d{2,10}$/,
      SE: /^SE\d{12}$/,
      SI: /^SI\d{8}$/,
      SK: /^SK\d{10}$/,
    };

    const pattern = patterns[country.toUpperCase()];
    if (!pattern) {
      return false;
    }

    return pattern.test(vatNumber);
  }

  /**
   * Get tax statistics
   */
  getStatistics(): {
    totalRules: number;
    countriesWithTax: number;
    averageTaxRate: number;
    taxTypes: Record<string, number>;
    highestTaxRate: { country: string; rate: number };
    lowestTaxRate: { country: string; rate: number };
  } {
    const allRules: TaxRule[] = [];
    for (const rules of this.taxRules.values()) {
      allRules.push(...rules);
    }

    const taxTypes: Record<string, number> = {};
    let totalRate = 0;
    let highestRate = 0;
    let lowestRate = 100;
    let highestCountry = '';
    let lowestCountry = '';

    for (const rule of allRules) {
      taxTypes[rule.taxType] = (taxTypes[rule.taxType] || 0) + 1;
      totalRate += rule.rate;

      if (rule.rate > highestRate) {
        highestRate = rule.rate;
        highestCountry = rule.country;
      }

      if (rule.rate < lowestRate && rule.rate > 0) {
        lowestRate = rule.rate;
        lowestCountry = rule.country;
      }
    }

    return {
      totalRules: allRules.length,
      countriesWithTax: this.taxRules.size,
      averageTaxRate: totalRate / allRules.length,
      taxTypes,
      highestTaxRate: { country: highestCountry, rate: highestRate },
      lowestTaxRate: { country: lowestCountry, rate: lowestRate },
    };
  }
}

// Singleton instance
export const taxCalculationService = new TaxCalculationService();
