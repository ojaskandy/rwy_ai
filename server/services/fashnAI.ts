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

interface TryOnInputs {
  model_image: string; // URL or base64
  garment_image: string; // URL or base64
  category?: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
  mode?: 'performance' | 'balanced' | 'quality';
  garment_photo_type?: 'auto' | 'model' | 'flat-lay';
  num_samples?: number;
  seed?: number;
  segmentation_free?: boolean;
  moderation_level?: 'conservative' | 'permissive' | 'none';
  output_format?: 'png' | 'jpeg';
  return_base64?: boolean;
}

interface TryOnRequest {
  model_name: 'tryon-v1.6' | 'tryon-v1.5';
  inputs: TryOnInputs;
}

interface PredictionResponse {
  id: string;
  error: string | null;
}

interface StatusResponse {
  id: string;
  status: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
  output?: string[];
  error?: {
    name: string;
    message: string;
  } | null;
}

interface CreditsResponse {
  credits: {
    total: number;
    subscription: number;
    on_demand: number;
  };
}

class FashnAIService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: FashnAIConfig) {
    this.apiKey = config.apiKey;
    
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: 60000, // 60 second timeout for API calls
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
   * Check credits balance
   */
  async checkCredits(): Promise<FashnAIResponse<CreditsResponse>> {
    try {
      const response: AxiosResponse<CreditsResponse> = await this.client.get('/credits');
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
  async checkStatus(predictionId: string): Promise<FashnAIResponse<StatusResponse>> {
    try {
      const response: AxiosResponse<StatusResponse> = await this.client.get(`/status/${predictionId}`);
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
   * Run a virtual try-on prediction
   * Returns a prediction ID that can be used to check status
   */
  async runTryOn(modelImage: string, garmentImage: string, options?: Partial<TryOnInputs>): Promise<FashnAIResponse<PredictionResponse>> {
    try {
      console.log('[FashnAI Service] Starting try-on generation...');
      console.log('[FashnAI Service] Model image type:', modelImage.startsWith('data:') ? 'base64' : 'URL');
      console.log('[FashnAI Service] Garment image type:', garmentImage.startsWith('data:') ? 'base64' : 'URL');

      // Prepare the request payload according to FashnAI documentation
      const payload: TryOnRequest = {
        model_name: options?.mode === 'performance' ? 'tryon-v1.5' : 'tryon-v1.6', // Use v1.5 for performance, v1.6 for quality
        inputs: {
          model_image: modelImage,
          garment_image: garmentImage,
          category: options?.category || 'auto',
          mode: options?.mode || 'balanced',
          garment_photo_type: options?.garment_photo_type || 'auto',
          num_samples: options?.num_samples || 1,
          seed: options?.seed || 42,
          segmentation_free: options?.segmentation_free !== undefined ? options.segmentation_free : true,
          moderation_level: options?.moderation_level || 'permissive',
          output_format: options?.output_format || 'png',
          return_base64: options?.return_base64 || false
        }
      };

      console.log('[FashnAI Service] 📤 Sending payload to FashnAI:');
      console.log(JSON.stringify({
        ...payload,
        inputs: {
          ...payload.inputs,
          model_image: payload.inputs.model_image.startsWith('data:') ? '[base64 data]' : payload.inputs.model_image,
          garment_image: payload.inputs.garment_image.startsWith('data:') ? '[base64 data]' : payload.inputs.garment_image
        }
      }, null, 2));

      const response: AxiosResponse<PredictionResponse> = await this.client.post('/run', payload);
      
      console.log('[FashnAI Service] 📥 FashnAI Response Status:', response.status);
      console.log('[FashnAI Service] 📥 FashnAI Response Data:', JSON.stringify(response.data, null, 2));
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error('[FashnAI Service] 🔥 Try-on generation error:');
      console.error('[FashnAI Service] Error message:', error.message);
      console.error('[FashnAI Service] Error response:', error.response?.data);
      console.error('[FashnAI Service] Error status:', error.response?.status);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Test API connection and authentication by checking credits
   */
  async testConnection(): Promise<FashnAIResponse> {
    try {
      const result = await this.checkCredits();
      return {
        success: result.success,
        data: result.data,
        error: result.error,
        status: result.status
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
   * Poll prediction status until completion
   */
  async pollUntilComplete(predictionId: string, maxAttempts: number = 30, intervalMs: number = 3000): Promise<FashnAIResponse<StatusResponse>> {
    console.log(`[FashnAI Service] Starting to poll prediction ${predictionId}...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.checkStatus(predictionId);
        
        if (!result.success) {
          return result;
        }

        const status = result.data!.status;
        console.log(`[FashnAI Service] Poll attempt ${attempt}/${maxAttempts}: Status = ${status}`);

        if (status === 'completed') {
          console.log('[FashnAI Service] ✅ Prediction completed successfully');
          return result;
        } else if (status === 'failed') {
          console.log('[FashnAI Service] ❌ Prediction failed');
          return result;
        } else if (['starting', 'in_queue', 'processing'].includes(status)) {
          // Still processing, wait before next poll
          if (attempt < maxAttempts) {
            console.log(`[FashnAI Service] Waiting ${intervalMs}ms before next poll...`);
            await new Promise(resolve => setTimeout(resolve, intervalMs));
          }
        } else {
          return {
            success: false,
            error: `Unknown status: ${status}`,
            status: 500
          };
        }
      } catch (error: any) {
        console.error(`[FashnAI Service] Poll attempt ${attempt} failed:`, error.message);
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: `Polling failed after ${maxAttempts} attempts: ${error.message}`,
            status: 500
          };
        }
      }
    }

    return {
      success: false,
      error: `Prediction did not complete within ${maxAttempts} attempts`,
      status: 408 // Request Timeout
    };
  }
}

// Initialize FashnAI service with environment variables
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
export type { FashnAIResponse, TryOnInputs, PredictionResponse, StatusResponse, CreditsResponse }; 