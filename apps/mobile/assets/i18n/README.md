# Locale-Specific Assets

This directory contains locale-specific assets for the UpCoach mobile app.

## Structure

```
i18n/
├── en-US/           # United States English
├── es-ES/           # Spain Spanish
├── pt-BR/           # Brazilian Portuguese
├── fr-FR/           # French (France)
├── de-DE/           # German (Germany)
└── ja-JP/           # Japanese (Japan)
```

## Asset Types

Each locale directory can contain:

### Images
- `onboarding/` - Localized onboarding screens
- `illustrations/` - Culturally adapted illustrations
- `icons/` - Locale-specific icons (if needed)
- `placeholders/` - Localized placeholder images

### Audio
- `voice/` - Localized voice guidance (future)
- `sounds/` - Locale-specific notification sounds (future)

### Data
- `templates/` - Localized habit/goal templates (JSON)
- `tips/` - Localized coaching tips (JSON)
- `achievements/` - Localized achievement data (JSON)

## Guidelines

### Image Localization
1. **Text in Images**: Replace any images containing text with localized versions
2. **Cultural Sensitivity**: Ensure images are culturally appropriate
3. **People Representation**: Consider ethnic diversity appropriate for the region
4. **Color Meanings**: Be aware of color symbolism (e.g., white = mourning in some Asian cultures)

### Data Localization
1. **Units**: Use metric for most locales, imperial for US
2. **Examples**: Use culturally relevant examples (e.g., local sports, foods)
3. **Names**: Use common names from that culture in examples
4. **Holidays**: Reference culturally relevant holidays and celebrations

### File Naming
- Use descriptive names: `onboarding_welcome.png`, `habit_fitness.png`
- Keep consistent naming across locales
- Use lowercase with underscores

## Usage in Code

```dart
// Load locale-specific image
Image.asset('assets/i18n/${currentLocale}/onboarding/welcome.png')

// Load locale-specific data
final templates = await rootBundle.loadString(
  'assets/i18n/${currentLocale}/templates/habits.json'
);
```

## Asset Optimization

- Compress images to reduce app size
- Use WebP format where supported
- Provide @2x and @3x versions for different screen densities
- Consider lazy loading for locale-specific assets

## Maintenance

- Update assets when translations change
- Review cultural appropriateness quarterly
- Test all locales before release
- Maintain consistency across platforms (mobile, web, admin)
