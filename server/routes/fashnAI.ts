import { Request, Response } from 'express';
import { createFashnAIService } from '../services/fashnAI';

// Initialize Fashn AI service
const fashnAI = createFashnAIService();

/**
 * Test Fashn AI API connection
 * GET /api/fashn/test
 */
export async function testFashnAI(req: Request, res: Response) {
  try {
    if (!fashnAI) {
      return res.status(500).json({
        success: false,
        error: 'Fashn AI service not initialized. Check API key configuration.'
      });
    }

    const result = await fashnAI.testConnection();
    
    res.status(result.status || 200).json({
      success: result.success,
      message: result.success ? 'Fashn AI connection successful' : 'Fashn AI connection failed',
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
 * Body: { personImage: string, garmentImage: string, options?: any }
 * Returns: { predictionId: string } - use this ID to check status
 */
export async function generateTryOn(req: Request, res: Response) {
  try {
    if (!fashnAI) {
      return res.status(500).json({
        success: false,
        error: 'Fashn AI service not initialized. Check API key configuration.'
      });
    }

    const { personImage, garmentImage, options } = req.body;

    if (!personImage || !garmentImage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: personImage and garmentImage'
      });
    }

    const result = await fashnAI.generateTryOn(personImage, garmentImage, options);
    
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
        error: 'Fashn AI service not initialized. Check API key configuration.'
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
        error: 'Fashn AI service not initialized. Check API key configuration.'
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
 * Upload image to Fashn AI
 * POST /api/fashn/upload
 * Body: FormData with image file
 */
export async function uploadImage(req: Request, res: Response) {
  try {
    if (!fashnAI) {
      return res.status(500).json({
        success: false,
        error: 'Fashn AI service not initialized. Check API key configuration.'
      });
    }

    // Handle file upload from request
    if (!req.file && !req.body.image) {
      return res.status(400).json({
        success: false,
        error: 'No image provided'
      });
    }

    let imageData: Buffer | string;
    let filename: string | undefined;

    if (req.file) {
      imageData = req.file.buffer;
      filename = req.file.originalname;
    } else {
      imageData = req.body.image;
    }

    const result = await fashnAI.uploadImage(imageData, filename);
    
    res.status(result.status || 200).json({
      success: result.success,
      message: result.success ? 'Image uploaded successfully' : 'Image upload failed',
      data: result.data,
      error: result.error
    });
  } catch (error: any) {
    console.error('[FashnAI Route] Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Run Fashn AI model
 * POST /api/fashn/run
 * Body: { model: string, parameters: any }
 */
export async function runModel(req: Request, res: Response) {
  try {
    if (!fashnAI) {
      return res.status(500).json({
        success: false,
        error: 'Fashn AI service not initialized. Check API key configuration.'
      });
    }

    const payload = req.body;

    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing request payload'
      });
    }

    const result = await fashnAI.runModel(payload);
    
    res.status(result.status || 200).json({
      success: result.success,
      message: result.success ? 'Model executed successfully' : 'Model execution failed',
      data: result.data,
      error: result.error
    });
  } catch (error: any) {
    console.error('[FashnAI Route] Model execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Get Fashn AI service status
 * GET /api/fashn/status
 */
export async function getStatus(req: Request, res: Response) {
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
    console.error('[FashnAI Route] Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 