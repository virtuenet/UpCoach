import axios, { AxiosInstance, AxiosResponse } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }

  // Specific API endpoints
  async signup(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) {
    return this.post('/auth/signup', userData);
  }

  async login(credentials: { email: string; password: string }) {
    return this.post('/auth/login', credentials);
  }

  async submitContactForm(formData: {
    name: string;
    email: string;
    message: string;
    phone?: string;
  }) {
    return this.post('/contact', formData);
  }

  async subscribeNewsletter(email: string) {
    return this.post('/newsletter/subscribe', { email });
  }

  async submitOnboarding(data: {
    userId: string;
    responses: Record<string, any>;
  }) {
    return this.post('/onboarding', data);
  }

  async getHealthCheck() {
    return this.get('/health');
  }
}

export const apiService = new ApiService();
export default apiService;