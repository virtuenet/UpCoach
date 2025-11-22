import { apiClient } from './client';

export type LandingBlockType = 'sections' | 'cta-blocks' | 'pricing-tiers' | 'testimonials';
export type RemoteCopyType = 'remote-copy';

export interface LandingBlock {
  id: string;
  key: string;
  locale: string;
  variant: string;
  status: string;
  order: number;
  version: number;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  notes?: string;
  [key: string]: unknown;
}

export interface RemoteCopyEntry extends LandingBlock {
  namespace: string;
  value: string;
  platform: 'mobile' | 'web' | 'shared';
  richValue?: Record<string, unknown>;
}

export interface BlockListResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface BlockPayload {
  key: string;
  locale: string;
  variant?: string;
  status?: string;
  order?: number;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  notes?: string;
  [key: string]: unknown;
}

export const landingBlocksApi = {
  list<T = LandingBlock>(
    blockType: LandingBlockType | RemoteCopyType,
    params?: Record<string, unknown>
  ) {
    return apiClient.get<BlockListResponse<T>>(`/cms/landing/${blockType}`, { params });
  },
  create<T = LandingBlock>(blockType: LandingBlockType | RemoteCopyType, payload: BlockPayload) {
    return apiClient.post<{ data: T }>(`/cms/landing/${blockType}`, payload);
  },
  update<T = LandingBlock>(
    blockType: LandingBlockType | RemoteCopyType,
    id: string,
    payload: Partial<BlockPayload>
  ) {
    return apiClient.put<{ data: T }>(`/cms/landing/${blockType}/${id}`, payload);
  },
  publish<T = LandingBlock>(
    blockType: LandingBlockType | RemoteCopyType,
    id: string,
    payload?: { scheduleStart?: string; scheduleEnd?: string }
  ) {
    return apiClient.post<{ data: T }>(`/cms/landing/${blockType}/${id}/publish`, payload);
  },
  remove(blockType: LandingBlockType | RemoteCopyType, id: string) {
    return apiClient.delete(`/cms/landing/${blockType}/${id}`);
  },
};

