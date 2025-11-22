export interface ContentVersion {
    id: string;
    contentId: string;
    version: number;
    title: string;
    content: any;
    author: {
        id: string;
        name: string;
        email: string;
    };
    changes: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    createdAt: Date;
    status: 'draft' | 'published' | 'archived';
    metadata: {
        wordCount?: number;
        readingTime?: number;
        seoScore?: number;
    };
}
export interface VersionComparison {
    version1: ContentVersion;
    version2: ContentVersion;
    differences: {
        field: string;
        type: 'added' | 'removed' | 'modified';
        oldValue?: any;
        newValue?: any;
    }[];
}
declare class ContentVersioningService {
    private versions;
    private currentVersions;
    private drafts;
    private saveTimeouts;
    constructor();
    createVersion(contentId: string, content: any, author: {
        id: string;
        name: string;
        email: string;
    }, changes?: any[]): Promise<ContentVersion>;
    getVersions(contentId: string): Promise<ContentVersion[]>;
    getVersion(contentId: string, versionNumber: number): Promise<ContentVersion | null>;
    compareVersions(contentId: string, version1Number: number, version2Number: number): Promise<VersionComparison | null>;
    restoreVersion(contentId: string, versionNumber: number, author: {
        id: string;
        name: string;
        email: string;
    }): Promise<ContentVersion>;
    publishVersion(contentId: string, versionNumber: number): Promise<void>;
    getCurrentVersion(contentId: string): Promise<ContentVersion | null>;
    autoSaveDraft(contentId: string, content: any, author: {
        id: string;
        name: string;
        email: string;
    }): Promise<void>;
    getAutoSavedDraft(contentId: string): any | null;
    clearAutoSavedDraft(contentId: string): void;
    cleanup(): void;
    mergeVersions(contentId: string, version1Number: number, version2Number: number, mergeStrategy: 'ours' | 'theirs' | 'manual', manualMerge?: any): Promise<ContentVersion>;
    private detectChanges;
    private countWords;
    private calculateReadingTime;
    private calculateSeoScore;
    private extractText;
    private saveVersion;
}
export declare const contentVersioning: ContentVersioningService;
export declare function useContentVersions(contentId: string): {
    versions: ContentVersion[];
    loading: boolean;
    error: Error | null;
};
export declare function useVersionComparison(contentId: string, version1: number, version2: number): {
    comparison: VersionComparison | null;
    loading: boolean;
    error: Error | null;
};
export declare function useAutoSave(contentId: string, content: any, author: {
    id: string;
    name: string;
    email: string;
}, enabled?: boolean): void;
export {};
//# sourceMappingURL=contentVersioning.d.ts.map