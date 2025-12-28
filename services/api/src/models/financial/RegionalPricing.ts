/**
 * Regional Pricing Model - Phase 14 Week 2
 */

export interface RegionalPricing {
  id: string;
  productId: string;
  tierLevel: 'starter' | 'pro' | 'enterprise';
  country: string;
  currency: string;
  basePrice: number;
  adjustedPrice: number;
  pppDiscount: number;
  taxRate: number;
  priceWithTax: number;
  psychologicalPrice: number; // e.g., 9.99 instead of 10.00
  active: boolean;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}
