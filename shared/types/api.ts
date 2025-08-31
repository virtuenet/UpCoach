/**
 * API-related type definitions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  meta?: ApiMeta;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  field?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface BatchRequest<T = any> {
  operations: BatchOperation<T>[];
  transactional?: boolean;
}

export interface BatchOperation<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: T;
  params?: Record<string, any>;
}

export interface BatchResponse<T = any> {
  results: BatchResult<T>[];
  success: boolean;
  failed?: number[];
}

export interface BatchResult<T = any> {
  index: number;
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface WebSocketMessage<T = any> {
  type: string;
  payload?: T;
  timestamp: number;
  id?: string;
}

export interface FileUpload {
  file: File | Blob;
  name?: string;
  type?: string;
  metadata?: Record<string, any>;
}

export interface FileResponse {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date | string;
}
