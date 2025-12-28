# Legal Documents - Localized Privacy Policies & Terms

This directory contains localized legal documents for the UpCoach platform, ensuring compliance with regional data protection laws.

## Structure

```
legal/
├── en-US/          # United States English
│   ├── privacy-policy.md
│   ├── terms-of-service.md
│   ├── cookie-policy.md
│   └── ccpa-notice.md (California residents)
├── es-ES/          # Spanish (Spain)
│   ├── privacy-policy.md
│   ├── terms-of-service.md
│   └── gdpr-notice.md
├── pt-BR/          # Portuguese (Brazil)
│   ├── privacy-policy.md
│   ├── terms-of-service.md
│   └── lgpd-notice.md
├── fr-FR/          # French (France)
│   ├── privacy-policy.md
│   ├── terms-of-service.md
│   └── gdpr-notice.md
├── de-DE/          # German (Germany)
│   ├── privacy-policy.md
│   ├── terms-of-service.md
│   └── gdpr-notice.md
└── ja-JP/          # Japanese (Japan)
    ├── privacy-policy.md
    ├── terms-of-service.md
    └── appi-notice.md (Act on the Protection of Personal Information)
```

## Compliance Requirements by Region

### European Union (GDPR)
**Locales**: de-DE, fr-FR, es-ES, and other EU countries

**Required Documents**:
- Privacy Policy with GDPR-specific disclosures
- Cookie Policy with granular consent
- GDPR Rights Notice (Access, Delete, Portability, etc.)
- Data Processing Agreement (for business customers)

**Key Requirements**:
- Explicit opt-in consent for non-essential data processing
- Clear explanation of legal basis for processing
- Data retention periods
- DPO contact information
- International data transfer mechanisms (SCCs)
- Right to withdraw consent
- Right to lodge complaint with supervisory authority

### United States - California (CCPA/CPRA)
**Locale**: en-US (with state detection)

**Required Documents**:
- Privacy Policy with CCPA-specific disclosures
- CCPA Consumer Rights Notice
- "Do Not Sell My Personal Information" notice

**Key Requirements**:
- Categories of personal information collected
- Business/commercial purposes for collection
- Categories of third parties with whom data is shared
- Right to know, delete, and opt-out
- Non-discrimination clause
- Financial incentives disclosure

### Brazil (LGPD)
**Locale**: pt-BR

**Required Documents**:
- Privacy Policy with LGPD-specific disclosures
- LGPD Rights Notice

**Key Requirements**:
- Purpose and legal basis for processing
- Data retention periods
- Information about international transfers
- DPO contact information
- Rights to access, correction, and deletion
- Parental consent for minors under 18

### Japan (APPI)
**Locale**: ja-JP

**Required Documents**:
- Privacy Policy with APPI-specific disclosures
- APPI Notice

**Key Requirements**:
- Purpose of use
- Scope of shared use
- Contact information for inquiries
- Cross-border transfer notice
- Rights to disclosure, correction, suspension

## Document Versioning

All legal documents must be versioned to track changes:

**Version Format**: `v{major}.{minor}.{patch}`
- Major: Significant changes requiring re-consent
- Minor: Clarifications or minor additions
- Patch: Typo fixes or formatting

**Metadata**:
```yaml
---
version: v1.2.0
effective_date: 2024-12-28
last_updated: 2024-12-28
jurisdiction: EU
legal_framework: GDPR
language: de-DE
---
```

## Translation Guidelines

1. **Legal Accuracy**: Have legal translations reviewed by qualified legal professionals in each jurisdiction
2. **Consistency**: Use consistent terminology across all documents in the same language
3. **Clarity**: Ensure language is clear and accessible (GDPR Article 12 requirement)
4. **Cultural Adaptation**: Adapt examples and references to local context
5. **Legal Requirements**: Include all required disclosures for each jurisdiction

## Implementation

### Web Application
```typescript
import { useLocale } from '@/hooks/useLocale';

const PrivacyPolicy = () => {
  const { locale } = useLocale();
  const policyUrl = `/legal/${locale}/privacy-policy.md`;

  // Fetch and render policy
};
```

### Mobile Application
```dart
import 'package:flutter/services.dart';

Future<String> loadPrivacyPolicy(String locale) async {
  return await rootBundle.loadString('assets/legal/$locale/privacy-policy.md');
}
```

### API Endpoint
```typescript
app.get('/api/legal/:document/:locale?', async (req, res) => {
  const { document, locale = 'en-US' } = req.params;
  const filePath = path.join(__dirname, 'public/legal', locale, `${document}.md`);
  // Serve document
});
```

## Consent Integration

Privacy policies must integrate with consent management:

```typescript
import { ConsentRecordHelper } from '@/models/compliance/ConsentRecord';

// Record consent with policy version
await ConsentRecordHelper.recordConsent({
  userId: user.id,
  consentType: 'essential',
  granted: true,
  explicitConsent: true,
  purpose: 'Accept Privacy Policy',
  legalBasis: 'GDPR Article 6(1)(a)',
  version: 'v1.2.0', // Must match privacy policy version
  countryCode: 'DE',
});
```

## Maintenance Schedule

- **Quarterly Review**: Review for accuracy and compliance
- **Annual Update**: Update for new regulations or business changes
- **Incident Updates**: Update within 72 hours of data breach
- **Feature Updates**: Update within 30 days of new data processing features

## Legal Review Checklist

Before deploying updated policies:

- [ ] Legal counsel review in each jurisdiction
- [ ] Verification of all required disclosures
- [ ] Check translation accuracy
- [ ] Update version number
- [ ] Set effective date (minimum 30 days notice for major changes)
- [ ] Notify existing users of changes
- [ ] Archive previous versions
- [ ] Update consent management system

## Support

For legal questions or document updates, contact:
- **Data Protection Officer**: dpo@upcoach.com
- **Legal Department**: legal@upcoach.com
