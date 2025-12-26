import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { PluginManifest } from '../../../../packages/plugin-sdk/src/index';

/**
 * Plugin Registry
 *
 * Manages plugin registration, versioning, and metadata:
 * - Plugin registration and approval workflow
 * - Semantic versioning support
 * - Plugin search and discovery
 * - Category management
 * - Permission validation
 * - Developer attribution
 *
 * Database Schema:
 * - plugins (id, name, version, author, status, manifest, created_at, updated_at)
 * - plugin_versions (plugin_id, version, manifest, published_at)
 * - plugin_installations (tenant_id, plugin_id, installed_at, config)
 */

export type PluginStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  status: PluginStatus;
  manifest: PluginManifest;
  downloadCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PluginVersion {
  pluginId: string;
  version: string;
  manifest: PluginManifest;
  publishedAt: Date;
}

export interface PluginInstallation {
  tenantId: string;
  pluginId: string;
  version: string;
  config: Record<string, any>;
  installedAt: Date;
}

export interface PluginSearchFilters {
  category?: string;
  author?: string;
  status?: PluginStatus;
  query?: string;
}

export class PluginRegistry {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Register new plugin
   */
  async registerPlugin(
    manifest: PluginManifest,
    developerId: string
  ): Promise<Plugin> {
    try {
      // Validate manifest
      const validation = this.validateManifest(manifest);
      if (!validation.valid) {
        throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
      }

      // Check if plugin name already exists
      const existingPlugin = await this.findByName(manifest.name);
      if (existingPlugin) {
        throw new Error(`Plugin name '${manifest.name}' already exists`);
      }

      // Insert plugin
      const query = `
        INSERT INTO plugins (
          name, version, author, status, manifest,
          developer_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `;

      const result = await this.db.query(query, [
        manifest.name,
        manifest.version,
        manifest.author,
        'pending', // Default status
        JSON.stringify(manifest),
        developerId,
      ]);

      const plugin = this.mapRowToPlugin(result.rows[0]);

      // Create first version
      await this.createVersion(plugin.id, manifest);

      logger.info('Plugin registered', {
        pluginId: plugin.id,
        name: manifest.name,
        version: manifest.version,
      });

      return plugin;
    } catch (error) {
      logger.error('Plugin registration failed', {
        name: manifest.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Publish new version of plugin
   */
  async publishVersion(
    pluginId: string,
    manifest: PluginManifest
  ): Promise<PluginVersion> {
    try {
      // Validate version
      const plugin = await this.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }

      if (!this.isVersionNewer(manifest.version, plugin.version)) {
        throw new Error(
          `Version ${manifest.version} must be newer than current version ${plugin.version}`
        );
      }

      // Create version
      const version = await this.createVersion(pluginId, manifest);

      // Update plugin current version
      await this.db.query(
        `UPDATE plugins SET version = $1, manifest = $2, updated_at = NOW() WHERE id = $3`,
        [manifest.version, JSON.stringify(manifest), pluginId]
      );

      logger.info('Plugin version published', {
        pluginId,
        version: manifest.version,
      });

      return version;
    } catch (error) {
      logger.error('Plugin version publish failed', {
        pluginId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Approve plugin for marketplace
   */
  async approvePlugin(pluginId: string, reviewerId: string): Promise<void> {
    await this.updatePluginStatus(pluginId, 'approved', reviewerId);
    logger.info('Plugin approved', { pluginId, reviewerId });
  }

  /**
   * Reject plugin
   */
  async rejectPlugin(
    pluginId: string,
    reviewerId: string,
    reason: string
  ): Promise<void> {
    await this.updatePluginStatus(pluginId, 'rejected', reviewerId);
    await this.db.query(
      `INSERT INTO plugin_reviews (plugin_id, reviewer_id, status, reason, created_at)
       VALUES ($1, $2, 'rejected', $3, NOW())`,
      [pluginId, reviewerId, reason]
    );
    logger.info('Plugin rejected', { pluginId, reviewerId, reason });
  }

  /**
   * Suspend plugin
   */
  async suspendPlugin(
    pluginId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    await this.updatePluginStatus(pluginId, 'suspended', adminId);
    await this.db.query(
      `INSERT INTO plugin_suspensions (plugin_id, admin_id, reason, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [pluginId, adminId, reason]
    );
    logger.warn('Plugin suspended', { pluginId, adminId, reason });
  }

  /**
   * Install plugin for tenant
   */
  async installPlugin(
    tenantId: string,
    pluginId: string,
    config: Record<string, any> = {}
  ): Promise<PluginInstallation> {
    try {
      const plugin = await this.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }

      if (plugin.status !== 'approved') {
        throw new Error(`Plugin ${pluginId} is not approved`);
      }

      // Check if already installed
      const existing = await this.getInstallation(tenantId, pluginId);
      if (existing) {
        throw new Error(`Plugin ${pluginId} already installed for tenant ${tenantId}`);
      }

      // Install
      const query = `
        INSERT INTO plugin_installations (
          tenant_id, plugin_id, version, config, installed_at
        )
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;

      const result = await this.db.query(query, [
        tenantId,
        pluginId,
        plugin.version,
        JSON.stringify(config),
      ]);

      // Increment download count
      await this.db.query(
        `UPDATE plugins SET download_count = download_count + 1 WHERE id = $1`,
        [pluginId]
      );

      logger.info('Plugin installed', { tenantId, pluginId, version: plugin.version });

      return this.mapRowToInstallation(result.rows[0]);
    } catch (error) {
      logger.error('Plugin installation failed', {
        tenantId,
        pluginId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Uninstall plugin for tenant
   */
  async uninstallPlugin(tenantId: string, pluginId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM plugin_installations WHERE tenant_id = $1 AND plugin_id = $2`,
      [tenantId, pluginId]
    );
    logger.info('Plugin uninstalled', { tenantId, pluginId });
  }

  /**
   * Search plugins in marketplace
   */
  async searchPlugins(filters: PluginSearchFilters = {}): Promise<Plugin[]> {
    let query = `
      SELECT * FROM plugins
      WHERE status = 'approved'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.category) {
      query += ` AND manifest->>'category' = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.author) {
      query += ` AND author = $${paramIndex}`;
      params.push(filters.author);
      paramIndex++;
    }

    if (filters.query) {
      query += ` AND (name ILIKE $${paramIndex} OR manifest->>'description' ILIKE $${paramIndex})`;
      params.push(`%${filters.query}%`);
      paramIndex++;
    }

    query += ` ORDER BY download_count DESC, rating DESC LIMIT 50`;

    const result = await this.db.query(query, params);
    return result.rows.map(this.mapRowToPlugin);
  }

  /**
   * Get plugin by ID
   */
  async getPlugin(pluginId: string): Promise<Plugin | null> {
    const result = await this.db.query(`SELECT * FROM plugins WHERE id = $1`, [pluginId]);
    return result.rows.length > 0 ? this.mapRowToPlugin(result.rows[0]) : null;
  }

  /**
   * Get plugin versions
   */
  async getVersions(pluginId: string): Promise<PluginVersion[]> {
    const result = await this.db.query(
      `SELECT * FROM plugin_versions WHERE plugin_id = $1 ORDER BY published_at DESC`,
      [pluginId]
    );
    return result.rows.map(this.mapRowToVersion);
  }

  /**
   * Get tenant installations
   */
  async getTenantInstallations(tenantId: string): Promise<PluginInstallation[]> {
    const result = await this.db.query(
      `SELECT * FROM plugin_installations WHERE tenant_id = $1`,
      [tenantId]
    );
    return result.rows.map(this.mapRowToInstallation);
  }

  /**
   * Private helper methods
   */

  private async findByName(name: string): Promise<Plugin | null> {
    const result = await this.db.query(`SELECT * FROM plugins WHERE name = $1`, [name]);
    return result.rows.length > 0 ? this.mapRowToPlugin(result.rows[0]) : null;
  }

  private async createVersion(
    pluginId: string,
    manifest: PluginManifest
  ): Promise<PluginVersion> {
    const query = `
      INSERT INTO plugin_versions (plugin_id, version, manifest, published_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const result = await this.db.query(query, [
      pluginId,
      manifest.version,
      JSON.stringify(manifest),
    ]);
    return this.mapRowToVersion(result.rows[0]);
  }

  private async updatePluginStatus(
    pluginId: string,
    status: PluginStatus,
    userId: string
  ): Promise<void> {
    await this.db.query(
      `UPDATE plugins SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, pluginId]
    );
  }

  private async getInstallation(
    tenantId: string,
    pluginId: string
  ): Promise<PluginInstallation | null> {
    const result = await this.db.query(
      `SELECT * FROM plugin_installations WHERE tenant_id = $1 AND plugin_id = $2`,
      [tenantId, pluginId]
    );
    return result.rows.length > 0 ? this.mapRowToInstallation(result.rows[0]) : null;
  }

  private validateManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.name || manifest.name.length < 3) {
      errors.push('Plugin name must be at least 3 characters');
    }

    if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push('Plugin version must follow semver format (e.g., 1.0.0)');
    }

    if (!manifest.author) {
      errors.push('Plugin author is required');
    }

    if (!manifest.description || manifest.description.length < 10) {
      errors.push('Plugin description must be at least 10 characters');
    }

    if (!manifest.permissions || manifest.permissions.length === 0) {
      errors.push('Plugin must request at least one permission');
    }

    return { valid: errors.length === 0, errors };
  }

  private isVersionNewer(newVersion: string, currentVersion: string): boolean {
    const newParts = newVersion.split('.').map(Number);
    const currentParts = currentVersion.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (newParts[i] > currentParts[i]) return true;
      if (newParts[i] < currentParts[i]) return false;
    }

    return false; // Same version
  }

  private mapRowToPlugin(row: any): Plugin {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      author: row.author,
      status: row.status,
      manifest: row.manifest,
      downloadCount: row.download_count || 0,
      rating: row.rating || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToVersion(row: any): PluginVersion {
    return {
      pluginId: row.plugin_id,
      version: row.version,
      manifest: row.manifest,
      publishedAt: row.published_at,
    };
  }

  private mapRowToInstallation(row: any): PluginInstallation {
    return {
      tenantId: row.tenant_id,
      pluginId: row.plugin_id,
      version: row.version,
      config: row.config,
      installedAt: row.installed_at,
    };
  }
}
