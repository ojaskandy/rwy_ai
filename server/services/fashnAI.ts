import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface FashnAIConfig {
  apiKey: string;
  baseURL: string;
}

interface FashnAIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

class FashnAIService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: FashnAIConfig) {
    this.apiKey = config.apiKey;
    
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config: any) => {
        console.log(`[FashnAI] Making request to: ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('[FashnAI] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: any) => {
        console.log(`[FashnAI] Response received: ${response.status}`);
        return response;
      },
      (error: any) => {
        console.error('[FashnAI] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test API connection and authentication by checking credits
   */
  async testConnection(): Promise<FashnAIResponse> {
    try {
      const response: AxiosResponse = await this.client.get('/credits');
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Check credits balance
   */
  async checkCredits(): Promise<FashnAIResponse> {
    try {
      const response: AxiosResponse = await this.client.get('/credits');
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Check prediction status by ID
   */
  async checkStatus(predictionId: string): Promise<FashnAIResponse> {
    try {
      const response: AxiosResponse = await this.client.get(`/status/${predictionId}`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Run a fashion AI model/task
   */
  async runModel(payload: any): Promise<FashnAIResponse> {
    try {
      const response: AxiosResponse = await this.client.post('/run', payload);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Upload image for processing
   */
  async uploadImage(imageData: Buffer | string, filename?: string): Promise<FashnAIResponse> {
    try {
      const formData = new FormData();
      
      if (typeof imageData === 'string') {
        // Handle base64 or URL
        formData.append('image', imageData);
      } else {
        // Handle buffer
        formData.append('image', new Blob([imageData]), filename || 'image.jpg');
      }

      const response: AxiosResponse = await this.client.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Generate virtual try-on
   * Returns a prediction ID that can be used to check status
   */
  async generateTryOn(personImage: string, garmentImage: string, options?: any): Promise<FashnAIResponse> {
    try {
      const payload = {
        person_image: personImage,
        garment_image: garmentImage,
        ...options
      };

      const response: AxiosResponse = await this.client.post('/run', payload);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      };
    }
  }
}

// Initialize Fashn AI service with environment variables
const createFashnAIService = (): FashnAIService | null => {
  const apiKey = process.env.FASHN_API_KEY;
  
  if (!apiKey) {
    console.error('[FashnAI] API key not found in environment variables');
    return null;
  }

  const config: FashnAIConfig = {
    apiKey,
    baseURL: 'https://api.fashn.ai/v1'
  };

  return new FashnAIService(config);
};

export { FashnAIService, createFashnAIService };
export type { FashnAIResponse }; 