/**
 * GlossaryManager Page
 *
 * Manages translation glossary terms for consistent terminology across languages.
 */

import React, { useState, useMemo } from 'react';

// Types
interface GlossaryTerm {
  id: string;
  sourceTerm: string;
  description: string;
  category: string;
  translations: Record<string, string>;
  caseSensitive: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

interface GlossaryCategory {
  id: string;
  name: string;
  description: string;
  termCount: number;
}

// Mock data
const mockCategories: GlossaryCategory[] = [
  { id: 'product', name: 'Product Terms', description: 'App-specific terminology', termCount: 45 },
  { id: 'coaching', name: 'Coaching Terms', description: 'Coaching and wellness vocabulary', termCount: 32 },
  { id: 'ui', name: 'UI Elements', description: 'User interface labels', termCount: 28 },
  { id: 'legal', name: 'Legal Terms', description: 'Terms of service and privacy', termCount: 15 },
  { id: 'marketing', name: 'Marketing', description: 'Marketing and promotional content', termCount: 22 },
];

const mockTerms: GlossaryTerm[] = [
  {
    id: '1',
    sourceTerm: 'streak',
    description: 'Consecutive days of completing a habit',
    category: 'product',
    translations: {
      es: 'racha',
      fr: 'série',
      de: 'Serie',
      ja: '連続記録',
      zh: '连续记录',
      ar: 'سلسلة',
    },
    caseSensitive: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    usageCount: 156,
  },
  {
    id: '2',
    sourceTerm: 'habit',
    description: 'A regular practice or routine',
    category: 'coaching',
    translations: {
      es: 'hábito',
      fr: 'habitude',
      de: 'Gewohnheit',
      ja: '習慣',
      zh: '习惯',
      ar: 'عادة',
    },
    caseSensitive: false,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T11:15:00Z',
    usageCount: 342,
  },
  {
    id: '3',
    sourceTerm: 'goal',
    description: 'A desired outcome or objective',
    category: 'coaching',
    translations: {
      es: 'meta',
      fr: 'objectif',
      de: 'Ziel',
      ja: '目標',
      zh: '目标',
      ar: 'هدف',
    },
    caseSensitive: false,
    createdAt: '2024-01-08T08:00:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
    usageCount: 289,
  },
  {
    id: '4',
    sourceTerm: 'coach',
    description: 'A professional who guides users',
    category: 'product',
    translations: {
      es: 'entrenador',
      fr: 'coach',
      de: 'Coach',
      ja: 'コーチ',
      zh: '教练',
      ar: 'مدرب',
    },
    caseSensitive: false,
    createdAt: '2024-01-05T12:00:00Z',
    updatedAt: '2024-01-17T09:30:00Z',
    usageCount: 198,
  },
  {
    id: '5',
    sourceTerm: 'milestone',
    description: 'A significant achievement point',
    category: 'product',
    translations: {
      es: 'hito',
      fr: 'étape',
      de: 'Meilenstein',
      ja: 'マイルストーン',
      zh: '里程碑',
      ar: 'معلم',
    },
    caseSensitive: false,
    createdAt: '2024-01-12T15:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
    usageCount: 87,
  },
  {
    id: '6',
    sourceTerm: 'UpCoach',
    description: 'Product name - do not translate',
    category: 'product',
    translations: {
      es: 'UpCoach',
      fr: 'UpCoach',
      de: 'UpCoach',
      ja: 'UpCoach',
      zh: 'UpCoach',
      ar: 'UpCoach',
    },
    caseSensitive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usageCount: 567,
  },
];

const supportedLocales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

export const GlossaryManager: React.FC = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>(mockTerms);
  const [categories] = useState<GlossaryCategory[]>(mockCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [newTerm, setNewTerm] = useState({
    sourceTerm: '',
    description: '',
    category: 'product',
    caseSensitive: false,
    translations: {} as Record<string, string>,
  });

  // Filter terms
  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
      const matchesSearch =
        term.sourceTerm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(term.translations).some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [terms, selectedCategory, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTerms = terms.length;
    const totalTranslations = terms.reduce(
      (acc, term) => acc + Object.keys(term.translations).length,
      0
    );
    const averageUsage = Math.round(
      terms.reduce((acc, term) => acc + term.usageCount, 0) / terms.length
    );
    const caseSensitiveCount = terms.filter((t) => t.caseSensitive).length;

    return { totalTerms, totalTranslations, averageUsage, caseSensitiveCount };
  }, [terms]);

  const handleAddTerm = () => {
    const term: GlossaryTerm = {
      id: Date.now().toString(),
      ...newTerm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };
    setTerms([...terms, term]);
    setShowAddModal(false);
    setNewTerm({
      sourceTerm: '',
      description: '',
      category: 'product',
      caseSensitive: false,
      translations: {},
    });
  };

  const handleUpdateTerm = () => {
    if (!editingTerm) return;
    setTerms(
      terms.map((t) =>
        t.id === editingTerm.id ? { ...editingTerm, updatedAt: new Date().toISOString() } : t
      )
    );
    setEditingTerm(null);
  };

  const handleDeleteTerm = (id: string) => {
    if (window.confirm('Are you sure you want to delete this glossary term?')) {
      setTerms(terms.filter((t) => t.id !== id));
    }
  };

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

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const contentStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '24px',
  };

  const sidebarStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    height: 'fit-content',
  };

  const mainContentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  };

  const categoryItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#6366f1' : 'transparent',
    color: isSelected ? 'white' : '#333',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s',
  });

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e0e0e0',
    color: '#666',
    fontSize: '12px',
    textTransform: 'uppercase',
    fontWeight: '600',
  };

  const tdStyle: React.CSSProperties = {
    padding: '16px 12px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'top',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  };

  const smallButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
  };

  const translationBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '8px',
    marginBottom: '4px',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Glossary Manager</h1>
          <p style={{ color: '#666', marginTop: '4px' }}>
            Manage translation glossary for consistent terminology
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{ ...buttonStyle, backgroundColor: '#10b981' }}
            onClick={() => alert('Exporting glossary...')}
          >
            Export Glossary
          </button>
          <button style={buttonStyle} onClick={() => setShowAddModal(true)}>
            + Add Term
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6366f1' }}>
            {stats.totalTerms}
          </div>
          <div style={{ color: '#666', marginTop: '4px' }}>Total Terms</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {stats.totalTranslations}
          </div>
          <div style={{ color: '#666', marginTop: '4px' }}>Total Translations</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
            {stats.averageUsage}
          </div>
          <div style={{ color: '#666', marginTop: '4px' }}>Avg. Usage Count</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
            {stats.caseSensitiveCount}
          </div>
          <div style={{ color: '#666', marginTop: '4px' }}>Case Sensitive Terms</div>
        </div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Sidebar - Categories */}
        <div style={sidebarStyle}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Categories</h3>
          <div
            style={categoryItemStyle(selectedCategory === 'all')}
            onClick={() => setSelectedCategory('all')}
          >
            <span>All Terms</span>
            <span style={{ opacity: 0.7 }}>{terms.length}</span>
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={categoryItemStyle(selectedCategory === cat.id)}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.name}</span>
              <span style={{ opacity: 0.7 }}>{cat.termCount}</span>
            </div>
          ))}
        </div>

        {/* Main - Terms Table */}
        <div style={mainContentStyle}>
          <input
            type="text"
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Source Term</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Translations</th>
                <th style={thStyle}>Usage</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerms.map((term) => (
                <tr key={term.id}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#1a1a2e' }}>{term.sourceTerm}</div>
                    {term.caseSensitive && (
                      <span
                        style={{
                          fontSize: '10px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginTop: '4px',
                          display: 'inline-block',
                        }}
                      >
                        Case Sensitive
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: '#666', maxWidth: '200px' }}>
                    {term.description}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {Object.entries(term.translations).map(([locale, translation]) => (
                        <span key={locale} style={translationBadgeStyle}>
                          <strong>{locale}:</strong> {translation}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: '500' }}>{term.usageCount}</span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={{ ...smallButtonStyle, backgroundColor: '#e0e7ff', color: '#4338ca' }}
                      onClick={() => setEditingTerm(term)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...smallButtonStyle, backgroundColor: '#fee2e2', color: '#dc2626' }}
                      onClick={() => handleDeleteTerm(term.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={modalOverlayStyle} onClick={() => setShowAddModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px' }}>Add Glossary Term</h2>

            <label style={labelStyle}>Source Term (English)</label>
            <input
              type="text"
              value={newTerm.sourceTerm}
              onChange={(e) => setNewTerm({ ...newTerm, sourceTerm: e.target.value })}
              style={inputStyle}
              placeholder="e.g., streak"
            />

            <label style={labelStyle}>Description</label>
            <input
              type="text"
              value={newTerm.description}
              onChange={(e) => setNewTerm({ ...newTerm, description: e.target.value })}
              style={inputStyle}
              placeholder="Brief description of the term"
            />

            <label style={labelStyle}>Category</label>
            <select
              value={newTerm.category}
              onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
              style={inputStyle}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={newTerm.caseSensitive}
                onChange={(e) => setNewTerm({ ...newTerm, caseSensitive: e.target.checked })}
              />
              Case Sensitive (Do not modify casing)
            </label>

            <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Translations</h3>
            {supportedLocales
              .filter((l) => l.code !== 'en')
              .map((locale) => (
                <div key={locale.code} style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>
                    {locale.flag} {locale.name}
                  </label>
                  <input
                    type="text"
                    value={newTerm.translations[locale.code] || ''}
                    onChange={(e) =>
                      setNewTerm({
                        ...newTerm,
                        translations: { ...newTerm.translations, [locale.code]: e.target.value },
                      })
                    }
                    style={inputStyle}
                    placeholder={`Translation in ${locale.name}`}
                  />
                </div>
              ))}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button style={buttonStyle} onClick={handleAddTerm}>
                Add Term
              </button>
              <button
                style={{ ...buttonStyle, backgroundColor: '#e5e7eb', color: '#374151' }}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTerm && (
        <div style={modalOverlayStyle} onClick={() => setEditingTerm(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px' }}>Edit Glossary Term</h2>

            <label style={labelStyle}>Source Term (English)</label>
            <input
              type="text"
              value={editingTerm.sourceTerm}
              onChange={(e) => setEditingTerm({ ...editingTerm, sourceTerm: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Description</label>
            <input
              type="text"
              value={editingTerm.description}
              onChange={(e) => setEditingTerm({ ...editingTerm, description: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Category</label>
            <select
              value={editingTerm.category}
              onChange={(e) => setEditingTerm({ ...editingTerm, category: e.target.value })}
              style={inputStyle}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={editingTerm.caseSensitive}
                onChange={(e) => setEditingTerm({ ...editingTerm, caseSensitive: e.target.checked })}
              />
              Case Sensitive
            </label>

            <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Translations</h3>
            {supportedLocales
              .filter((l) => l.code !== 'en')
              .map((locale) => (
                <div key={locale.code} style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>
                    {locale.flag} {locale.name}
                  </label>
                  <input
                    type="text"
                    value={editingTerm.translations[locale.code] || ''}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        translations: {
                          ...editingTerm.translations,
                          [locale.code]: e.target.value,
                        },
                      })
                    }
                    style={inputStyle}
                  />
                </div>
              ))}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button style={buttonStyle} onClick={handleUpdateTerm}>
                Save Changes
              </button>
              <button
                style={{ ...buttonStyle, backgroundColor: '#e5e7eb', color: '#374151' }}
                onClick={() => setEditingTerm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlossaryManager;
