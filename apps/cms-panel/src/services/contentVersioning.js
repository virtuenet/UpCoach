// Content Versioning Service
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { LRUCache, TTLCache } from '../utils/lruCache';
class ContentVersioningService {
    constructor() {
        this.saveTimeouts = new Map();
        // Limit cache to 50 content items to prevent memory leaks
        this.versions = new LRUCache(50);
        this.currentVersions = new LRUCache(50);
        // Auto-expire drafts after 30 minutes
        this.drafts = new TTLCache(100, 30 * 60 * 1000);
    }
    // Create a new version
    async createVersion(contentId, content, author, changes) {
        const versions = this.versions.get(contentId) || [];
        const lastVersion = versions[versions.length - 1];
        const versionNumber = lastVersion ? lastVersion.version + 1 : 1;
        const newVersion = {
            id: `v${contentId}_${versionNumber}_${Date.now()}`,
            contentId,
            version: versionNumber,
            title: content.title || 'Untitled',
            content,
            author,
            changes: changes || this.detectChanges(lastVersion?.content, content),
            createdAt: new Date(),
            status: 'draft',
            metadata: {
                wordCount: this.countWords(content),
                readingTime: this.calculateReadingTime(content),
                seoScore: this.calculateSeoScore(content),
            },
        };
        // Store version with size limit
        const updatedVersions = [...versions, newVersion];
        // Keep only last 20 versions per content to prevent memory issues
        if (updatedVersions.length > 20) {
            updatedVersions.shift(); // Remove oldest version
        }
        this.versions.set(contentId, updatedVersions);
        // Save to backend
        await this.saveVersion(newVersion);
        return newVersion;
    }
    // Get all versions for a content item
    async getVersions(contentId) {
        // Try to get from cache
        if (this.versions.has(contentId)) {
            return this.versions.get(contentId);
        }
        // Fetch from backend
        try {
            const response = await apiClient.get(`/content/${contentId}/versions`);
            const versions = response.data;
            this.versions.set(contentId, versions);
            return versions;
        }
        catch (error) {
            console.error('Failed to fetch versions:', error);
            return [];
        }
    }
    // Get a specific version
    async getVersion(contentId, versionNumber) {
        const versions = await this.getVersions(contentId);
        return versions.find(v => v.version === versionNumber) || null;
    }
    // Compare two versions
    async compareVersions(contentId, version1Number, version2Number) {
        const [version1, version2] = await Promise.all([
            this.getVersion(contentId, version1Number),
            this.getVersion(contentId, version2Number),
        ]);
        if (!version1 || !version2) {
            return null;
        }
        const differences = this.detectChanges(version1.content, version2.content);
        return {
            version1,
            version2,
            differences,
        };
    }
    // Restore a previous version
    async restoreVersion(contentId, versionNumber, author) {
        const versionToRestore = await this.getVersion(contentId, versionNumber);
        if (!versionToRestore) {
            throw new Error(`Version ${versionNumber} not found`);
        }
        // Create a new version with the restored content
        const restoredVersion = await this.createVersion(contentId, versionToRestore.content, author, [
            { field: 'restored', oldValue: null, newValue: `from version ${versionNumber}` },
        ]);
        return restoredVersion;
    }
    // Publish a version
    async publishVersion(contentId, versionNumber) {
        const versions = await this.getVersions(contentId);
        // Mark all versions as archived
        versions.forEach(v => {
            if (v.status === 'published') {
                v.status = 'archived';
            }
        });
        // Mark the specified version as published
        const versionToPublish = versions.find(v => v.version === versionNumber);
        if (versionToPublish) {
            versionToPublish.status = 'published';
            this.currentVersions.set(contentId, versionToPublish.id);
        }
        // Update backend
        await apiClient.put(`/content/${contentId}/versions/${versionNumber}/publish`);
    }
    // Get the current published version
    async getCurrentVersion(contentId) {
        const versions = await this.getVersions(contentId);
        return versions.find(v => v.status === 'published') || null;
    }
    // Auto-save draft with memory-safe caching
    async autoSaveDraft(contentId, content, author) {
        const draft = {
            content,
            author,
            savedAt: new Date(),
        };
        // Use TTL cache instead of localStorage
        this.drafts.set(contentId, draft);
        // Clear existing timeout
        const existingTimeout = this.saveTimeouts.get(contentId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        // Set new debounced save
        const timeout = setTimeout(async () => {
            try {
                await this.createVersion(contentId, content, author);
                this.saveTimeouts.delete(contentId);
            }
            catch (error) {
                console.error('Failed to auto-save version:', error);
            }
        }, 5000);
        this.saveTimeouts.set(contentId, timeout);
    }
    // Get auto-saved draft
    getAutoSavedDraft(contentId) {
        return this.drafts.get(contentId) || null;
    }
    // Clear auto-saved draft
    clearAutoSavedDraft(contentId) {
        this.drafts.delete(contentId);
        const timeout = this.saveTimeouts.get(contentId);
        if (timeout) {
            clearTimeout(timeout);
            this.saveTimeouts.delete(contentId);
        }
    }
    // Cleanup method to prevent memory leaks
    cleanup() {
        // Clear all timeouts
        this.saveTimeouts.forEach(timeout => clearTimeout(timeout));
        this.saveTimeouts.clear();
        // Clear caches
        this.versions.clear();
        this.currentVersions.clear();
        this.drafts.destroy();
    }
    // Merge versions (for conflict resolution)
    async mergeVersions(contentId, version1Number, version2Number, mergeStrategy, manualMerge) {
        const [version1, version2] = await Promise.all([
            this.getVersion(contentId, version1Number),
            this.getVersion(contentId, version2Number),
        ]);
        if (!version1 || !version2) {
            throw new Error('One or both versions not found');
        }
        let mergedContent;
        switch (mergeStrategy) {
            case 'ours':
                mergedContent = version1.content;
                break;
            case 'theirs':
                mergedContent = version2.content;
                break;
            case 'manual':
                mergedContent = manualMerge || {};
                break;
        }
        // Create a new version with the merged content
        const mergedVersion = await this.createVersion(contentId, mergedContent, version1.author, // Use the author of the first version
        [{ field: 'merged', oldValue: [version1Number, version2Number], newValue: mergeStrategy }]);
        return mergedVersion;
    }
    // Private helper methods
    detectChanges(oldContent, newContent) {
        if (!oldContent)
            return [];
        const changes = [];
        const allKeys = new Set([...Object.keys(oldContent || {}), ...Object.keys(newContent || {})]);
        allKeys.forEach(key => {
            const oldValue = oldContent?.[key];
            const newValue = newContent?.[key];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes.push({
                    field: key,
                    type: !oldValue ? 'added' : !newValue ? 'removed' : 'modified',
                    oldValue,
                    newValue,
                });
            }
        });
        return changes;
    }
    countWords(content) {
        const text = this.extractText(content);
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }
    calculateReadingTime(content) {
        const wordCount = this.countWords(content);
        const wordsPerMinute = 200;
        return Math.ceil(wordCount / wordsPerMinute);
    }
    calculateSeoScore(content) {
        let score = 0;
        // const text = this.extractText(content)
        // Check title length
        if (content.title && content.title.length >= 30 && content.title.length <= 60) {
            score += 20;
        }
        // Check meta description
        if (content.metaDescription &&
            content.metaDescription.length >= 120 &&
            content.metaDescription.length <= 160) {
            score += 20;
        }
        // Check content length
        const wordCount = this.countWords(content);
        if (wordCount >= 300) {
            score += 20;
        }
        // Check for headings
        if (content.body && content.body.includes('<h')) {
            score += 20;
        }
        // Check for images with alt text
        if (content.body && content.body.includes('alt=')) {
            score += 20;
        }
        return score;
    }
    extractText(content) {
        if (typeof content === 'string') {
            return content;
        }
        if (content.body) {
            // Remove HTML tags
            return content.body.replace(/<[^>]*>/g, ' ');
        }
        return JSON.stringify(content);
    }
    async saveVersion(version) {
        try {
            await apiClient.post(`/content/${version.contentId}/versions`, version);
        }
        catch (error) {
            console.error('Failed to save version:', error);
        }
    }
}
// Export singleton instance
export const contentVersioning = new ContentVersioningService();
// Export hooks for React components
export function useContentVersions(contentId) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    useEffect(() => {
        // Cleanup previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);
        contentVersioning
            .getVersions(contentId)
            .then(v => {
            if (!abortControllerRef.current?.signal.aborted) {
                setVersions(v);
                setLoading(false);
            }
        })
            .catch(err => {
            if (!abortControllerRef.current?.signal.aborted) {
                setError(err);
                setLoading(false);
            }
        });
        // Cleanup on unmount or contentId change
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [contentId]);
    return { versions, loading, error };
}
export function useVersionComparison(contentId, version1, version2) {
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    useEffect(() => {
        // Cleanup previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);
        contentVersioning
            .compareVersions(contentId, version1, version2)
            .then(c => {
            if (!abortControllerRef.current?.signal.aborted) {
                setComparison(c);
                setLoading(false);
            }
        })
            .catch(err => {
            if (!abortControllerRef.current?.signal.aborted) {
                setError(err);
                setLoading(false);
            }
        });
        // Cleanup on unmount or parameter change
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [contentId, version1, version2]);
    return { comparison, loading, error };
}
// Hook for auto-save functionality with cleanup
export function useAutoSave(contentId, content, author, enabled = true) {
    const saveTimeoutRef = useRef(null);
    useEffect(() => {
        if (!enabled)
            return;
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        // Set new timeout
        saveTimeoutRef.current = setTimeout(() => {
            contentVersioning.autoSaveDraft(contentId, content, author);
        }, 2000); // Auto-save after 2 seconds of inactivity
        // Cleanup
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [contentId, content, author, enabled]);
    // Clear draft on unmount
    useEffect(() => {
        return () => {
            contentVersioning.clearAutoSavedDraft(contentId);
        };
    }, [contentId]);
}
//# sourceMappingURL=contentVersioning.js.map