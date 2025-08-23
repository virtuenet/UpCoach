// Content Versioning Service
import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'

export interface ContentVersion {
  id: string
  contentId: string
  version: number
  title: string
  content: any
  author: {
    id: string
    name: string
    email: string
  }
  changes: {
    field: string
    oldValue: any
    newValue: any
  }[]
  createdAt: Date
  status: 'draft' | 'published' | 'archived'
  metadata: {
    wordCount?: number
    readingTime?: number
    seoScore?: number
  }
}

export interface VersionComparison {
  version1: ContentVersion
  version2: ContentVersion
  differences: {
    field: string
    type: 'added' | 'removed' | 'modified'
    oldValue?: any
    newValue?: any
  }[]
}

class ContentVersioningService {
  private versions: Map<string, ContentVersion[]> = new Map()
  private currentVersions: Map<string, string> = new Map()

  // Create a new version
  async createVersion(
    contentId: string,
    content: any,
    author: { id: string; name: string; email: string },
    changes?: any[]
  ): Promise<ContentVersion> {
    const versions = this.versions.get(contentId) || []
    const lastVersion = versions[versions.length - 1]
    const versionNumber = lastVersion ? lastVersion.version + 1 : 1

    const newVersion: ContentVersion = {
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
    }

    // Store version
    const updatedVersions = [...versions, newVersion]
    this.versions.set(contentId, updatedVersions)

    // Save to backend
    await this.saveVersion(newVersion)

    return newVersion
  }

  // Get all versions for a content item
  async getVersions(contentId: string): Promise<ContentVersion[]> {
    // Try to get from cache
    if (this.versions.has(contentId)) {
      return this.versions.get(contentId)!
    }

    // Fetch from backend
    try {
      const response = await apiClient.get(`/content/${contentId}/versions`)
      const versions = response.data
      this.versions.set(contentId, versions)
      return versions
    } catch (error) {
      console.error('Failed to fetch versions:', error)
      return []
    }
  }

  // Get a specific version
  async getVersion(contentId: string, versionNumber: number): Promise<ContentVersion | null> {
    const versions = await this.getVersions(contentId)
    return versions.find(v => v.version === versionNumber) || null
  }

  // Compare two versions
  async compareVersions(
    contentId: string,
    version1Number: number,
    version2Number: number
  ): Promise<VersionComparison | null> {
    const [version1, version2] = await Promise.all([
      this.getVersion(contentId, version1Number),
      this.getVersion(contentId, version2Number),
    ])

    if (!version1 || !version2) {
      return null
    }

    const differences = this.detectChanges(version1.content, version2.content)

    return {
      version1,
      version2,
      differences,
    }
  }

  // Restore a previous version
  async restoreVersion(
    contentId: string,
    versionNumber: number,
    author: { id: string; name: string; email: string }
  ): Promise<ContentVersion> {
    const versionToRestore = await this.getVersion(contentId, versionNumber)
    
    if (!versionToRestore) {
      throw new Error(`Version ${versionNumber} not found`)
    }

    // Create a new version with the restored content
    const restoredVersion = await this.createVersion(
      contentId,
      versionToRestore.content,
      author,
      [{ field: 'restored', oldValue: null, newValue: `from version ${versionNumber}` }]
    )

    return restoredVersion
  }

  // Publish a version
  async publishVersion(contentId: string, versionNumber: number): Promise<void> {
    const versions = await this.getVersions(contentId)
    
    // Mark all versions as archived
    versions.forEach(v => {
      if (v.status === 'published') {
        v.status = 'archived'
      }
    })

    // Mark the specified version as published
    const versionToPublish = versions.find(v => v.version === versionNumber)
    if (versionToPublish) {
      versionToPublish.status = 'published'
      this.currentVersions.set(contentId, versionToPublish.id)
    }

    // Update backend
    await apiClient.put(`/content/${contentId}/versions/${versionNumber}/publish`)
  }

  // Get the current published version
  async getCurrentVersion(contentId: string): Promise<ContentVersion | null> {
    const versions = await this.getVersions(contentId)
    return versions.find(v => v.status === 'published') || null
  }

  // Auto-save draft
  async autoSaveDraft(
    contentId: string,
    content: any,
    author: { id: string; name: string; email: string }
  ): Promise<void> {
    const key = `draft_${contentId}`
    const draft = {
      content,
      author,
      savedAt: new Date(),
    }

    // Save to local storage
    localStorage.setItem(key, JSON.stringify(draft))

    // Debounced save to backend
    this.debouncedSave(contentId, content, author)
  }

  // Merge versions (for conflict resolution)
  async mergeVersions(
    contentId: string,
    version1Number: number,
    version2Number: number,
    mergeStrategy: 'ours' | 'theirs' | 'manual',
    manualMerge?: any
  ): Promise<ContentVersion> {
    const [version1, version2] = await Promise.all([
      this.getVersion(contentId, version1Number),
      this.getVersion(contentId, version2Number),
    ])

    if (!version1 || !version2) {
      throw new Error('One or both versions not found')
    }

    let mergedContent: any

    switch (mergeStrategy) {
      case 'ours':
        mergedContent = version1.content
        break
      case 'theirs':
        mergedContent = version2.content
        break
      case 'manual':
        mergedContent = manualMerge || {}
        break
    }

    // Create a new version with the merged content
    const mergedVersion = await this.createVersion(
      contentId,
      mergedContent,
      version1.author, // Use the author of the first version
      [{ field: 'merged', oldValue: [version1Number, version2Number], newValue: mergeStrategy }]
    )

    return mergedVersion
  }

  // Private helper methods
  private detectChanges(oldContent: any, newContent: any): any[] {
    if (!oldContent) return []

    const changes: any[] = []
    const allKeys = new Set([
      ...Object.keys(oldContent || {}),
      ...Object.keys(newContent || {}),
    ])

    allKeys.forEach(key => {
      const oldValue = oldContent?.[key]
      const newValue = newContent?.[key]

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          type: !oldValue ? 'added' : !newValue ? 'removed' : 'modified',
          oldValue,
          newValue,
        })
      }
    })

    return changes
  }

  private countWords(content: any): number {
    const text = this.extractText(content)
    return text.split(/\s+/).filter(word => word.length > 0).length
  }

  private calculateReadingTime(content: any): number {
    const wordCount = this.countWords(content)
    const wordsPerMinute = 200
    return Math.ceil(wordCount / wordsPerMinute)
  }

  private calculateSeoScore(content: any): number {
    let score = 0
    const text = this.extractText(content)

    // Check title length
    if (content.title && content.title.length >= 30 && content.title.length <= 60) {
      score += 20
    }

    // Check meta description
    if (content.metaDescription && content.metaDescription.length >= 120 && content.metaDescription.length <= 160) {
      score += 20
    }

    // Check content length
    const wordCount = this.countWords(content)
    if (wordCount >= 300) {
      score += 20
    }

    // Check for headings
    if (content.body && content.body.includes('<h')) {
      score += 20
    }

    // Check for images with alt text
    if (content.body && content.body.includes('alt=')) {
      score += 20
    }

    return score
  }

  private extractText(content: any): string {
    if (typeof content === 'string') {
      return content
    }

    if (content.body) {
      // Remove HTML tags
      return content.body.replace(/<[^>]*>/g, ' ')
    }

    return JSON.stringify(content)
  }

  private async saveVersion(version: ContentVersion): Promise<void> {
    try {
      await apiClient.post(`/content/${version.contentId}/versions`, version)
    } catch (error) {
      console.error('Failed to save version:', error)
    }
  }

  private debouncedSave = this.debounce(
    async (contentId: string, content: any, author: any) => {
      await this.createVersion(contentId, content, author)
    },
    5000
  )

  private debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
}

// Export singleton instance
export const contentVersioning = new ContentVersioningService()

// Export hooks for React components
export function useContentVersions(contentId: string) {
  const [versions, setVersions] = useState<ContentVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    contentVersioning.getVersions(contentId).then(v => {
      setVersions(v)
      setLoading(false)
    })
  }, [contentId])

  return { versions, loading }
}

export function useVersionComparison(
  contentId: string,
  version1: number,
  version2: number
) {
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    contentVersioning.compareVersions(contentId, version1, version2).then(c => {
      setComparison(c)
      setLoading(false)
    })
  }, [contentId, version1, version2])

  return { comparison, loading }
}