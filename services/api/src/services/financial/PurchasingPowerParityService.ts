/**
 * Purchasing Power Parity (PPP) Service - Phase 14 Week 2
 * Adjusts prices based on regional purchasing power to maximize accessibility
 */

import { EventEmitter } from 'events';

export interface PPPAdjustment {
  countryCode: string;
  countryName: string;
  pppIndex: number; // 1.0 = base (US), <1.0 = lower PPP, >1.0 = higher PPP
  recommendedDiscount: number; // 0-100 percentage
  currencyCode: string;
}

export interface RegionalPrice {
  basePrice: number;
  baseCurrency: string;
  adjustedPrice: number;
  adjustedCurrency: string;
  pppIndex: number;
  discount: number;
  savings: number;
  countryCode: string;
}

export class PurchasingPowerParityService extends EventEmitter {
  // PPP indices based on World Bank data (US = 1.0 baseline)
  // Lower index = lower purchasing power = higher discount
  private readonly pppIndices: Map<string, PPPAdjustment> = new Map([
    // North America
    ['US', { countryCode: 'US', countryName: 'United States', pppIndex: 1.00, recommendedDiscount: 0, currencyCode: 'USD' }],
    ['CA', { countryCode: 'CA', countryName: 'Canada', pppIndex: 0.85, recommendedDiscount: 15, currencyCode: 'CAD' }],
    ['MX', { countryCode: 'MX', countryName: 'Mexico', pppIndex: 0.52, recommendedDiscount: 48, currencyCode: 'MXN' }],

    // Europe
    ['GB', { countryCode: 'GB', countryName: 'United Kingdom', pppIndex: 0.72, recommendedDiscount: 28, currencyCode: 'GBP' }],
    ['DE', { countryCode: 'DE', countryName: 'Germany', pppIndex: 0.79, recommendedDiscount: 21, currencyCode: 'EUR' }],
    ['FR', { countryCode: 'FR', countryName: 'France', pppIndex: 0.78, recommendedDiscount: 22, currencyCode: 'EUR' }],
    ['ES', { countryCode: 'ES', countryName: 'Spain', pppIndex: 0.69, recommendedDiscount: 31, currencyCode: 'EUR' }],
    ['IT', { countryCode: 'IT', countryName: 'Italy', pppIndex: 0.71, recommendedDiscount: 29, currencyCode: 'EUR' }],
    ['NL', { countryCode: 'NL', countryName: 'Netherlands', pppIndex: 0.80, recommendedDiscount: 20, currencyCode: 'EUR' }],
    ['PL', { countryCode: 'PL', countryName: 'Poland', pppIndex: 0.55, recommendedDiscount: 45, currencyCode: 'PLN' }],
    ['RU', { countryCode: 'RU', countryName: 'Russia', pppIndex: 0.42, recommendedDiscount: 58, currencyCode: 'RUB' }],
    ['TR', { countryCode: 'TR', countryName: 'Turkey', pppIndex: 0.38, recommendedDiscount: 62, currencyCode: 'TRY' }],

    // South America
    ['BR', { countryCode: 'BR', countryName: 'Brazil', pppIndex: 0.48, recommendedDiscount: 52, currencyCode: 'BRL' }],
    ['AR', { countryCode: 'AR', countryName: 'Argentina', pppIndex: 0.41, recommendedDiscount: 59, currencyCode: 'ARS' }],
    ['CL', { countryCode: 'CL', countryName: 'Chile', pppIndex: 0.58, recommendedDiscount: 42, currencyCode: 'CLP' }],
    ['CO', { countryCode: 'CO', countryName: 'Colombia', pppIndex: 0.44, recommendedDiscount: 56, currencyCode: 'COP' }],

    // Asia-Pacific
    ['JP', { countryCode: 'JP', countryName: 'Japan', pppIndex: 0.76, recommendedDiscount: 24, currencyCode: 'JPY' }],
    ['CN', { countryCode: 'CN', countryName: 'China', pppIndex: 0.57, recommendedDiscount: 43, currencyCode: 'CNY' }],
    ['IN', { countryCode: 'IN', countryName: 'India', pppIndex: 0.24, recommendedDiscount: 76, currencyCode: 'INR' }],
    ['AU', { countryCode: 'AU', countryName: 'Australia', pppIndex: 0.91, recommendedDiscount: 9, currencyCode: 'AUD' }],
    ['NZ', { countryCode: 'NZ', countryName: 'New Zealand', pppIndex: 0.84, recommendedDiscount: 16, currencyCode: 'NZD' }],
    ['SG', { countryCode: 'SG', countryName: 'Singapore', pppIndex: 0.84, recommendedDiscount: 16, currencyCode: 'SGD' }],
    ['KR', { countryCode: 'KR', countryName: 'South Korea', pppIndex: 0.73, recommendedDiscount: 27, currencyCode: 'KRW' }],
    ['TH', { countryCode: 'TH', countryName: 'Thailand', pppIndex: 0.41, recommendedDiscount: 59, currencyCode: 'THB' }],
    ['VN', { countryCode: 'VN', countryName: 'Vietnam', pppIndex: 0.32, recommendedDiscount: 68, currencyCode: 'VND' }],
    ['ID', { countryCode: 'ID', countryName: 'Indonesia', pppIndex: 0.38, recommendedDiscount: 62, currencyCode: 'IDR' }],
    ['PH', { countryCode: 'PH', countryName: 'Philippines', pppIndex: 0.35, recommendedDiscount: 65, currencyCode: 'PHP' }],

    // Middle East & Africa
    ['SA', { countryCode: 'SA', countryName: 'Saudi Arabia', pppIndex: 0.63, recommendedDiscount: 37, currencyCode: 'SAR' }],
    ['AE', { countryCode: 'AE', countryName: 'United Arab Emirates', pppIndex: 0.68, recommendedDiscount: 32, currencyCode: 'AED' }],
    ['ZA', { countryCode: 'ZA', countryName: 'South Africa', pppIndex: 0.43, recommendedDiscount: 57, currencyCode: 'ZAR' }],
    ['EG', { countryCode: 'EG', countryName: 'Egypt', pppIndex: 0.25, recommendedDiscount: 75, currencyCode: 'EGP' }],
    ['NG', { countryCode: 'NG', countryName: 'Nigeria', pppIndex: 0.27, recommendedDiscount: 73, currencyCode: 'NGN' }],
  ]);

  constructor() {
    super();
  }

  /**
   * Calculate regional price with PPP adjustment
   */
  calculateRegionalPrice(
    basePrice: number,
    baseCurrency: string,
    countryCode: string,
    targetCurrency: string
  ): RegionalPrice {
    const pppData = this.pppIndices.get(countryCode.toUpperCase());

    if (!pppData) {
      // No PPP data available, return base price
      return {
        basePrice,
        baseCurrency,
        adjustedPrice: basePrice,
        adjustedCurrency: targetCurrency,
        pppIndex: 1.0,
        discount: 0,
        savings: 0,
        countryCode,
      };
    }

    // Calculate discount based on PPP index
    const discount = pppData.recommendedDiscount;
    const adjustedPrice = basePrice * (1 - discount / 100);
    const savings = basePrice - adjustedPrice;

    return {
      basePrice,
      baseCurrency,
      adjustedPrice,
      adjustedCurrency: pppData.currencyCode,
      pppIndex: pppData.pppIndex,
      discount,
      savings,
      countryCode,
    };
  }

  /**
   * Get PPP adjustment for a country
   */
  getPPPAdjustment(countryCode: string): PPPAdjustment | null {
    return this.pppIndices.get(countryCode.toUpperCase()) || null;
  }

  /**
   * Get all PPP adjustments
   */
  getAllPPPAdjustments(): PPPAdjustment[] {
    return Array.from(this.pppIndices.values());
  }

  /**
   * Get countries by discount tier
   */
  getCountriesByDiscountTier(): {
    tier1: PPPAdjustment[]; // 0-20% discount
    tier2: PPPAdjustment[]; // 21-40% discount
    tier3: PPPAdjustment[]; // 41-60% discount
    tier4: PPPAdjustment[]; // 61%+ discount
  } {
    const allAdjustments = this.getAllPPPAdjustments();

    return {
      tier1: allAdjustments.filter(a => a.recommendedDiscount <= 20),
      tier2: allAdjustments.filter(a => a.recommendedDiscount > 20 && a.recommendedDiscount <= 40),
      tier3: allAdjustments.filter(a => a.recommendedDiscount > 40 && a.recommendedDiscount <= 60),
      tier4: allAdjustments.filter(a => a.recommendedDiscount > 60),
    };
  }

  /**
   * Calculate pricing matrix for all regions
   */
  calculatePricingMatrix(
    basePrice: number,
    baseCurrency: string
  ): Map<string, RegionalPrice> {
    const matrix = new Map<string, RegionalPrice>();

    for (const [countryCode, pppData] of this.pppIndices.entries()) {
      const regionalPrice = this.calculateRegionalPrice(
        basePrice,
        baseCurrency,
        countryCode,
        pppData.currencyCode
      );

      matrix.set(countryCode, regionalPrice);
    }

    return matrix;
  }

  /**
   * Estimate optimal discount for a country (custom algorithm)
   */
  estimateOptimalDiscount(countryCode: string, basePrice: number): {
    minDiscount: number;
    maxDiscount: number;
    recommendedDiscount: number;
    reasoning: string;
  } {
    const pppData = this.pppIndices.get(countryCode.toUpperCase());

    if (!pppData) {
      return {
        minDiscount: 0,
        maxDiscount: 0,
        recommendedDiscount: 0,
        reasoning: 'No PPP data available for this country',
      };
    }

    // Calculate recommended range based on PPP index
    const baseDiscount = pppData.recommendedDiscount;
    const minDiscount = Math.max(0, baseDiscount - 10);
    const maxDiscount = Math.min(80, baseDiscount + 10);

    return {
      minDiscount,
      maxDiscount,
      recommendedDiscount: baseDiscount,
      reasoning: `Based on PPP index of ${pppData.pppIndex.toFixed(2)} for ${pppData.countryName}`,
    };
  }

  /**
   * Validate regional pricing strategy
   */
  validatePricingStrategy(regionalPrices: Map<string, number>): {
    valid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    for (const [countryCode, price] of regionalPrices.entries()) {
      const pppData = this.pppIndices.get(countryCode);

      if (!pppData) {
        warnings.push(`No PPP data for ${countryCode}`);
        continue;
      }

      // Check if price is within reasonable range
      const basePrice = regionalPrices.get('US') || 0;
      const expectedPrice = basePrice * (1 - pppData.recommendedDiscount / 100);
      const priceDifference = Math.abs(price - expectedPrice) / expectedPrice;

      if (priceDifference > 0.2) { // More than 20% deviation
        warnings.push(
          `Price for ${pppData.countryName} (${price}) deviates significantly from PPP recommendation (${expectedPrice.toFixed(2)})`
        );

        recommendations.push(
          `Consider adjusting ${pppData.countryName} price to ${expectedPrice.toFixed(2)} ${pppData.currencyCode}`
        );
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
      recommendations,
    };
  }

  /**
   * Calculate revenue impact of PPP pricing
   */
  calculateRevenueImpact(
    basePrice: number,
    baseCurrency: string,
    conversionRates: Map<string, number> // Estimated conversion rate increase per country
  ): {
    withoutPPP: number;
    withPPP: number;
    increase: number;
    increasePercentage: number;
    breakdown: Array<{
      country: string;
      withoutPPP: number;
      withPPP: number;
      increase: number;
    }>;
  } {
    let totalWithoutPPP = 0;
    let totalWithPPP = 0;
    const breakdown: Array<{
      country: string;
      withoutPPP: number;
      withPPP: number;
      increase: number;
    }> = [];

    for (const [countryCode, pppData] of this.pppIndices.entries()) {
      const baseConversionRate = conversionRates.get(countryCode) || 0.01; // 1% default
      const regionalPrice = this.calculateRegionalPrice(
        basePrice,
        baseCurrency,
        countryCode,
        pppData.currencyCode
      );

      // Assume PPP pricing increases conversion rate by 30-70% based on discount tier
      const conversionBoost = 1 + (regionalPrice.discount / 100) * 0.5;
      const pppConversionRate = baseConversionRate * conversionBoost;

      // Calculate revenue (assuming 1000 visitors per country per month)
      const visitors = 1000;
      const revenueWithoutPPP = visitors * baseConversionRate * basePrice;
      const revenueWithPPP = visitors * pppConversionRate * regionalPrice.adjustedPrice;

      totalWithoutPPP += revenueWithoutPPP;
      totalWithPPP += revenueWithPPP;

      breakdown.push({
        country: pppData.countryName,
        withoutPPP: revenueWithoutPPP,
        withPPP: revenueWithPPP,
        increase: revenueWithPPP - revenueWithoutPPP,
      });
    }

    return {
      withoutPPP: totalWithoutPPP,
      withPPP: totalWithPPP,
      increase: totalWithPPP - totalWithoutPPP,
      increasePercentage: ((totalWithPPP - totalWithoutPPP) / totalWithoutPPP) * 100,
      breakdown,
    };
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalCountries: number;
    averagePPPIndex: number;
    averageDiscount: number;
    discountTiers: {
      tier1: number;
      tier2: number;
      tier3: number;
      tier4: number;
    };
  } {
    const allAdjustments = this.getAllPPPAdjustments();
    const tiers = this.getCountriesByDiscountTier();

    const totalPPP = allAdjustments.reduce((sum, a) => sum + a.pppIndex, 0);
    const totalDiscount = allAdjustments.reduce((sum, a) => sum + a.recommendedDiscount, 0);

    return {
      totalCountries: allAdjustments.length,
      averagePPPIndex: totalPPP / allAdjustments.length,
      averageDiscount: totalDiscount / allAdjustments.length,
      discountTiers: {
        tier1: tiers.tier1.length,
        tier2: tiers.tier2.length,
        tier3: tiers.tier3.length,
        tier4: tiers.tier4.length,
      },
    };
  }
}

// Singleton instance
export const pppService = new PurchasingPowerParityService();
