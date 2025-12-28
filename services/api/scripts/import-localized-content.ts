/**
 * Content Import Script - Phase 14 Week 3
 * Bulk import localized habit templates, goal templates, and coaching tips
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import LocalizedContent, { LocalizedContentHelper, ContentType } from '../src/models/i18n/LocalizedContent';
import sequelize from '../src/config/database';

interface ImportableContent {
  referenceId?: string;
  type: ContentType;
  defaultLocale: string;
  translations: Record<string, {
    title: string;
    description?: string;
    content: any;
  }>;
}

interface ImportOptions {
  skipExisting?: boolean;
  validateOnly?: boolean;
  updateExisting?: boolean;
  defaultStatus?: 'draft' | 'pending_review' | 'published';
}

class ContentImporter {
  private stats = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  /**
   * Import content from JSON file
   */
  async importFromFile(
    filePath: string,
    options: ImportOptions = {}
  ): Promise<void> {
    console.log(`\n📥 Importing content from: ${filePath}\n`);

    try {
      // Read file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: ImportableContent[] = JSON.parse(fileContent);

      // Validate data
      if (!Array.isArray(data)) {
        throw new Error('File must contain an array of content items');
      }

      console.log(`Found ${data.length} content items to import\n`);

      // Import each item
      for (const item of data) {
        await this.importContentItem(item, options);
      }

      // Print summary
      this.printSummary();
    } catch (error) {
      console.error(`❌ Error importing file: ${error}`);
      throw error;
    }
  }

  /**
   * Import single content item
   */
  private async importContentItem(
    item: ImportableContent,
    options: ImportOptions
  ): Promise<void> {
    this.stats.total++;

    try {
      // Generate or use provided reference ID
      const referenceId = item.referenceId || uuidv4();

      // Validate content type
      if (!item.type) {
        throw new Error(`Missing content type for item ${referenceId}`);
      }

      // Validate translations
      if (!item.translations || Object.keys(item.translations).length === 0) {
        throw new Error(`No translations provided for item ${referenceId}`);
      }

      // Check if content already exists
      const existingContent = await LocalizedContentHelper.getAllLocales(referenceId);

      if (existingContent.length > 0) {
        if (options.skipExisting) {
          console.log(`⏭️  Skipping existing: ${referenceId}`);
          this.stats.skipped++;
          return;
        }

        if (!options.updateExisting) {
          console.log(`⚠️  Content exists but update not enabled: ${referenceId}`);
          this.stats.skipped++;
          return;
        }
      }

      // Validate only mode
      if (options.validateOnly) {
        console.log(`✅ Valid: ${item.type} - ${referenceId}`);
        return;
      }

      // Import each translation
      for (const [locale, translation] of Object.entries(item.translations)) {
        const isDefault = locale === item.defaultLocale;

        // Check if this locale already exists
        const existing = await LocalizedContentHelper.getByReferenceAndLocale(
          referenceId,
          locale
        );

        if (existing) {
          if (options.updateExisting) {
            await LocalizedContentHelper.update(existing.id, {
              title: translation.title,
              description: translation.description,
              content: translation.content,
              status: options.defaultStatus,
            });

            console.log(`🔄 Updated: ${locale} - ${translation.title}`);
            this.stats.updated++;
          } else {
            this.stats.skipped++;
          }
        } else {
          // Create new localized content
          await LocalizedContentHelper.create(
            referenceId,
            item.type,
            locale,
            {
              title: translation.title,
              description: translation.description,
              content: translation.content,
              status: options.defaultStatus || 'draft',
              isDefault,
              metadata: {
                translatedBy: 'human',
                qualityScore: 100,
              },
            }
          );

          console.log(`✨ Created: ${locale} - ${translation.title}`);
          this.stats.created++;
        }
      }
    } catch (error) {
      console.error(`❌ Error importing item: ${error}`);
      this.stats.errors++;
    }
  }

  /**
   * Import habit templates
   */
  async importHabitTemplates(
    filePath: string,
    options: ImportOptions = {}
  ): Promise<void> {
    console.log(`\n📥 Importing habit templates...\n`);
    await this.importFromFile(filePath, options);
  }

  /**
   * Import goal templates
   */
  async importGoalTemplates(
    filePath: string,
    options: ImportOptions = {}
  ): Promise<void> {
    console.log(`\n📥 Importing goal templates...\n`);
    await this.importFromFile(filePath, options);
  }

  /**
   * Import coaching tips
   */
  async importCoachingTips(
    filePath: string,
    options: ImportOptions = {}
  ): Promise<void> {
    console.log(`\n📥 Importing coaching tips...\n`);
    await this.importFromFile(filePath, options);
  }

  /**
   * Print import summary
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Import Summary');
    console.log('='.repeat(50));
    console.log(`Total items processed: ${this.stats.total}`);
    console.log(`✨ Created: ${this.stats.created}`);
    console.log(`🔄 Updated: ${this.stats.updated}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Export content to JSON
   */
  async exportToFile(
    contentType: ContentType,
    locale: string,
    outputPath: string
  ): Promise<void> {
    console.log(`\n📤 Exporting ${contentType} for ${locale}...\n`);

    try {
      const content = await LocalizedContentHelper.getPublishedByTypeAndLocale(
        contentType,
        locale
      );

      const exportData = content.map(item => ({
        referenceId: item.referenceId,
        type: item.contentType,
        locale: item.locale,
        title: item.title,
        description: item.description,
        content: item.content,
        metadata: item.metadata,
        version: item.version,
        publishedAt: item.publishedAt,
      }));

      await fs.writeFile(
        outputPath,
        JSON.stringify(exportData, null, 2),
        'utf-8'
      );

      console.log(`✅ Exported ${exportData.length} items to ${outputPath}\n`);
    } catch (error) {
      console.error(`❌ Error exporting: ${error}`);
      throw error;
    }
  }

  /**
   * Generate localization coverage report
   */
  async generateCoverageReport(
    contentType: ContentType,
    targetLocales: string[]
  ): Promise<void> {
    console.log(`\n📊 Localization Coverage Report - ${contentType}\n`);

    const coverage = await LocalizedContentHelper.getLocalizationCoverage(
      contentType,
      targetLocales
    );

    console.log(`Total items: ${coverage.totalItems}`);
    console.log(`Missing translations: ${coverage.missingTranslations}\n`);

    console.log('Locale Coverage:');
    console.log('-'.repeat(50));

    for (const [locale, stats] of Object.entries(coverage.localeCoverage)) {
      const percentage = stats.percentage.toFixed(1);
      const bar = this.createProgressBar(stats.percentage);
      console.log(`${locale.padEnd(10)} ${bar} ${percentage}% (${stats.count}/${coverage.totalItems})`);
    }

    console.log('-'.repeat(50) + '\n');
  }

  /**
   * Create ASCII progress bar
   */
  private createProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }

  /**
   * Reset stats
   */
  resetStats(): void {
    this.stats = {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const importer = new ContentImporter();

  // Initialize database
  await sequelize.sync();

  try {
    switch (command) {
      case 'import':
        {
          const filePath = args[1];
          const options: ImportOptions = {
            skipExisting: args.includes('--skip-existing'),
            validateOnly: args.includes('--validate-only'),
            updateExisting: args.includes('--update-existing'),
            defaultStatus: args.includes('--publish') ? 'published' : 'draft',
          };

          if (!filePath) {
            console.error('Usage: npm run import-content import <file-path> [options]');
            console.error('Options:');
            console.error('  --skip-existing    Skip items that already exist');
            console.error('  --update-existing  Update existing items');
            console.error('  --validate-only    Validate without importing');
            console.error('  --publish          Set status to published');
            process.exit(1);
          }

          await importer.importFromFile(filePath, options);
        }
        break;

      case 'export':
        {
          const contentType = args[1] as ContentType;
          const locale = args[2];
          const outputPath = args[3];

          if (!contentType || !locale || !outputPath) {
            console.error('Usage: npm run import-content export <type> <locale> <output-path>');
            console.error('Example: npm run import-content export habit_template en-US ./export.json');
            process.exit(1);
          }

          await importer.exportToFile(contentType, locale, outputPath);
        }
        break;

      case 'coverage':
        {
          const contentType = args[1] as ContentType;
          const locales = args.slice(2);

          if (!contentType || locales.length === 0) {
            console.error('Usage: npm run import-content coverage <type> <locale1> <locale2> ...');
            console.error('Example: npm run import-content coverage habit_template en-US es-ES pt-BR');
            process.exit(1);
          }

          await importer.generateCoverageReport(contentType, locales);
        }
        break;

      default:
        console.log('UpCoach Content Import Tool\n');
        console.log('Commands:');
        console.log('  import <file> [options]              Import content from JSON file');
        console.log('  export <type> <locale> <output>      Export content to JSON file');
        console.log('  coverage <type> <locale1> ...        Generate coverage report');
        console.log('\nExamples:');
        console.log('  npm run import-content import ./data/habits.json --publish');
        console.log('  npm run import-content export habit_template en-US ./habits-en.json');
        console.log('  npm run import-content coverage habit_template en-US es-ES pt-BR fr-FR de-DE ja-JP');
        break;
    }
  } catch (error) {
    console.error(`Fatal error: ${error}`);
    process.exit(1);
  }

  await sequelize.close();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ContentImporter, ImportableContent, ImportOptions };
