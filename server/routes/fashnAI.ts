import { Request, Response } from 'express';
import { createFashnAIService } from '../services/fashnAI';
import type { TryOnInputs } from '../services/fashnAI';

// Initialize service
const fashnAI = createFashnAIService();

/**
 * Test FashnAI API connection
 * GET /api/fashn/test
 */
export async function testFashnAI(req: Request, res: Response) {
  try {
    if (!fashnAI) {
      return res.status(500).json({
        success: false,
        error: 'FashnAI service not initialized. Check API key configuration.'
      });
    }

    const result = await fashnAI.testConnection();
    
    res.status(result.status || 200).json({
      success: result.success,
      message: result.success ? 'FashnAI connection successful' : 'FashnAI connection failed',
      data: result.data,
      error: result.error
    });
  } catch (error: any) {
    console.error('[FashnAI Route] Test connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Generate virtual try-on (start prediction)
 * POST /api/fashn/tryon
 * Body: { model_image: string (base64 or URL), garment_image: string (base64 or URL), options?: TryOnInputs }
 */
export async function generateTryOn(req: Request, res: Response) {
  try {
    if (!fashnAI) {
      return res.status(500).json({
        success: false,
        error: 'FashnAI service not initialized. Check API key configuration.'
      });
    }

    console.log('[FashnAI Route] Received try-on request');

    const { model_image, garment_image, options = {} } = req.body;

    // Validate required fields
    if (!model_image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: model_image'
      });
    }

    if (!garment_image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: garment_image'
      });
    }

    // Validate image formats (base64 or URL)
    const isValidBase64 = (str: string) => str.startsWith('data:image/');
    const isValidURL = (str: string) => str.startsWith('http://') || str.startsWith('https://');

    if (!isValidBase64(model_image) && !isValidURL(model_image)) {
      return res.status(400).json({
        success: false,
        error: 'model_image must be a valid base64 data URL or HTTP(S) URL'
      });
    }

    if (!isValidBase64(garment_image) && !isValidURL(garment_image)) {
      return res.status(400).json({
        success: false,
        error: 'garment_image must be a valid base64 data URL or HTTP(S) URL'
      });
    }

    console.log('[FashnAI Route] Validated request:', {
      modelImageType: isValidBase64(model_image) ? 'base64' : 'URL',
      garmentImageType: isValidBase64(garment_image) ? 'base64' : 'URL',
      options
    });

    const result = await fashnAI.runTryOn(model_image, garment_image, options);
    
    res.status(result.status || 200).json({
      success: result.success,
      message: result.success ? 'Try-on prediction started' : 'Try-on prediction failed',
      data: result.data,
      error: result.error
    });
  } catch (error: any) {
    console.error('[FashnAI Route] Try-on generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Check prediction status
 * GET /api/fashn/status/:id
 */
export async function checkStatus(req: Request, res: Response) {
  try {
    if (!fashnAI) {
      return res.status(500).json({
        success: false,
        error: 'FashnAI service not initialized. Check API key configuration.'
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing prediction ID'
      });
    }

    const result = await fashnAI.checkStatus(id);
    
    res.status(result.status || 200).json({
      success: result.success,
      message: result.success ? 'Status retrieved successfully' : 'Status check failed',
      data: result.data,
      error: result.error
    });
  } catch (error: any) {
    console.error('[FashnAI Route] Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Check credits balance
 * GET /api/fashn/credits
 */
export async function checkCredits(req: Request, res: Response) {
  try {
    if (!fashnAI) {
      return res.status(500).json({
        success: false,
        error: 'FashnAI service not initialized. Check API key configuration.'
      });
    }

    const result = await fashnAI.checkCredits();
    
    res.status(result.status || 200).json({
      success: result.success,
      message: result.success ? 'Credits retrieved successfully' : 'Credits check failed',
      data: result.data,
      error: result.error
    });
  } catch (error: any) {
    console.error('[FashnAI Route] Credits check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Run try-on with polling (convenience endpoint)
 * POST /api/fashn/tryon-complete
 * Body: { model_image: string, garment_image: string, options?: TryOnInputs }
 * This endpoint starts a prediction and polls until completion
 */
export async function runTryOnComplete(req: Request, res: Response) {
  try {
    if (!fashnAI) {
      return res.status(500).json({
        success: false,
        error: 'FashnAI service not initialized. Check API key configuration.'
      });
    }

    console.log('[FashnAI Route] Received complete try-on request');

    const { model_image, garment_image, options = {} } = req.body;

    // Validate required fields (same as generateTryOn)
    if (!model_image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: model_image'
      });
    }

    if (!garment_image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: garment_image'
      });
    }

    // Validate image formats
    const isValidBase64 = (str: string) => str.startsWith('data:image/');
    const isValidURL = (str: string) => str.startsWith('http://') || str.startsWith('https://');

    if (!isValidBase64(model_image) && !isValidURL(model_image)) {
      return res.status(400).json({
        success: false,
        error: 'model_image must be a valid base64 data URL or HTTP(S) URL'
      });
    }

    if (!isValidBase64(garment_image) && !isValidURL(garment_image)) {
      return res.status(400).json({
        success: false,
        error: 'garment_image must be a valid base64 data URL or HTTP(S) URL'
      });
    }

    // Start the prediction
    const startResult = await fashnAI.runTryOn(model_image, garment_image, options);
    
    if (!startResult.success || !startResult.data?.id) {
      return res.status(startResult.status || 500).json({
        success: false,
        error: startResult.error || 'Failed to start prediction',
        data: startResult.data
      });
    }

    const predictionId = startResult.data.id;
    console.log('[FashnAI Route] Prediction started, ID:', predictionId);

    // Poll until completion
    const pollResult = await fashnAI.pollUntilComplete(predictionId);
    
    res.status(pollResult.status || 200).json({
      success: pollResult.success,
      message: pollResult.success ? 'Try-on completed successfully' : 'Try-on failed',
      data: pollResult.data,
      error: pollResult.error
    });
  } catch (error: any) {
    console.error('[FashnAI Route] Complete try-on error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Get FashnAI service status
 * GET /api/fashn/service-status
 */
export async function getServiceStatus(req: Request, res: Response) {
  try {
    const hasApiKey = !!process.env.FASHN_API_KEY;
    const serviceInitialized = !!fashnAI;

    res.json({
      success: true,
      status: {
        hasApiKey,
        serviceInitialized,
        ready: hasApiKey && serviceInitialized
      }
    });
  } catch (error: any) {
    console.error('[FashnAI Route] Service status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 