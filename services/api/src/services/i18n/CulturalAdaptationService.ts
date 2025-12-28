/**
 * Cultural Adaptation Service - Phase 14 Week 3
 * Handles cultural customization of content, date/time formats, and regional preferences
 */

import { EventEmitter } from 'events';

export interface CulturalPreferences {
  locale: string;
  dateFormat: string; // 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 0 | 1 | 6; // 0=Sunday, 1=Monday, 6=Saturday
  weekendDays: number[]; // [0, 6] for Sat-Sun, [5, 6] for Fri-Sat
  numberFormat: {
    decimal: string;
    thousands: string;
    grouping: number[];
  };
  measurementSystem: 'metric' | 'imperial';
  paperSize: 'A4' | 'Letter';
  culturalNorms: {
    formalityLevel: 'formal' | 'informal' | 'mixed';
    directness: 'direct' | 'indirect';
    individualismScore: number; // 0-100, Hofstede's dimension
    powerDistance: number; // 0-100
  };
}

export interface CulturalContent {
  id: string;
  contentType: 'greeting' | 'motivation' | 'achievement' | 'reminder' | 'encouragement';
  locale: string;
  variations: string[];
  culturalContext: string;
  appropriateness: {
    formality: 'formal' | 'informal' | 'neutral';
    context: string[];
  };
  createdAt: Date;
}

export interface LocaleFormattingRules {
  locale: string;
  name: {
    format: 'firstName lastName' | 'lastName firstName' | 'firstName middleName lastName';
    honorifics: string[];
  };
  address: {
    format: string[];
    postalCodeFormat: RegExp;
  };
  phone: {
    format: string;
    countryCode: string;
  };
  units: {
    distance: 'km' | 'mi';
    weight: 'kg' | 'lb';
    temperature: 'C' | 'F';
  };
}

export class CulturalAdaptationService extends EventEmitter {
  private culturalPreferences: Map<string, CulturalPreferences> = new Map();
  private culturalContent: Map<string, CulturalContent[]> = new Map();
  private formattingRules: Map<string, LocaleFormattingRules> = new Map();

  constructor() {
    super();
    this.initializeCulturalPreferences();
    this.initializeFormattingRules();
  }

  /**
   * Initialize cultural preferences for supported locales
   */
  private initializeCulturalPreferences(): void {
    const preferences: CulturalPreferences[] = [
      // United States
      {
        locale: 'en-US',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        firstDayOfWeek: 0, // Sunday
        weekendDays: [0, 6],
        numberFormat: { decimal: '.', thousands: ',', grouping: [3] },
        measurementSystem: 'imperial',
        paperSize: 'Letter',
        culturalNorms: {
          formalityLevel: 'informal',
          directness: 'direct',
          individualismScore: 91,
          powerDistance: 40,
        },
      },
      // Spain
      {
        locale: 'es-ES',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 1, // Monday
        weekendDays: [0, 6],
        numberFormat: { decimal: ',', thousands: '.', grouping: [3] },
        measurementSystem: 'metric',
        paperSize: 'A4',
        culturalNorms: {
          formalityLevel: 'formal',
          directness: 'direct',
          individualismScore: 51,
          powerDistance: 57,
        },
      },
      // Brazil
      {
        locale: 'pt-BR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 0, // Sunday
        weekendDays: [0, 6],
        numberFormat: { decimal: ',', thousands: '.', grouping: [3] },
        measurementSystem: 'metric',
        paperSize: 'A4',
        culturalNorms: {
          formalityLevel: 'mixed',
          directness: 'indirect',
          individualismScore: 38,
          powerDistance: 69,
        },
      },
      // France
      {
        locale: 'fr-FR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 1, // Monday
        weekendDays: [0, 6],
        numberFormat: { decimal: ',', thousands: ' ', grouping: [3] },
        measurementSystem: 'metric',
        paperSize: 'A4',
        culturalNorms: {
          formalityLevel: 'formal',
          directness: 'direct',
          individualismScore: 71,
          powerDistance: 68,
        },
      },
      // Germany
      {
        locale: 'de-DE',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 1, // Monday
        weekendDays: [0, 6],
        numberFormat: { decimal: ',', thousands: '.', grouping: [3] },
        measurementSystem: 'metric',
        paperSize: 'A4',
        culturalNorms: {
          formalityLevel: 'formal',
          directness: 'direct',
          individualismScore: 67,
          powerDistance: 35,
        },
      },
      // Japan
      {
        locale: 'ja-JP',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24h',
        firstDayOfWeek: 0, // Sunday
        weekendDays: [0, 6],
        numberFormat: { decimal: '.', thousands: ',', grouping: [3] },
        measurementSystem: 'metric',
        paperSize: 'A4',
        culturalNorms: {
          formalityLevel: 'formal',
          directness: 'indirect',
          individualismScore: 46,
          powerDistance: 54,
        },
      },
    ];

    for (const pref of preferences) {
      this.culturalPreferences.set(pref.locale, pref);
    }
  }

  /**
   * Initialize formatting rules for supported locales
   */
  private initializeFormattingRules(): void {
    const rules: LocaleFormattingRules[] = [
      {
        locale: 'en-US',
        name: {
          format: 'firstName lastName',
          honorifics: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'],
        },
        address: {
          format: ['street', 'city', 'state', 'zipCode', 'country'],
          postalCodeFormat: /^\d{5}(-\d{4})?$/,
        },
        phone: {
          format: '(XXX) XXX-XXXX',
          countryCode: '+1',
        },
        units: {
          distance: 'mi',
          weight: 'lb',
          temperature: 'F',
        },
      },
      {
        locale: 'ja-JP',
        name: {
          format: 'lastName firstName',
          honorifics: ['様', '先生', '殿', 'さん'],
        },
        address: {
          format: ['postalCode', 'prefecture', 'city', 'street', 'building'],
          postalCodeFormat: /^\d{3}-\d{4}$/,
        },
        phone: {
          format: 'XXX-XXXX-XXXX',
          countryCode: '+81',
        },
        units: {
          distance: 'km',
          weight: 'kg',
          temperature: 'C',
        },
      },
    ];

    for (const rule of rules) {
      this.formattingRules.set(rule.locale, rule);
    }
  }

  /**
   * Get cultural preferences for a locale
   */
  getCulturalPreferences(locale: string): CulturalPreferences | null {
    return this.culturalPreferences.get(locale) || null;
  }

  /**
   * Format date according to locale preferences
   */
  formatDate(date: Date, locale: string): string {
    const prefs = this.getCulturalPreferences(locale);
    if (!prefs) {
      return date.toLocaleDateString(locale);
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    const format = prefs.dateFormat;
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year.toString());
  }

  /**
   * Format time according to locale preferences
   */
  formatTime(date: Date, locale: string): string {
    const prefs = this.getCulturalPreferences(locale);
    if (!prefs) {
      return date.toLocaleTimeString(locale);
    }

    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (prefs.timeFormat === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes} ${period}`;
    } else {
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  /**
   * Format number according to locale preferences
   */
  formatNumber(value: number, locale: string, decimals: number = 2): string {
    const prefs = this.getCulturalPreferences(locale);
    if (!prefs) {
      return value.toLocaleString(locale);
    }

    const parts = value.toFixed(decimals).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add thousands separators
    const withSeparators = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      prefs.numberFormat.thousands
    );

    if (decimals > 0 && decimalPart) {
      return `${withSeparators}${prefs.numberFormat.decimal}${decimalPart}`;
    }

    return withSeparators;
  }

  /**
   * Get appropriate greeting based on time and culture
   */
  getGreeting(locale: string, hour: number = new Date().getHours()): string {
    const greetings: Record<string, { morning: string; afternoon: string; evening: string }> = {
      'en-US': { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
      'es-ES': { morning: 'Buenos días', afternoon: 'Buenas tardes', evening: 'Buenas noches' },
      'pt-BR': { morning: 'Bom dia', afternoon: 'Boa tarde', evening: 'Boa noite' },
      'fr-FR': { morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir' },
      'de-DE': { morning: 'Guten Morgen', afternoon: 'Guten Tag', evening: 'Guten Abend' },
      'ja-JP': { morning: 'おはようございます', afternoon: 'こんにちは', evening: 'こんばんは' },
    };

    const localeGreetings = greetings[locale] || greetings['en-US'];

    if (hour < 12) return localeGreetings.morning;
    if (hour < 18) return localeGreetings.afternoon;
    return localeGreetings.evening;
  }

  /**
   * Get culturally appropriate motivational message
   */
  getMotivationalMessage(locale: string, context: 'habit' | 'goal' | 'streak'): string {
    const messages: Record<string, Record<string, string[]>> = {
      'en-US': {
        habit: [
          'Great job! Keep it up!',
          "You're crushing it!",
          'Another day, another win!',
        ],
        goal: [
          "You're making amazing progress!",
          'Keep pushing forward!',
          "You've got this!",
        ],
        streak: [
          '🔥 On fire! {days} days strong!',
          'Unstoppable streak!',
          'Consistency is key!',
        ],
      },
      'ja-JP': {
        habit: [
          'よくできました！',
          '素晴らしいです！',
          '頑張っていますね！',
        ],
        goal: [
          '順調に進んでいます！',
          '引き続き頑張りましょう！',
          'もう少しです！',
        ],
        streak: [
          '🔥 {days}日連続達成！',
          '素晴らしい継続力です！',
          '継続は力なり！',
        ],
      },
    };

    const localeMessages = messages[locale] || messages['en-US'];
    const contextMessages = localeMessages[context] || localeMessages.habit;
    return contextMessages[Math.floor(Math.random() * contextMessages.length)];
  }

  /**
   * Adapt content formality based on cultural norms
   */
  adaptFormality(content: string, locale: string, targetFormality: 'formal' | 'informal'): string {
    const prefs = this.getCulturalPreferences(locale);
    if (!prefs) return content;

    // Simplified formality adaptation
    // In production, this would use more sophisticated NLP
    if (locale === 'ja-JP') {
      if (targetFormality === 'formal') {
        content = content.replace(/だ$/, 'です');
        content = content.replace(/である$/, 'であります');
      }
    }

    if (locale === 'es-ES' || locale === 'fr-FR') {
      if (targetFormality === 'formal') {
        content = content.replace(/\btú\b/g, 'usted');
        content = content.replace(/\btu\b/g, 'vous');
      }
    }

    return content;
  }

  /**
   * Get week start date based on cultural preferences
   */
  getWeekStartDate(date: Date, locale: string): Date {
    const prefs = this.getCulturalPreferences(locale);
    const firstDayOfWeek = prefs?.firstDayOfWeek || 0;

    const currentDay = date.getDay();
    const diff = (currentDay - firstDayOfWeek + 7) % 7;

    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    return weekStart;
  }

  /**
   * Check if date is weekend based on cultural preferences
   */
  isWeekend(date: Date, locale: string): boolean {
    const prefs = this.getCulturalPreferences(locale);
    const weekendDays = prefs?.weekendDays || [0, 6];

    return weekendDays.includes(date.getDay());
  }

  /**
   * Format name according to cultural conventions
   */
  formatName(firstName: string, lastName: string, locale: string): string {
    const rules = this.formattingRules.get(locale);
    if (!rules) {
      return `${firstName} ${lastName}`;
    }

    if (rules.name.format === 'lastName firstName') {
      return `${lastName} ${firstName}`;
    }

    return `${firstName} ${lastName}`;
  }

  /**
   * Get measurement unit for locale
   */
  getMeasurementUnit(type: 'distance' | 'weight' | 'temperature', locale: string): string {
    const rules = this.formattingRules.get(locale);
    return rules?.units[type] || (type === 'distance' ? 'km' : type === 'weight' ? 'kg' : 'C');
  }

  /**
   * Convert measurement based on locale
   */
  convertMeasurement(
    value: number,
    type: 'distance' | 'weight' | 'temperature',
    fromLocale: string,
    toLocale: string
  ): number {
    const fromUnit = this.getMeasurementUnit(type, fromLocale);
    const toUnit = this.getMeasurementUnit(type, toLocale);

    if (fromUnit === toUnit) return value;

    // Distance conversion
    if (type === 'distance') {
      if (fromUnit === 'km' && toUnit === 'mi') return value * 0.621371;
      if (fromUnit === 'mi' && toUnit === 'km') return value * 1.60934;
    }

    // Weight conversion
    if (type === 'weight') {
      if (fromUnit === 'kg' && toUnit === 'lb') return value * 2.20462;
      if (fromUnit === 'lb' && toUnit === 'kg') return value * 0.453592;
    }

    // Temperature conversion
    if (type === 'temperature') {
      if (fromUnit === 'C' && toUnit === 'F') return (value * 9/5) + 32;
      if (fromUnit === 'F' && toUnit === 'C') return (value - 32) * 5/9;
    }

    return value;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    supportedLocales: number;
    averageIndividualism: number;
    averagePowerDistance: number;
    metricLocales: number;
    imperialLocales: number;
  } {
    const allPrefs = Array.from(this.culturalPreferences.values());

    const totalIndividualism = allPrefs.reduce((sum, p) => sum + p.culturalNorms.individualismScore, 0);
    const totalPowerDistance = allPrefs.reduce((sum, p) => sum + p.culturalNorms.powerDistance, 0);
    const metricCount = allPrefs.filter(p => p.measurementSystem === 'metric').length;
    const imperialCount = allPrefs.filter(p => p.measurementSystem === 'imperial').length;

    return {
      supportedLocales: allPrefs.length,
      averageIndividualism: totalIndividualism / allPrefs.length,
      averagePowerDistance: totalPowerDistance / allPrefs.length,
      metricLocales: metricCount,
      imperialLocales: imperialCount,
    };
  }
}

// Singleton instance
export const culturalAdaptationService = new CulturalAdaptationService();
