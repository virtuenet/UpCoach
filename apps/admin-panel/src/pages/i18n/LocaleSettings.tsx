/**
 * LocaleSettings Page
 *
 * Manages locale configuration, regional settings, and formatting options.
 */

import React, { useState } from 'react';

// Types
interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  enabled: boolean;
  isDefault: boolean;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    currency: string;
  };
  currencyCode: string;
  firstDayOfWeek: number;
  translationProgress: number;
  reviewedProgress: number;
}

interface RegionalSettings {
  defaultLocale: string;
  fallbackLocale: string;
  autoDetectLocale: boolean;
  showLanguageSwitcher: boolean;
  persistPreference: boolean;
  useGeolocation: boolean;
}

// Mock data
const mockLocales: LocaleConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    enabled: true,
    isDefault: true,
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    numberFormat: { decimal: '.', thousands: ',', currency: '$' },
    currencyCode: 'USD',
    firstDayOfWeek: 0,
    translationProgress: 100,
    reviewedProgress: 100,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    enabled: true,
    isDefault: false,
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: { decimal: ',', thousands: '.', currency: '€' },
    currencyCode: 'EUR',
    firstDayOfWeek: 1,
    translationProgress: 95,
    reviewedProgress: 88,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    enabled: true,
    isDefault: false,
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: { decimal: ',', thousands: ' ', currency: '€' },
    currencyCode: 'EUR',
    firstDayOfWeek: 1,
    translationProgress: 92,
    reviewedProgress: 85,
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    enabled: true,
    isDefault: false,
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    numberFormat: { decimal: ',', thousands: '.', currency: '€' },
    currencyCode: 'EUR',
    firstDayOfWeek: 1,
    translationProgress: 90,
    reviewedProgress: 82,
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    enabled: true,
    isDefault: false,
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    numberFormat: { decimal: '.', thousands: ',', currency: '¥' },
    currencyCode: 'JPY',
    firstDayOfWeek: 0,
    translationProgress: 85,
    reviewedProgress: 75,
  },
  {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    enabled: true,
    isDefault: false,
    direction: 'ltr',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    numberFormat: { decimal: '.', thousands: ',', currency: '¥' },
    currencyCode: 'CNY',
    firstDayOfWeek: 1,
    translationProgress: 88,
    reviewedProgress: 78,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    enabled: true,
    isDefault: false,
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'hh:mm',
    numberFormat: { decimal: '٫', thousands: '٬', currency: 'ر.س' },
    currencyCode: 'SAR',
    firstDayOfWeek: 6,
    translationProgress: 78,
    reviewedProgress: 65,
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
    enabled: false,
    isDefault: false,
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: { decimal: '.', thousands: ',', currency: '₪' },
    currencyCode: 'ILS',
    firstDayOfWeek: 0,
    translationProgress: 45,
    reviewedProgress: 30,
  },
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    flag: '🇧🇷',
    enabled: false,
    isDefault: false,
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: { decimal: ',', thousands: '.', currency: 'R$' },
    currencyCode: 'BRL',
    firstDayOfWeek: 0,
    translationProgress: 35,
    reviewedProgress: 20,
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    enabled: false,
    isDefault: false,
    direction: 'ltr',
    dateFormat: 'YYYY.MM.DD',
    timeFormat: 'HH:mm',
    numberFormat: { decimal: '.', thousands: ',', currency: '₩' },
    currencyCode: 'KRW',
    firstDayOfWeek: 0,
    translationProgress: 25,
    reviewedProgress: 15,
  },
];

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const LocaleSettings: React.FC = () => {
  const [locales, setLocales] = useState<LocaleConfig[]>(mockLocales);
  const [editingLocale, setEditingLocale] = useState<LocaleConfig | null>(null);
  const [settings, setSettings] = useState<RegionalSettings>({
    defaultLocale: 'en',
    fallbackLocale: 'en',
    autoDetectLocale: true,
    showLanguageSwitcher: true,
    persistPreference: true,
    useGeolocation: false,
  });
  const [activeTab, setActiveTab] = useState<'locales' | 'settings'>('locales');

  const handleToggleLocale = (code: string) => {
    setLocales(
      locales.map((l) =>
        l.code === code ? { ...l, enabled: !l.enabled } : l
      )
    );
  };

  const handleSetDefault = (code: string) => {
    setLocales(
      locales.map((l) => ({
        ...l,
        isDefault: l.code === code,
        enabled: l.code === code ? true : l.enabled,
      }))
    );
    setSettings({ ...settings, defaultLocale: code });
  };

  const handleSaveLocale = () => {
    if (!editingLocale) return;
    setLocales(locales.map((l) => (l.code === editingLocale.code ? editingLocale : l)));
    setEditingLocale(null);
  };

  const enabledLocales = locales.filter((l) => l.enabled);
  const disabledLocales = locales.filter((l) => !l.enabled);

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a1a2e',
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 24px',
    backgroundColor: isActive ? '#6366f1' : 'white',
    color: isActive ? 'white' : '#333',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '16px',
  };

  const localeRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '50px 1fr 120px 120px 100px 100px',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
    gap: '16px',
  };

  const progressBarStyle = (progress: number, color: string): React.CSSProperties => ({
    width: '100%',
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden',
    position: 'relative' as const,
  });

  const progressFillStyle = (progress: number, color: string): React.CSSProperties => ({
    width: `${progress}%`,
    height: '100%',
    backgroundColor: color,
    borderRadius: '3px',
  });

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  };

  const toggleStyle = (enabled: boolean): React.CSSProperties => ({
    width: '48px',
    height: '24px',
    backgroundColor: enabled ? '#10b981' : '#d1d5db',
    borderRadius: '12px',
    position: 'relative' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const toggleCircleStyle = (enabled: boolean): React.CSSProperties => ({
    width: '20px',
    height: '20px',
    backgroundColor: 'white',
    borderRadius: '50%',
    position: 'absolute' as const,
    top: '2px',
    left: enabled ? '26px' : '2px',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  });

  const settingRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
  };

  const selectStyle: React.CSSProperties = {
    padding: '10px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '200px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    color: '#333',
    fontSize: '13px',
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    width: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Locale Settings</h1>
          <p style={{ color: '#666', marginTop: '4px' }}>
            Configure languages and regional formatting options
          </p>
        </div>
        <button
          style={{ ...buttonStyle, backgroundColor: '#10b981' }}
          onClick={() => alert('Settings saved!')}
        >
          Save All Settings
        </button>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        <button style={tabStyle(activeTab === 'locales')} onClick={() => setActiveTab('locales')}>
          Languages ({enabledLocales.length} active)
        </button>
        <button style={tabStyle(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>
          Regional Settings
        </button>
      </div>

      {/* Locales Tab */}
      {activeTab === 'locales' && (
        <>
          {/* Enabled Locales */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Enabled Languages</h2>
            <div style={{ ...localeRowStyle, backgroundColor: '#f8f9fa', fontWeight: '600', fontSize: '12px', color: '#666' }}>
              <div></div>
              <div>Language</div>
              <div>Translation</div>
              <div>Reviewed</div>
              <div>Direction</div>
              <div>Actions</div>
            </div>
            {enabledLocales.map((locale) => (
              <div key={locale.code} style={localeRowStyle}>
                <div style={{ fontSize: '24px' }}>{locale.flag}</div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a2e' }}>
                    {locale.name}
                    {locale.isDefault && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '10px',
                          backgroundColor: '#dbeafe',
                          color: '#2563eb',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{locale.nativeName}</div>
                </div>
                <div>
                  <div style={progressBarStyle(locale.translationProgress, '#10b981')}>
                    <div style={progressFillStyle(locale.translationProgress, '#10b981')} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {locale.translationProgress}%
                  </div>
                </div>
                <div>
                  <div style={progressBarStyle(locale.reviewedProgress, '#6366f1')}>
                    <div style={progressFillStyle(locale.reviewedProgress, '#6366f1')} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {locale.reviewedProgress}%
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor: locale.direction === 'rtl' ? '#fef3c7' : '#e0e7ff',
                      color: locale.direction === 'rtl' ? '#d97706' : '#4338ca',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    {locale.direction.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{ ...buttonStyle, backgroundColor: '#e0e7ff', color: '#4338ca', padding: '6px 12px' }}
                    onClick={() => setEditingLocale(locale)}
                  >
                    Edit
                  </button>
                  {!locale.isDefault && (
                    <button
                      style={{ ...buttonStyle, backgroundColor: '#fee2e2', color: '#dc2626', padding: '6px 12px' }}
                      onClick={() => handleToggleLocale(locale.code)}
                    >
                      Disable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Disabled Locales */}
          {disabledLocales.length > 0 && (
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Available Languages</h2>
              <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
                Enable these languages to make them available to users
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {disabledLocales.map((locale) => (
                  <div
                    key={locale.code}
                    style={{
                      padding: '16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div style={{ fontSize: '32px' }}>{locale.flag}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600' }}>{locale.name}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{locale.nativeName}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {locale.translationProgress}% translated
                      </div>
                    </div>
                    <button
                      style={{ ...buttonStyle, backgroundColor: '#10b981' }}
                      onClick={() => handleToggleLocale(locale.code)}
                    >
                      Enable
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Regional Settings</h2>

          <div style={settingRowStyle}>
            <div>
              <div style={{ fontWeight: '500' }}>Default Language</div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                The default language for new users
              </div>
            </div>
            <select
              value={settings.defaultLocale}
              onChange={(e) => {
                setSettings({ ...settings, defaultLocale: e.target.value });
                handleSetDefault(e.target.value);
              }}
              style={selectStyle}
            >
              {enabledLocales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          <div style={settingRowStyle}>
            <div>
              <div style={{ fontWeight: '500' }}>Fallback Language</div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Used when a translation is missing
              </div>
            </div>
            <select
              value={settings.fallbackLocale}
              onChange={(e) => setSettings({ ...settings, fallbackLocale: e.target.value })}
              style={selectStyle}
            >
              {enabledLocales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          <div style={settingRowStyle}>
            <div>
              <div style={{ fontWeight: '500' }}>Auto-Detect Language</div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Automatically detect user's preferred language from browser
              </div>
            </div>
            <div
              style={toggleStyle(settings.autoDetectLocale)}
              onClick={() => setSettings({ ...settings, autoDetectLocale: !settings.autoDetectLocale })}
            >
              <div style={toggleCircleStyle(settings.autoDetectLocale)} />
            </div>
          </div>

          <div style={settingRowStyle}>
            <div>
              <div style={{ fontWeight: '500' }}>Show Language Switcher</div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Display language selector in the app header
              </div>
            </div>
            <div
              style={toggleStyle(settings.showLanguageSwitcher)}
              onClick={() =>
                setSettings({ ...settings, showLanguageSwitcher: !settings.showLanguageSwitcher })
              }
            >
              <div style={toggleCircleStyle(settings.showLanguageSwitcher)} />
            </div>
          </div>

          <div style={settingRowStyle}>
            <div>
              <div style={{ fontWeight: '500' }}>Persist User Preference</div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Remember user's language choice across sessions
              </div>
            </div>
            <div
              style={toggleStyle(settings.persistPreference)}
              onClick={() => setSettings({ ...settings, persistPreference: !settings.persistPreference })}
            >
              <div style={toggleCircleStyle(settings.persistPreference)} />
            </div>
          </div>

          <div style={settingRowStyle}>
            <div>
              <div style={{ fontWeight: '500' }}>Use Geolocation</div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Use IP-based geolocation for initial language detection
              </div>
            </div>
            <div
              style={toggleStyle(settings.useGeolocation)}
              onClick={() => setSettings({ ...settings, useGeolocation: !settings.useGeolocation })}
            >
              <div style={toggleCircleStyle(settings.useGeolocation)} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Locale Modal */}
      {editingLocale && (
        <div style={modalOverlayStyle} onClick={() => setEditingLocale(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px' }}>
              Edit {editingLocale.flag} {editingLocale.name}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Date Format</label>
                <input
                  type="text"
                  value={editingLocale.dateFormat}
                  onChange={(e) => setEditingLocale({ ...editingLocale, dateFormat: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Time Format</label>
                <input
                  type="text"
                  value={editingLocale.timeFormat}
                  onChange={(e) => setEditingLocale({ ...editingLocale, timeFormat: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Decimal Separator</label>
                <input
                  type="text"
                  value={editingLocale.numberFormat.decimal}
                  onChange={(e) =>
                    setEditingLocale({
                      ...editingLocale,
                      numberFormat: { ...editingLocale.numberFormat, decimal: e.target.value },
                    })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Thousands Separator</label>
                <input
                  type="text"
                  value={editingLocale.numberFormat.thousands}
                  onChange={(e) =>
                    setEditingLocale({
                      ...editingLocale,
                      numberFormat: { ...editingLocale.numberFormat, thousands: e.target.value },
                    })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Currency Symbol</label>
                <input
                  type="text"
                  value={editingLocale.numberFormat.currency}
                  onChange={(e) =>
                    setEditingLocale({
                      ...editingLocale,
                      numberFormat: { ...editingLocale.numberFormat, currency: e.target.value },
                    })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Currency Code</label>
                <input
                  type="text"
                  value={editingLocale.currencyCode}
                  onChange={(e) =>
                    setEditingLocale({ ...editingLocale, currencyCode: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>First Day of Week</label>
                <select
                  value={editingLocale.firstDayOfWeek}
                  onChange={(e) =>
                    setEditingLocale({ ...editingLocale, firstDayOfWeek: parseInt(e.target.value) })
                  }
                  style={inputStyle}
                >
                  {daysOfWeek.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Text Direction</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  style={{
                    ...buttonStyle,
                    backgroundColor: editingLocale.direction === 'ltr' ? '#6366f1' : '#e5e7eb',
                    color: editingLocale.direction === 'ltr' ? 'white' : '#374151',
                  }}
                  onClick={() => setEditingLocale({ ...editingLocale, direction: 'ltr' })}
                >
                  Left-to-Right (LTR)
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    backgroundColor: editingLocale.direction === 'rtl' ? '#6366f1' : '#e5e7eb',
                    color: editingLocale.direction === 'rtl' ? 'white' : '#374151',
                  }}
                  onClick={() => setEditingLocale({ ...editingLocale, direction: 'rtl' })}
                >
                  Right-to-Left (RTL)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button style={buttonStyle} onClick={handleSaveLocale}>
                Save Changes
              </button>
              <button
                style={{ ...buttonStyle, backgroundColor: '#e5e7eb', color: '#374151' }}
                onClick={() => setEditingLocale(null)}
              >
                Cancel
              </button>
              {!editingLocale.isDefault && (
                <button
                  style={{ ...buttonStyle, backgroundColor: '#dbeafe', color: '#2563eb', marginLeft: 'auto' }}
                  onClick={() => {
                    handleSetDefault(editingLocale.code);
                    setEditingLocale(null);
                  }}
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocaleSettings;
