/**
 * Translation Editor
 *
 * Full-featured translation key editor for managing translations.
 * Supports inline editing, bulk operations, and translation suggestions.
 */

import React, { useState, useEffect, useMemo } from 'react';

// Types
interface TranslationKey {
  id: string;
  key: string;
  namespace: string;
  description?: string;
  placeholders?: { name: string; type: string; }[];
  pluralForms?: boolean;
  isDeprecated?: boolean;
}

interface Translation {
  id: string;
  keyId: string;
  locale: string;
  value: string;
  pluralForms?: Record<string, string>;
  status: 'pending' | 'translated' | 'reviewed' | 'approved';
  translatedBy?: string;
  updatedAt: Date;
  qualityScore?: number;
}

// Mock data
const generateMockKeys = (): TranslationKey[] => [
  { id: '1', key: 'common.save', namespace: 'common', description: 'Save button text' },
  { id: '2', key: 'common.cancel', namespace: 'common', description: 'Cancel button text' },
  { id: '3', key: 'common.delete', namespace: 'common', description: 'Delete button text' },
  { id: '4', key: 'common.edit', namespace: 'common', description: 'Edit button text' },
  { id: '5', key: 'common.loading', namespace: 'common', description: 'Loading indicator text' },
  { id: '6', key: 'auth.login', namespace: 'auth', description: 'Login button text' },
  { id: '7', key: 'auth.logout', namespace: 'auth', description: 'Logout button text' },
  { id: '8', key: 'auth.welcomeBack', namespace: 'auth', description: 'Welcome back greeting', placeholders: [{ name: 'name', type: 'string' }] },
  { id: '9', key: 'habits.title', namespace: 'habits', description: 'Habits section title' },
  { id: '10', key: 'habits.streak', namespace: 'habits', description: 'Streak label', pluralForms: true },
  { id: '11', key: 'habits.streakDays', namespace: 'habits', description: 'Streak days count', pluralForms: true, placeholders: [{ name: 'count', type: 'number' }] },
  { id: '12', key: 'goals.title', namespace: 'goals', description: 'Goals section title' },
  { id: '13', key: 'goals.progress', namespace: 'goals', description: 'Progress percentage', placeholders: [{ name: 'percent', type: 'percent' }] },
  { id: '14', key: 'coaching.title', namespace: 'coaching', description: 'Coaching section title' },
  { id: '15', key: 'coaching.aiCoach', namespace: 'coaching', description: 'AI coach title' },
  { id: '16', key: 'gamification.points', namespace: 'gamification', description: 'Points label', pluralForms: true },
  { id: '17', key: 'gamification.level', namespace: 'gamification', description: 'Level label', placeholders: [{ name: 'level', type: 'number' }] },
  { id: '18', key: 'settings.title', namespace: 'settings', description: 'Settings title' },
  { id: '19', key: 'settings.language', namespace: 'settings', description: 'Language selection' },
  { id: '20', key: 'errors.network', namespace: 'errors', description: 'Network error message' },
];

const generateMockTranslations = (keys: TranslationKey[]): Translation[] => {
  const locales = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
  const translations: Translation[] = [];

  const enValues: Record<string, string> = {
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'auth.login': 'Log In',
    'auth.logout': 'Log Out',
    'auth.welcomeBack': 'Welcome back, {{name}}!',
    'habits.title': 'My Habits',
    'habits.streak': '{{count}} day streak',
    'habits.streakDays': '{{count}} days',
    'goals.title': 'My Goals',
    'goals.progress': '{{percent}} complete',
    'coaching.title': 'Coaching',
    'coaching.aiCoach': 'AI Coach',
    'gamification.points': '{{count}} points',
    'gamification.level': 'Level {{level}}',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'errors.network': 'Network error. Please check your connection.',
  };

  const esValues: Record<string, string> = {
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.loading': 'Cargando...',
    'auth.login': 'Iniciar Sesión',
    'auth.logout': 'Cerrar Sesión',
    'auth.welcomeBack': '¡Bienvenido de nuevo, {{name}}!',
    'habits.title': 'Mis Hábitos',
    'habits.streak': 'Racha de {{count}} días',
    'goals.title': 'Mis Metas',
    'coaching.title': 'Coaching',
    'settings.title': 'Configuración',
    'settings.language': 'Idioma',
    'errors.network': 'Error de red. Por favor, verifica tu conexión.',
  };

  keys.forEach((key, keyIndex) => {
    locales.forEach((locale, localeIndex) => {
      const hasTranslation = locale === 'en' || Math.random() > 0.2;
      if (!hasTranslation && locale !== 'en') return;

      let value = '';
      if (locale === 'en') {
        value = enValues[key.key] || key.key;
      } else if (locale === 'es' && esValues[key.key]) {
        value = esValues[key.key];
      } else {
        value = `[${locale}] ${enValues[key.key] || key.key}`;
      }

      translations.push({
        id: `${key.id}-${locale}`,
        keyId: key.id,
        locale,
        value,
        status: locale === 'en' ? 'approved' : ['pending', 'translated', 'reviewed', 'approved'][Math.floor(Math.random() * 4)] as any,
        translatedBy: locale === 'en' ? undefined : 'translator@example.com',
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        qualityScore: 70 + Math.floor(Math.random() * 30),
      });
    });
  });

  return translations;
};

const namespaces = ['common', 'auth', 'habits', 'goals', 'coaching', 'gamification', 'settings', 'notifications', 'errors', 'validation'];
const locales = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
];

export const TranslationEditor: React.FC = () => {
  const [keys, setKeys] = useState<TranslationKey[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<string>('es');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Editor state
  const [selectedKey, setSelectedKey] = useState<TranslationKey | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingPluralForms, setEditingPluralForms] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockKeys = generateMockKeys();
    setKeys(mockKeys);
    setTranslations(generateMockTranslations(mockKeys));
    setLoading(false);
  };

  const filteredKeys = useMemo(() => {
    return keys.filter(key => {
      // Search filter
      if (searchQuery && !key.key.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !key.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Namespace filter
      if (selectedNamespace && key.namespace !== selectedNamespace) {
        return false;
      }

      // Status filter
      if (statusFilter) {
        const translation = translations.find(t => t.keyId === key.id && t.locale === selectedLocale);
        if (statusFilter === 'missing' && translation) return false;
        if (statusFilter !== 'missing' && translation?.status !== statusFilter) return false;
      }

      return true;
    });
  }, [keys, searchQuery, selectedNamespace, statusFilter, selectedLocale, translations]);

  const getTranslation = (keyId: string, locale: string): Translation | undefined => {
    return translations.find(t => t.keyId === keyId && t.locale === locale);
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'reviewed': return '#eab308';
      case 'translated': return '#3b82f6';
      case 'pending': return '#f97316';
      default: return '#ef4444';
    }
  };

  const handleSelectKey = (key: TranslationKey) => {
    setSelectedKey(key);
    const translation = getTranslation(key.id, selectedLocale);
    setEditingValue(translation?.value || '');
    setEditingPluralForms(translation?.pluralForms || {});
  };

  const handleSaveTranslation = () => {
    if (!selectedKey) return;

    const existingIndex = translations.findIndex(
      t => t.keyId === selectedKey.id && t.locale === selectedLocale
    );

    const newTranslation: Translation = {
      id: existingIndex >= 0 ? translations[existingIndex].id : `${selectedKey.id}-${selectedLocale}`,
      keyId: selectedKey.id,
      locale: selectedLocale,
      value: editingValue,
      pluralForms: selectedKey.pluralForms ? editingPluralForms : undefined,
      status: 'translated',
      translatedBy: 'current-user@example.com',
      updatedAt: new Date(),
      qualityScore: 85,
    };

    if (existingIndex >= 0) {
      const newTranslations = [...translations];
      newTranslations[existingIndex] = newTranslation;
      setTranslations(newTranslations);
    } else {
      setTranslations([...translations, newTranslation]);
    }

    // Clear selection
    setSelectedKey(null);
    setEditingValue('');
    setEditingPluralForms({});
  };

  const handleApprove = (keyId: string) => {
    const index = translations.findIndex(t => t.keyId === keyId && t.locale === selectedLocale);
    if (index >= 0) {
      const newTranslations = [...translations];
      newTranslations[index] = { ...newTranslations[index], status: 'approved' };
      setTranslations(newTranslations);
    }
  };

  const handleBulkApprove = () => {
    const newTranslations = translations.map(t => {
      if (t.locale === selectedLocale && t.status !== 'approved') {
        const key = keys.find(k => k.id === t.keyId);
        if (key && filteredKeys.includes(key)) {
          return { ...t, status: 'approved' as const };
        }
      }
      return t;
    });
    setTranslations(newTranslations);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading translations...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Translation Editor</h1>
          <p style={styles.subtitle}>Edit and manage translation keys</p>
        </div>
        <div style={styles.headerActions}>
          <select
            style={styles.select}
            value={selectedLocale}
            onChange={e => setSelectedLocale(e.target.value)}
          >
            {locales.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <button style={styles.secondaryButton} onClick={handleBulkApprove}>
            Bulk Approve
          </button>
          <button style={styles.primaryButton}>
            Export {selectedLocale.toUpperCase()}
          </button>
        </div>
      </header>

      <div style={styles.mainContent}>
        {/* Sidebar - Filters and Key List */}
        <div style={styles.sidebar}>
          {/* Search */}
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search keys..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div style={styles.filterSection}>
            <label style={styles.filterLabel}>Namespace</label>
            <select
              style={styles.filterSelect}
              value={selectedNamespace || ''}
              onChange={e => setSelectedNamespace(e.target.value || null)}
            >
              <option value="">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterSection}>
            <label style={styles.filterLabel}>Status</label>
            <select
              style={styles.filterSelect}
              value={statusFilter || ''}
              onChange={e => setStatusFilter(e.target.value || null)}
            >
              <option value="">All Statuses</option>
              <option value="missing">Missing</option>
              <option value="pending">Pending</option>
              <option value="translated">Translated</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          {/* Key List */}
          <div style={styles.keyList}>
            <div style={styles.keyListHeader}>
              <span>{filteredKeys.length} keys</span>
            </div>
            {filteredKeys.map(key => {
              const translation = getTranslation(key.id, selectedLocale);
              return (
                <div
                  key={key.id}
                  style={{
                    ...styles.keyItem,
                    backgroundColor: selectedKey?.id === key.id ? '#eff6ff' : 'white',
                    borderLeft: `3px solid ${getStatusColor(translation?.status)}`,
                  }}
                  onClick={() => handleSelectKey(key)}
                >
                  <div style={styles.keyName}>{key.key}</div>
                  <div style={styles.keyMeta}>
                    <span style={styles.namespace}>{key.namespace}</span>
                    {key.pluralForms && <span style={styles.badge}>Plural</span>}
                    {key.placeholders && <span style={styles.badge}>Params</span>}
                  </div>
                  <div style={styles.keyValue}>
                    {translation?.value || <em style={{ color: '#9ca3af' }}>Not translated</em>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Editor Panel */}
        <div style={styles.editorPanel}>
          {selectedKey ? (
            <>
              <div style={styles.editorHeader}>
                <h2 style={styles.editorTitle}>{selectedKey.key}</h2>
                <span style={styles.editorNamespace}>{selectedKey.namespace}</span>
              </div>

              {selectedKey.description && (
                <p style={styles.editorDescription}>{selectedKey.description}</p>
              )}

              {selectedKey.placeholders && (
                <div style={styles.placeholdersSection}>
                  <label style={styles.editorLabel}>Placeholders</label>
                  <div style={styles.placeholdersList}>
                    {selectedKey.placeholders.map((p, i) => (
                      <span key={i} style={styles.placeholder}>
                        {`{{${p.name}}}`} <span style={styles.placeholderType}>({p.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Source (English) */}
              <div style={styles.sourceSection}>
                <label style={styles.editorLabel}>Source (English)</label>
                <div style={styles.sourceText}>
                  {getTranslation(selectedKey.id, 'en')?.value || selectedKey.key}
                </div>
              </div>

              {/* Translation Input */}
              <div style={styles.translationSection}>
                <label style={styles.editorLabel}>
                  Translation ({selectedLocale.toUpperCase()})
                </label>

                {selectedKey.pluralForms ? (
                  <div style={styles.pluralForms}>
                    {['zero', 'one', 'other'].map(form => (
                      <div key={form} style={styles.pluralFormInput}>
                        <label style={styles.pluralLabel}>{form}</label>
                        <input
                          type="text"
                          style={styles.input}
                          value={editingPluralForms[form] || ''}
                          onChange={e => setEditingPluralForms({
                            ...editingPluralForms,
                            [form]: e.target.value,
                          })}
                          placeholder={`${form} form...`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <textarea
                    style={styles.textarea}
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    placeholder="Enter translation..."
                    rows={4}
                  />
                )}
              </div>

              {/* Current Status */}
              {getTranslation(selectedKey.id, selectedLocale) && (
                <div style={styles.statusSection}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(getTranslation(selectedKey.id, selectedLocale)?.status),
                    }}
                  >
                    {getTranslation(selectedKey.id, selectedLocale)?.status}
                  </span>
                  <span style={styles.qualityScore}>
                    Quality: {getTranslation(selectedKey.id, selectedLocale)?.qualityScore}%
                  </span>
                </div>
              )}

              {/* Actions */}
              <div style={styles.editorActions}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => {
                    setSelectedKey(null);
                    setEditingValue('');
                    setEditingPluralForms({});
                  }}
                >
                  Cancel
                </button>
                <button style={styles.approveButton} onClick={() => handleApprove(selectedKey.id)}>
                  Approve
                </button>
                <button style={styles.primaryButton} onClick={handleSaveTranslation}>
                  Save Translation
                </button>
              </div>

              {/* Suggestions */}
              <div style={styles.suggestionsSection}>
                <h3 style={styles.suggestionsTitle}>Suggestions</h3>
                <div style={styles.suggestionItem}>
                  <div style={styles.suggestionSource}>Machine Translation</div>
                  <div style={styles.suggestionText}>
                    {`[Auto-translated] ${getTranslation(selectedKey.id, 'en')?.value || selectedKey.key}`}
                  </div>
                  <button style={styles.useSuggestionButton}>Use</button>
                </div>
                <div style={styles.suggestionItem}>
                  <div style={styles.suggestionSource}>Translation Memory</div>
                  <div style={styles.suggestionText}>
                    Similar key found with 85% match
                  </div>
                  <button style={styles.useSuggestionButton}>Use</button>
                </div>
              </div>
            </>
          ) : (
            <div style={styles.noSelection}>
              <div style={styles.noSelectionIcon}>📝</div>
              <h3 style={styles.noSelectionTitle}>Select a key to edit</h3>
              <p style={styles.noSelectionText}>
                Choose a translation key from the list to view and edit its translations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1600px',
    margin: '0 auto',
    height: 'calc(100vh - 80px)',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  select: {
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '150px',
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  approveButton: {
    padding: '10px 20px',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  mainContent: {
    display: 'flex',
    gap: '24px',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflow: 'hidden',
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  filterSelect: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  keyList: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  keyListHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  keyItem: {
    padding: '14px 16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  keyName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    fontFamily: 'monospace',
  },
  keyMeta: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px',
  },
  namespace: {
    fontSize: '11px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  badge: {
    fontSize: '10px',
    color: '#7c3aed',
    backgroundColor: '#ede9fe',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  keyValue: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  editorPanel: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    overflow: 'auto',
  },
  editorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  editorTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
    fontFamily: 'monospace',
    margin: 0,
  },
  editorNamespace: {
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  editorDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px',
  },
  editorLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  placeholdersSection: {
    marginBottom: '20px',
  },
  placeholdersList: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  placeholder: {
    fontSize: '13px',
    fontFamily: 'monospace',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  placeholderType: {
    color: '#b45309',
    fontSize: '11px',
  },
  sourceSection: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  sourceText: {
    fontSize: '15px',
    color: '#374151',
    lineHeight: 1.6,
  },
  translationSection: {
    marginBottom: '20px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    lineHeight: 1.6,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  pluralForms: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pluralFormInput: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pluralLabel: {
    width: '60px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#6b7280',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    textTransform: 'capitalize',
  },
  qualityScore: {
    fontSize: '13px',
    color: '#6b7280',
  },
  editorActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
    marginBottom: '24px',
  },
  suggestionsSection: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
  },
  suggestionsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 12px 0',
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '6px',
    marginBottom: '8px',
  },
  suggestionSource: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  suggestionText: {
    flex: 1,
    fontSize: '13px',
    color: '#374151',
  },
  useSuggestionButton: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    color: '#6b7280',
  },
  noSelectionIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  noSelectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 8px 0',
  },
  noSelectionText: {
    fontSize: '14px',
    maxWidth: '300px',
  },
};

export default TranslationEditor;
