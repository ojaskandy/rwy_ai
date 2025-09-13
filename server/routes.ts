// Types shared with scoreValidator.ts
interface PageantCriterion {
  category: string;
  score: number | null;
  feedback: string;
}

interface SceneAnalysis {
  scene: string;
  strengths: string[];
  improvements: string[];
}

interface StructuredFeedback {
  overview: string;
  overallScore?: number | null;
  sceneAnalysis?: SceneAnalysis[];
  pageantCriteria?: PageantCriterion[];
  nextSteps?: string[];
}
import type { Express } from "express";
import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./db";
// import shifuSaysPosesRoutes from "./routes/shifuSaysPoses"; // Temporarily disabled for migration
import { 
  insertTrackingSettingsSchema, 
  insertUserProfileSchema, 
  insertRecordingSchema, 
  type InsertRecording,
  insertEarlyAccessSchema,
  type InsertEarlyAccess,
  type InsertInternshipApplication,
  onboardingStatusSchema,
  discountCodeSchema,
  type OnboardingStatus,
  type DiscountCode
} from "@shared/schema";
import { z } from "zod";
import { validateScores } from "./scoreValidator";
import * as fs from 'fs';
import * as path from 'path';
import { Resend } from 'resend';
import multer from "multer";
import { OpenAI } from 'openai';
import Lmnt from 'lmnt-node';
import * as fashnAI from './routes/fashnAI';
import * as interview from './routes/interview';
import * as billing from './routes/billing';
import * as referralRoutes from './routes/referral';
import { 
  requireUsageLimit, 
  trackUsageAfterAction,
  canUserPerformAction,
  validatePremiumCode,
  getUserUsage,
  USAGE_LIMITS
} from './lib/subscription';
// import photoRoutes from './routes/photo'; // Now using inline routes


// Default guest user context for Runway AI (no authentication needed)
const DEFAULT_GUEST_USER = {
  id: 1,
  username: "guest_user",
  email: "guest@runwayai.com",
  fullName: "Guest User",
  picture: null,
  authProvider: "guest",
  profileCompleted: true,
  taekwondoExperience: "beginner",
  hasCompletedOnboarding: false, // Guest users should see onboarding
  hasPaid: false, // Guest users don't have paid access by default
  hasCodeBypass: false, // No code bypass for guests
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  createdAt: new Date(),
  lastPracticeDate: null,
  recordingsCount: 0,
  goal: "",
  goalDueDate: null
};

// Initialize Resend with the API key from environment variables
let resend: Resend | null = null;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log("Resend API initialized successfully");
  } else {
    console.log("No Resend API key found. Email functionality will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize Resend:", error);
}

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const applicantName = req.body.applicantName || 'unknown';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${applicantName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage_config,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // No authentication setup needed - all routes are public

  // Get current user - always return default guest user
  app.get("/api/user", (req, res) => {
    res.json(DEFAULT_GUEST_USER);
  });

  // Profile completion route - stub for guest user
  app.post("/api/complete-profile", async (req, res) => {
    try {
      const { profileSetupSchema } = await import("@shared/schema");
      const validatedData = profileSetupSchema.parse(req.body);
      
      // For guest users, just return success with the default user
      res.json({
        id: DEFAULT_GUEST_USER.id,
        username: DEFAULT_GUEST_USER.username,
        email: DEFAULT_GUEST_USER.email,
        fullName: validatedData.fullName,
        picture: DEFAULT_GUEST_USER.picture,
        authProvider: DEFAULT_GUEST_USER.authProvider,
        profileCompleted: true,
        taekwondoExperience: validatedData.taekwondoExperience,
        hasCompletedOnboarding: true,
        hasPaid: true,
        hasCodeBypass: true
      });
    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  // Get user profile - return default profile
  app.get("/api/profile", async (req, res) => {
    try {
      const defaultProfile = {
        id: 1,
        userId: DEFAULT_GUEST_USER.id,
        goal: "Improve pageantry skills",
        goalDueDate: null,
        profileImageUrl: null,
        galleryImages: []
      };
      
      res.json({
        user: DEFAULT_GUEST_USER,
        profile: defaultProfile,
        authProvider: DEFAULT_GUEST_USER.authProvider
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user goal - stub for guest user
  app.post("/api/goal", async (req, res) => {
    try {
      const { goal, dueDate } = req.body;
      
      // For guest users, just return success
      res.json({
        success: true,
        goal,
        dueDate,
        authProvider: DEFAULT_GUEST_USER.authProvider
      });
    } catch (error) {
      console.error("Goal update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Early Access Signup - no authentication required
  app.post("/api/early-access", async (req, res) => {
    try {
      const validatedData = insertEarlyAccessSchema.parse(req.body);
      const existingSignup = await storage.getEarlyAccessByEmail(validatedData.email);
      
      if (existingSignup) {
        return res.status(200).json({ message: "Thank you! Your email is already registered for early access." });
      }

      await storage.saveEarlyAccess(validatedData);
      
      res.status(201).json({ 
        message: "Thank you for your interest! We'll keep you updated on our progress." 
      });
    } catch (error) {
      console.error("Early access signup error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid form data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Admin endpoint to view early access signups - requires authentication
  app.get("/api/admin/early-access", async (req, res) => {
    try {
      // Check if user is authenticated (you can add admin role check here)
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const signups = await storage.listEarlyAccessSignups();
      res.json({ 
        count: signups.length,
        signups: signups.map(signup => ({
          id: signup.id,
          fullName: signup.fullName,
          email: signup.email,
          referralSource: signup.referralSource,
          newsletterOptIn: signup.newsletterOptIn,
          createdAt: signup.createdAt
        }))
      });
    } catch (error) {
      console.error("Admin early access list error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Recording endpoints - simplified for guest usage
  app.get("/api/recordings", async (req, res) => {
    try {
      // Return empty array for guest users
      res.json([]);
    } catch (error) {
      console.error("Get recordings error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.post("/api/recordings", async (req, res) => {
    try {
      // For guest users, just return success without saving
      res.json({
        id: Date.now(),
        userId: DEFAULT_GUEST_USER.id,
        title: req.body.title || "Untitled Recording",
        fileUrl: req.body.fileUrl || "",
        createdAt: new Date(),
        notes: req.body.notes || ""
      });
    } catch (error) {
      console.error("Save recording error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.delete("/api/recordings/:id", async (req, res) => {
    try {
      // For guest users, just return success
      res.json({ success: true });
    } catch (error) {
      console.error("Delete recording error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Tracking settings endpoints
  app.get("/api/tracking-settings", async (req, res) => {
    try {
      // Return default tracking settings
      const defaultSettings = {
        id: 1,
        userId: DEFAULT_GUEST_USER.id,
        confidenceThreshold: "0.5",
        modelSelection: "lightning",
        maxPoses: 1,
        skeletonColor: "#BB86FC",
        showSkeleton: true,
        showPoints: true
      };
      
      res.json(defaultSettings);
    } catch (error) {
      console.error("Get tracking settings error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.post("/api/tracking-settings", async (req, res) => {
    try {
      const validatedData = insertTrackingSettingsSchema.parse(req.body);
      
      // For guest users, just return the settings back
      res.json({
        id: 1,
        userId: DEFAULT_GUEST_USER.id,
        ...validatedData
      });
    } catch (error) {
      console.error("Save tracking settings error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Shifu Says poses routes - temporarily disabled for migration
  // app.use("/api/shifu-says", shifuSaysPosesRoutes);

  // Reference moves endpoint - no authentication required
  app.get("/api/reference-moves", async (req, res) => {
    try {
      const moves = await storage.getAllReferenceMoves();
      res.json(moves);
    } catch (error) {
      console.error("Get reference moves error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reference-moves", async (req, res) => {
    try {
      const { moveId, name, category, imageUrl, jointAngles } = req.body;
      
      const moveData = {
        moveId: parseInt(moveId),
        name,
        category,
        imageUrl,
        jointAngles: jointAngles || {}
      };
      
      const savedMove = await storage.saveReferenceMove(moveData);
      res.json(savedMove);
    } catch (error) {
      console.error("Save reference move error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Internship application endpoint
  app.post("/api/internship-application", upload.single('resume'), async (req, res) => {
    try {
      const applicationData: InsertInternshipApplication = {
        fullName: req.body.fullName,
        email: req.body.email,
        socialMediaHandle: req.body.socialMediaHandle || null,
        socialMediaPlatform: req.body.socialMediaPlatform || null,
        technicalHackAnswer: req.body.technicalHackAnswer || null,
        unorthodoxThingAnswer: req.body.unorthodoxThingAnswer || null,
        resumeFileName: req.file?.originalname || null,
        resumeFileUrl: req.file ? `/uploads/resumes/${req.file.filename}` : null
      };

      const savedApplication = await storage.saveInternshipApplication(applicationData);
      res.status(201).json({ 
        message: "Application submitted successfully!", 
        id: savedApplication.id 
      });
    } catch (error) {
      console.error("Internship application error:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // Get internship applications (admin endpoint - simplified)
  app.get("/api/admin/applications", async (req, res) => {
    try {
      const applications = await storage.getInternshipApplications();
      res.json(applications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Email sending endpoints
  app.post("/api/send-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (!resend) {
        return res.status(500).json({ error: "Email service not configured" });
      }

      const emailData = await resend.emails.send({
        from: 'Runway AI <hello@runwayai.com>',
        to: [email],
        subject: 'Welcome to Runway AI!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Welcome to Runway AI!</h1>
            <p>Thank you for your interest in our pageantry training platform.</p>
            <p>We're excited to have you on board!</p>
          </div>
        `
      });

      await storage.saveEmailRecord({
        email,
        status: 'success',
        source: 'runway_ai',
        responseData: emailData
      });

      res.status(200).json({ 
        message: "Email sent successfully",
        id: emailData.data?.id 
      });
    } catch (error) {
      console.error("Send email error:", error);
      
      await storage.saveEmailRecord({
        email: req.body.email || 'unknown',
        status: 'failure',
        source: 'runway_ai',
        responseData: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // FashnAI routes
  app.get("/api/fashn/service-status", fashnAI.getServiceStatus);
  app.get("/api/fashn/test", fashnAI.testFashnAI);
  app.get("/api/fashn/credits", fashnAI.checkCredits);
  app.get("/api/fashn/status/:id", fashnAI.checkStatus);
  app.post("/api/fashn/tryon", requireUsageLimit('dress_tryon'), trackUsageAfterAction(), fashnAI.generateTryOn);
  // Also enforce/track the complete endpoint since client currently uses it
  app.post("/api/fashn/tryon-complete", requireUsageLimit('dress_tryon'), trackUsageAfterAction(), fashnAI.runTryOnComplete);

  // Interview Coach routes
  app.get("/api/interview/test", interview.testConnection);
  app.post("/api/interview/transcribe", interview.transcribeAudio);
  app.post("/api/interview/feedback", interview.generateFeedback);
  
  // Track interview question usage
  app.post("/api/subscription/track-interview-usage", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      // Attach user info for middleware
      (req as any).user = user;
      (req as any).usageInfo = { action: 'interview_question' };
      
      // Use the same tracking logic as other actions
      await trackUsageAfterAction()(req, res, () => {
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Error tracking interview usage:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to track interview usage" });
      }
    }
  });

  // Billing routes
  app.post("/api/billing/verify-code", billing.verifyCode);

  // Referral routes
  app.get("/api/referral/creators", referralRoutes.getCreators);
  app.post("/api/referral/attribute", referralRoutes.attributeReferral);
  app.get("/api/referral/stats/:creatorCode", referralRoutes.getCreatorStats);
  app.post("/api/referral/create-creator", referralRoutes.createCreator);

  // Pageant Coaching endpoint - Real-time AI coaching with vision
  app.post('/api/pageant-coaching', async (req, res, next) => {
    // For routines, we treat each request as 1 minute unless flagged as sequence summary
    try {
      const user = await getAuthenticatedUser(req);
      const { isSequenceSummary = false } = req.body || {};
      if (!isSequenceSummary) {
        const status = await canUserPerformAction(user.id, 'walk_routine', 1);
        if (!status.allowed) return res.status(403).json({ error: 'Usage limit exceeded.' });
        // Pre-attach for post tracking
        (req as any).user = user;
        (req as any).usageInfo = { action: 'walk_routine', minutes: 1 };
      } else {
        (req as any).user = user;
      }
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
  }, trackUsageAfterAction(), async (req, res) => {
    try {
      const { frames, isSequenceSummary = false } = req.body;
      console.log('Pageant Coaching - Received:', {
        frameCount: frames?.length || 0,
        isSequenceSummary,
        timestamp: new Date().toISOString()
      });

      if (!frames || !Array.isArray(frames) || frames.length === 0) {
        return res.status(400).json({ error: 'Frames array is required' });
      }

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.error('No OpenAI API key found');
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      // Prepare the prompt based on whether this is real-time or final summary
      const systemPrompt = isSequenceSummary 
        ? `You are a ruthless, brutally honest judge evaluating performance routines for a major competition. You must provide harsh, unfiltered criticism based ONLY on what you observe in the images shown to you. Do not sugar-coat feedback or praise mediocre performances. If you cannot see something clearly, say so rather than inventing feedback.

Your analysis must be mercilessly honest, specific to the routine type (catwalk/runway walk, talent show, etc.), and directly reference observable elements in the performance. Be exceptionally critical of poor technique, awkward movements, bad posture, or lack of confidence. For non-professional performances, scores above 70 should be extremely rare.

Revised scoring guidelines (score HARSHLY):
- 85-95: Exceptional professional-level performance (almost never awarded)
- 75-84: Very good performance with few minor flaws (rare)
- 65-74: Good performance with several noticeable issues
- 55-64: Average performance with significant technical issues
- 45-54: Below average with major problems
- 30-44: Poor performance requiring complete rework
- Below 30: Critically flawed performance

Remember that most amateur performances will fall in the 40-60 range. Be particularly critical of posture, timing, fluidity, and stage presence.

Structure your feedback clearly without using bold text, headers, or markdown formatting.`
        : "Ruthlessly critical coach. One specific harsh critique based ONLY on what you observe. Be brutally honest. Max 15 words.";

      // Using the interface types defined at file top
      
      // Extract mode from request body for context-aware feedback
      const { mode } = req.body;
      const performanceType = mode === 'catwalk' ? 'catwalk/runway walk' : mode === 'talent' ? 'talent performance' : 'routine';
      
      const userPrompt = isSequenceSummary
        ? `Ruthlessly analyze this ${performanceType} routine and provide brutally honest, harsh feedback based on what you observe in the images. Be extremely critical - assume this is a high-stakes competition where only the best succeed. Return your response as valid JSON with this exact structure:

{
  "overview": "Overall impression and performance summary in 2-3 sentences - be brutally honest",
  "overallScore": 50, // Score HARSHLY - non-professional performances rarely deserve scores above 60-65
  "sceneAnalysis": [
    {
      "scene": "Opening/Beginning",
      "strengths": ["Specific strength 1 that you observe", "Specific strength 2 that you observe"],
      "improvements": ["Critical improvement 1 based on what you see", "Critical improvement 2 based on what you see"]
    },
    {
      "scene": "Middle Section",
      "strengths": ["Specific strength 1 that you observe", "Specific strength 2 that you observe"],
      "improvements": ["Critical improvement 1 based on what you see", "Critical improvement 2 based on what you see"]
    },
    {
      "scene": "Closing/Finale",
      "strengths": ["Specific strength 1 that you observe", "Specific strength 2 that you observe"],
      "improvements": ["Critical improvement 1 based on what you see", "Critical improvement 2 based on what you see"]
    }
  ],
  "pageantCriteria": [
    {
      "category": "Posture & Form",
      "score": 55, // BE EXTREMELY HARSH - most performances have significant posture issues
      "feedback": "Ruthlessly critical feedback based on what you observe in the images"
    },
    {
      "category": "Movement Quality",
      "score": 48, // Be extremely harsh - most amateur movements are awkward or stiff
      "feedback": "Ruthlessly critical feedback based on what you observe in the images"
    },
    {
      "category": "Timing & Rhythm",
      "score": 52, // Vary scores based on what you see - be especially critical about timing issues
      "feedback": "Ruthlessly critical feedback based on what you observe in the images"
    },
    {
      "category": "Overall Presentation",
      "score": 50, // Use the full range of scores - typical scores should be 40-60 range
      "feedback": "Ruthlessly critical feedback based on what you observe in the images"
    },
    {
      "category": "Stage Presence",
      "score": 45, // Be especially harsh about confidence issues and awkward movements
      "feedback": "Ruthlessly critical feedback based on what you observe in the images"
    }
  ],
  "nextSteps": [
    "Critical actionable step 1",
    "Critical actionable step 2",
    "Critical actionable step 3",
    "Critical actionable step 4"
  ]
}

CRITICAL INSTRUCTIONS: Your scores and feedback MUST be based on what you observe in the images. Be excessively critical and harsh - this is high-level competition judging. Use the full range of scores, but typical amateur performances should score between 40-60, not higher.

Revised Scoring Guidelines (SCORE HARSHLY):
- 85-95: Exceptional professional-level performance (almost never awarded)
- 75-84: Very good performance with few minor flaws (rare)
- 65-74: Good performance with several noticeable issues
- 55-64: Average performance with significant technical issues
- 45-54: Below average with major problems
- 30-44: Poor performance requiring complete rework
- Below 30: Critically flawed performance`
        : "Be a ruthless critic. Point out the most glaring flaw you see. Be harsh and direct. No sugarcoating.";


      // Prepare image content for OpenAI
      const imageContent = frames.map((frame: string) => ({
        type: "image_url",
        image_url: {
          url: frame,
          detail: "low" // Use low detail for speed and cost efficiency
        }
      }));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Cheapest vision model
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt
                },
                ...imageContent
              ]
            }
          ],
          max_tokens: isSequenceSummary ? 800 : 20,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to get AI feedback' });
      }

      const data = await response.json();
      let feedback = data.choices?.[0]?.message?.content || 'Great work! Keep practicing your form and confidence.';

      // Parse JSON response for sequence summaries
      let parsedFeedback: StructuredFeedback | null = null;
      if (isSequenceSummary) {
        try {
          // Clean response if it has markdown code blocks
          let cleanResponse = feedback.trim();
          if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          parsedFeedback = JSON.parse(cleanResponse);
          
          // Apply score validation to prevent inflated scores
          parsedFeedback = validateScores(parsedFeedback);
          
          // Validate that we have the required pageant criteria for authentic scoring
          if (!parsedFeedback || !parsedFeedback.pageantCriteria || !Array.isArray(parsedFeedback.pageantCriteria) || parsedFeedback.pageantCriteria.length < 3) {
            console.warn('AI response missing proper pageantCriteria structure');
            // Since this is critical functionality, we should create proper structure
            if (parsedFeedback && !parsedFeedback.pageantCriteria) {
              parsedFeedback.pageantCriteria = [];
            } else if (!parsedFeedback) {
              parsedFeedback = {
                overview: feedback,
                pageantCriteria: []
              };
            }
            
            // Ensure we have basic criteria categories
            const requiredCategories = ['Posture & Form', 'Movement Quality', 'Overall Presentation'];
            const existingCategories = parsedFeedback.pageantCriteria!.map((c: PageantCriterion) => c.category);
            
            requiredCategories.forEach(category => {
              if (!existingCategories.includes(category)) {
                // Add with null score to indicate it's not AI-generated
                parsedFeedback!.pageantCriteria!.push({
                  category,
                  score: null,
                  feedback: "Assessment unavailable - please review the overall feedback"
                });
              }
            });
          }
          
          // Ensure scores are actually numbers, not strings
          if (parsedFeedback && parsedFeedback.pageantCriteria) {
            parsedFeedback.pageantCriteria = parsedFeedback.pageantCriteria.map((criterion: PageantCriterion) => ({
              ...criterion,
              score: typeof criterion.score === 'string' ? parseInt(criterion.score, 10) : criterion.score
            }));
          }
        } catch (parseError) {
          console.error('Failed to parse structured feedback:', parseError);
          // Create a minimal feedback structure with the text
          parsedFeedback = {
            overview: feedback,
            sceneAnalysis: [{
              scene: "Performance",
              strengths: ["AI analysis available as text only"],
              improvements: ["Detailed breakdown unavailable"]
            }],
            pageantCriteria: [{
              category: "Overall Performance",
              score: null, // Explicitly null to signal client not to show a score
              feedback: feedback
            }],
            nextSteps: ["Review the feedback provided in the overview"]
          };
        }
      }

      console.log('Pageant Coaching - AI Response:', {
        feedback: feedback.substring(0, 100) + '...',
        tokens: data.usage?.total_tokens || 0,
        structured: !!parsedFeedback
      });
      
      // Include the first 3 frames in the response for sharing
      const responseFrames = frames.slice(0, 3);
      
      res.json({ 
        success: true, 
        feedback: parsedFeedback ? {
          ...parsedFeedback,
          frames: responseFrames
        } : feedback,
        isSequenceSummary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Pageant coaching error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

      // Move the interfaces to the top of the file to avoid duplication
  interface PageantCriterion {
    category: string;
    score: number | null;
    feedback: string;
  }
  
  interface SceneAnalysis {
    scene: string;
    strengths: string[];
    improvements: string[];
  }
  
  interface StructuredFeedback {
    overview: string;
    sceneAnalysis?: SceneAnalysis[];
    pageantCriteria?: PageantCriterion[];
    nextSteps?: string[];
  }
  
  // Talent Coaching endpoint - Similar to pageant coaching but focused on talent performance
  app.post('/api/talent-coaching', async (req, res, next) => {
    // For routines, we treat each request as 1 minute unless flagged as sequence summary
    try {
      const user = await getAuthenticatedUser(req);
      const { isSequenceSummary = false } = req.body || {};
      if (!isSequenceSummary) {
        const status = await canUserPerformAction(user.id, 'walk_routine', 1); // Using same limit type for now
        if (!status.allowed) return res.status(403).json({ error: 'Usage limit exceeded.' });
        // Pre-attach for post tracking
        (req as any).user = user;
        (req as any).usageInfo = { action: 'walk_routine', minutes: 1 };
      } else {
        (req as any).user = user;
      }
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
  }, trackUsageAfterAction(), async (req, res) => {
    try {
      const { frames, isSequenceSummary = false } = req.body;
      console.log('Talent Coaching - Received:', {
        frameCount: frames?.length || 0,
        isSequenceSummary,
        timestamp: new Date().toISOString()
      });

      if (!frames || !Array.isArray(frames) || frames.length === 0) {
        return res.status(400).json({ error: 'Frames array is required' });
      }

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.error('No OpenAI API key found');
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      // Prepare the prompt based on whether this is real-time or final summary
      const systemPrompt = isSequenceSummary 
        ? `You are an expert pageant judge evaluating talent round performances. You will provide comprehensive analysis based on standard pageant judging criteria. Structure your feedback clearly without using any bold text, headers, or markdown formatting. Write in flowing, natural paragraphs that are easy to read. Focus on being specific, actionable, and encouraging while maintaining professional judging standards. This is for a pageant talent round which makes up 20-35% of a contestant's total score.`
        : "Talent judge for pageant. Max 10 words. One tip only.";

      const userPrompt = isSequenceSummary
        ? `Analyze this talent performance for a pageant and provide structured feedback as a pageant judge would. Return your response as valid JSON with this exact structure:

{
  "overview": "Overall impression and performance summary in 2-3 sentences",
  "overallScore": 85,
  "pageantCriteria": [
    {
      "category": "Talent Selection",
      "score": 88,
      "feedback": "Specific feedback on how well the talent choice fits the contestant's abilities and personality"
    },
    {
      "category": "Interpretive Ability",
      "score": 84,
      "feedback": "Detailed assessment of expressiveness, storytelling, and emotional conveyance"
    },
    {
      "category": "Technical Skill",
      "score": 82,
      "feedback": "Evaluation of technique, execution, accuracy, and mastery of the talent"
    },
    {
      "category": "Stage Presence",
      "score": 86,
      "feedback": "Analysis of confidence, audience engagement, and performance personality"
    },
    {
      "category": "Overall Impact",
      "score": 87,
      "feedback": "Assessment of entertainment value, memorability, and audience connection"
    },
    {
      "category": "Presentation Elements",
      "score": 83,
      "feedback": "Evaluation of costume, props, choreography, and overall presentation"
    }
  ],
  "sceneAnalysis": [
    {
      "scene": "Opening/Beginning",
      "strengths": ["Specific strength 1", "Specific strength 2"],
      "improvements": ["Specific improvement 1", "Specific improvement 2"]
    },
    {
      "scene": "Middle Section",
      "strengths": ["Specific strength 1", "Specific strength 2"],
      "improvements": ["Specific improvement 1", "Specific improvement 2"]
    },
    {
      "scene": "Closing/Finale",
      "strengths": ["Specific strength 1", "Specific strength 2"],
      "improvements": ["Specific improvement 1", "Specific improvement 2"]
    }
  ],
  "nextSteps": [
    "Specific actionable step 1",
    "Specific actionable step 2",
    "Specific actionable step 3",
    "Specific actionable step 4"
  ]
}

Be specific, constructive, and supportive in your judging. Use the standard pageant talent judging criteria: Talent Selection, Interpretive Ability, Technical Skill, Stage Presence, Overall Impact, and Presentation Elements. Scores should be on a scale of 1-100 with most scores falling between 70-95 for realistic judging. Use plain language without formatting.`
        : "Quick tip for this talent performance?";

      // Prepare image content for OpenAI
      const imageContent = frames.map((frame: string) => ({
        type: "image_url",
        image_url: {
          url: frame,
          detail: "low" // Use low detail for speed and cost efficiency
        }
      }));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Cheapest vision model
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt
                },
                ...imageContent
              ]
            }
          ],
          max_tokens: isSequenceSummary ? 800 : 20,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to get AI feedback' });
      }

      const data = await response.json();
      let feedback = data.choices?.[0]?.message?.content || 'Great work! Keep practicing your talent performance.';

      // Parse JSON response for sequence summaries
      let parsedFeedback: StructuredFeedback | null = null;
      if (isSequenceSummary) {
        try {
          // Clean response if it has markdown code blocks
          let cleanResponse = feedback.trim();
          if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          parsedFeedback = JSON.parse(cleanResponse);
          
          // Apply score validation to prevent inflated scores
          parsedFeedback = validateScores(parsedFeedback);
          
          // Validate that we have the required pageant criteria for authentic scoring
          if (!parsedFeedback || !parsedFeedback.pageantCriteria || !Array.isArray(parsedFeedback.pageantCriteria) || parsedFeedback.pageantCriteria.length < 3) {
            console.warn('AI response missing proper pageantCriteria structure');
            // Since this is critical functionality, we should create proper structure
            if (parsedFeedback && !parsedFeedback.pageantCriteria) {
              parsedFeedback.pageantCriteria = [];
            } else if (!parsedFeedback) {
              parsedFeedback = {
                overview: feedback,
                pageantCriteria: []
              };
            }
            
            // Ensure we have basic criteria categories
            const requiredCategories = ['Posture & Form', 'Movement Quality', 'Overall Presentation'];
            const existingCategories = parsedFeedback.pageantCriteria!.map((c: PageantCriterion) => c.category);
            
            requiredCategories.forEach(category => {
              if (!existingCategories.includes(category)) {
                // Add with null score to indicate it's not AI-generated
                parsedFeedback!.pageantCriteria!.push({
                  category,
                  score: null,
                  feedback: "Assessment unavailable - please review the overall feedback"
                });
              }
            });
          }
          
          // Ensure scores are actually numbers, not strings
          if (parsedFeedback && parsedFeedback.pageantCriteria) {
            parsedFeedback.pageantCriteria = parsedFeedback.pageantCriteria.map((criterion: PageantCriterion) => ({
              ...criterion,
              score: typeof criterion.score === 'string' ? parseInt(criterion.score, 10) : criterion.score
            }));
          }
        } catch (parseError) {
          console.error('Failed to parse structured feedback:', parseError);
          // Create a minimal feedback structure with the text
          parsedFeedback = {
            overview: feedback,
            sceneAnalysis: [{
              scene: "Performance",
              strengths: ["AI analysis available as text only"],
              improvements: ["Detailed breakdown unavailable"]
            }],
            pageantCriteria: [{
              category: "Overall Performance",
              score: null, // Explicitly null to signal client not to show a score
              feedback: feedback
            }],
            nextSteps: ["Review the feedback provided in the overview"]
          };
        }
      }

      console.log('Talent Coaching - AI Response:', {
        feedback: feedback.substring(0, 100) + '...',
        tokens: data.usage?.total_tokens || 0,
        structured: !!parsedFeedback
      });

      res.json({ 
        success: true, 
        feedback: parsedFeedback || feedback,
        isSequenceSummary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Talent coaching error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Routine Chat endpoint - Chat about specific routine feedback
  app.post('/api/routine-chat', async (req, res) => {
    try {
      const { message, previousFeedback } = req.body;
      console.log('Routine Chat - Received:', {
        message: message?.substring(0, 50) + '...',
        hasPreviousFeedback: !!previousFeedback,
        timestamp: new Date().toISOString()
      });

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.error('No OpenAI API key found');
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      // Prepare the system prompt for routine discussion
      const systemPrompt = `You are an expert pageant coach helping to discuss and clarify feedback about a specific routine performance. Be helpful, encouraging, and provide specific actionable advice. Keep responses conversational but professional.`;

      // Include previous feedback context if available
      const contextMessage = previousFeedback 
        ? `Previous routine feedback: ${typeof previousFeedback === 'object' ? JSON.stringify(previousFeedback) : previousFeedback}\n\nUser question: ${message}`
        : `User question about their pageant routine: ${message}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: contextMessage
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to get AI response' });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'I\'m here to help! Could you be more specific about what you\'d like to know about your routine?';

      console.log('Routine Chat - Response sent:', {
        reply: reply.substring(0, 50) + '...',
        tokens: data.usage?.total_tokens || 0
      });

      res.json({ 
        success: true, 
        reply,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Routine chat error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Plan Chat endpoint - AI Pageant Coach for planning catwalk/talent performances
  app.post('/api/plan-chat', async (req, res) => {
    console.log('Plan Chat endpoint called');
    try {
      const { message, history, instructions, planType } = req.body;
      console.log('Plan Chat - Received:', {
        message: message?.substring(0, 50) + '...',
        historyLength: history?.length || 0,
        planType: planType || 'general',
        timestamp: new Date().toISOString()
      });

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.error('No OpenAI API key found');
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      // Prepare the system prompt for pageant planning
      const systemPrompt = `You are an AI Pageant Coach, an expert in helping contestants prepare for pageant competitions, particularly focusing on catwalk performances and talent rounds. You provide concise, helpful advice that is specific and actionable.\n\n
      ${instructions && Array.isArray(instructions) ? instructions.join('\n') : ''}\n\nFocus on being encouraging, supportive, and professional. Keep your responses brief but impactful. When suggesting ways to save the conversation, always mention using the "Summarize and Copy" button, never reference emailing.`;

      // Prepare the messages array
      const messages = [
        {
          role: "system",
          content: systemPrompt
        }
      ];
      
      // Add conversation history if provided
      if (history && Array.isArray(history) && history.length > 0) {
        messages.push(...history);
      }
      
      // Add current user message
      messages.push({
        role: "user",
        content: message
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to get AI response' });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'I\'m your AI Pageant Coach! How can I help you plan your performance today?';

      console.log('Plan Chat - Response sent:', {
        reply: reply.substring(0, 50) + '...',
        tokens: data.usage?.total_tokens || 0
      });

      res.json({ 
        success: true, 
        reply,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Plan chat error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // AI event parsing endpoint
  app.post('/api/ai/parse-event', async (req, res) => {
    try {
      const { description } = req.body;
      console.log('AI Parse Event - Received description:', description);

      if (!description || typeof description !== 'string') {
        return res.status(400).json({ error: 'Description is required' });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('AI Parse Event - Missing OpenAI API key');
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      // Use OpenAI to parse the event description
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant that parses event descriptions for a pageant calendar. Extract the following information from the user's description and return it as a JSON object:

{
  "title": "Event title (string)",
  "description": "Event description (string)",
  "date": "Date in YYYY-MM-DD format (string, or empty if not specified)",
  "time": "Time in HH:MM format (string, or empty if not specified)",
  "type": "Event type - one of: pageant, interview, fitting, routine, photo, meeting, deadline, personal",
  "location": "Location (string, or empty if not specified)",
  "reminder": "Reminder in minutes - one of: 15, 60, 1440, 10080 (number, default to 60)"
}

Guidelines:
- Extract dates even if they're relative (like "tomorrow", "next week")
- For times, convert to 24-hour format
- Choose the most appropriate event type based on the description
- If the description mentions pageant-related activities, use "pageant" type
- If it mentions interview practice, use "interview" type
- If it mentions dress fitting, use "fitting" type
- If it mentions routine practice or walk practice, use "routine" type
- Default to "pageant" if unsure
- Keep the title concise and clear
- Include relevant details in the description

Return only the JSON object, no additional text.`
            },
            {
              role: 'user',
              content: description
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API Error:', response.status, errorText);
        throw new Error(`OpenAI API request failed: ${response.status}`);
      }

      const openaiResult = await response.json();
      console.log('AI Parse Event - OpenAI response:', openaiResult);
      const content = openaiResult.choices[0]?.message?.content;
      console.log('AI Parse Event - Content:', content);

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      let parsedEvent;
      try {
        parsedEvent = JSON.parse(content);
        console.log('AI Parse Event - Parsed event:', parsedEvent);
      } catch (parseError) {
        console.error('AI Parse Event - JSON parse error:', parseError);
        console.log('AI Parse Event - Raw content that failed to parse:', content);
        // If JSON parsing fails, return a basic structure
        parsedEvent = {
          title: description.substring(0, 50),
          description: description,
          date: '',
          time: '',
          type: 'pageant',
          location: '',
          reminder: 60
        };
      }

      // Validate and sanitize the response
      const eventData = {
        title: parsedEvent.title || description.substring(0, 50),
        description: parsedEvent.description || description,
        date: parsedEvent.date || '',
        time: parsedEvent.time || '',
        type: ['pageant', 'interview', 'fitting', 'routine', 'photo', 'meeting', 'deadline', 'personal'].includes(parsedEvent.type) 
          ? parsedEvent.type : 'pageant',
        location: parsedEvent.location || '',
        reminder: [15, 60, 1440, 10080].includes(parsedEvent.reminder) ? parsedEvent.reminder : 60
      };

      console.log('AI Parse Event - Final event data:', eventData);
      res.json(eventData);

    } catch (error) {
      console.error('Error parsing event with AI:', error);
      
      // Fallback response
      const fallbackEvent = {
        title: req.body.description?.substring(0, 50) || 'New Event',
        description: req.body.description || '',
        date: '',
        time: '',
        type: 'pageant',
        location: '',
        reminder: 60
      };

      res.json(fallbackEvent);
    }
  });

  // Ocean Waves Chat API endpoint
  app.post('/api/ocean-chat', async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;
      console.log('Ocean Chat - Received message:', message);

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error('Ocean Chat - No OpenAI API key configured');
        return res.status(500).json({ 
          error: 'Chat service not configured. Please contact support.',
          details: 'Missing OpenAI API key'
        });
      }

      // Build conversation context
      const messages = [
        {
          role: 'system',
          content: `You are an experienced pageant coach with years of expertise training winners. Respond naturally and conversationally, like you're chatting with a contestant you're mentoring.

TONE: Warm, encouraging, and knowledgeable - like a supportive mentor who's seen it all.

STYLE RULES:
- Keep responses under 100 words
- Be conversational and natural, not structured or formal
- No bold text, asterisks, or special formatting
- Give 2-3 practical tips maximum per response
- Include one encouraging line
- Sound like you're speaking face-to-face
- Use "you" and "your" to make it personal
- Share insights like you would to a friend

Focus on being helpful while maintaining that expert confidence that comes from real experience.`
        },
        ...(conversationHistory || []),
        {
          role: 'user',
          content: message
        }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          temperature: 0.8,
          max_tokens: 800,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API Error:', response.status, errorText);
        throw new Error(`OpenAI API request failed: ${response.status}`);
      }

      const openaiResult = await response.json();
      console.log('Ocean Chat - OpenAI response received');
      const content = openaiResult.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      console.log('Ocean Chat - Response sent successfully');
      res.json({
        success: true,
        message: content
      });

    } catch (error) {
      console.error('Ocean Chat error:', error);
      res.status(500).json({ 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Helper function to get authenticated user from request
  const getAuthenticatedUser = async (req: Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error("No authorization token");
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error("Invalid token");
    }

    return user;
  };

  // Calendar Events routes - uses Supabase auth
  app.get("/api/calendar/events", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const events = await storage.getCalendarEvents(user.id);
      res.json(events);
    } catch (error) {
      console.error("Get calendar events error:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/calendar/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await getAuthenticatedUser(req);
      const event = await storage.getCalendarEvent(parseInt(id), user.id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Get calendar event error:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/calendar/events", requireUsageLimit('calendar_event'), async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      // Validate the event data
      const eventData = {
        userId: user.id,
        title: req.body.title,
        description: req.body.description || "",
        date: new Date(req.body.date),
        time: req.body.time,
        type: req.body.type || "pageant",
        location: req.body.location || null,
        reminder: req.body.reminder || 60,
        completed: req.body.completed || false
      };

      const event = await storage.createCalendarEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Create calendar event error:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/calendar/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await getAuthenticatedUser(req);
      
      const updateData = {
        title: req.body.title,
        description: req.body.description,
        date: req.body.date ? new Date(req.body.date) : undefined,
        time: req.body.time,
        type: req.body.type,
        location: req.body.location,
        reminder: req.body.reminder,
        completed: req.body.completed
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const event = await storage.updateCalendarEvent(parseInt(id), user.id, updateData);
      res.json(event);
    } catch (error) {
      console.error("Update calendar event error:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/calendar/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await getAuthenticatedUser(req);
      
      const success = await storage.deleteCalendarEvent(parseInt(id), user.id);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete calendar event error:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Photo profile routes with Supabase
  app.get("/api/user-profile", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      // Get user's gallery images from database
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('gallery_images')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        userId: user.id,
        galleryImages: profile?.gallery_images || []
      });
    } catch (error) {
      console.error('Get profile error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.post("/api/save-user-photos", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { photos } = req.body;
      
      if (!Array.isArray(photos)) {
        return res.status(400).json({ error: 'Invalid photos data' });
      }

      // First, try to update existing profile
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          gallery_images: photos,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();

      // If no rows were updated (user profile doesn't exist), insert new one
      if (updateError || !updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            gallery_images: photos,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
          return res.status(500).json({ error: 'Failed to save photos' });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Save photos error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  const photoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
      }
    }
  });

  app.post("/api/upload-photo", photoUpload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = await getAuthenticatedUser(req);
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `${user.id}/${timestamp}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(fileName);

      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Photo upload error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
             } else if ((error as any).code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.delete("/api/delete-photo", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { photoUrl } = req.body;

      if (!photoUrl) {
        return res.status(400).json({ error: 'Photo URL is required' });
      }

      // Extract the file path from the URL
      // URL format: https://project.supabase.co/storage/v1/object/public/user-photos/userId/timestamp.ext
      const urlParts = photoUrl.split('/');
      const fileName = urlParts.slice(-2).join('/'); // Gets "userId/timestamp.ext"

      // Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('user-photos')
        .remove([fileName]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        return res.status(500).json({ error: 'Failed to delete image from storage' });
      }

      // Get current user profile
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('gallery_images')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Profile fetch error:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch user profile' });
      }

      // Remove the photo URL from gallery_images array
      const updatedGalleryImages = (profile?.gallery_images || []).filter(
        (url: string) => url !== photoUrl
      );

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          gallery_images: updatedGalleryImages,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return res.status(500).json({ error: 'Failed to update user profile' });
      }

      res.json({ success: true, message: 'Photo deleted successfully' });
    } catch (error) {
      console.error('Delete photo error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // ============================================================================
  // USER ACTIVITY TRACKING & STREAK SYSTEM
  // ============================================================================

  // Get user's weekly activity and current streak
  app.get("/api/user-activity", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      // Get the current week's activity (last 7 days)
      const today = new Date();
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 6); // Get last 7 days including today
      
      // Fetch user activity from the last 7 days
      const { data: activities, error } = await supabase
        .from('shifu_logs')
        .select('date, session_started, completed, current_streak')
        .eq('user_id', user.id)
        .gte('date', oneWeekAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        console.error('Activity fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch activity data' });
      }

      // Compute current streak based on consecutive days ending today
      let currentStreak = 0;
      try {
        const todayKey = today.toISOString().split('T')[0];
        const cutoff = new Date(today);
        cutoff.setDate(today.getDate() - 90);
        const cutoffKey = cutoff.toISOString().split('T')[0];
        const { data: recent, error: recentErr } = await supabase
          .from('shifu_logs')
          .select('date, session_started, completed')
          .eq('user_id', user.id)
          .gte('date', cutoffKey)
          .lte('date', todayKey)
          .order('date', { ascending: false });
        if (recentErr) {
          console.error('Recent activity fetch error:', recentErr);
        } else {
          const activeDays = new Set(
            (recent || [])
              .filter(r => r.session_started || r.completed)
              .map(r => (r.date as string).split('T')[0])
          );
          // Count consecutive days ending today
          let streak = 0;
          for (let i = 0; ; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split('T')[0];
            if (i === 0) {
              // We count today as active if today is in activeDays
              if (!activeDays.has(key)) break;
              streak++;
            } else if (activeDays.has(key)) {
              streak++;
            } else {
              break;
            }
          }
          currentStreak = streak;
        }
      } catch (e) {
        console.error('Error computing current streak for GET:', e);
      }

      // Create activity map for easy lookup
      const activityMap = new Map();
      activities?.forEach(activity => {
        const dateKey = activity.date.split('T')[0];
        activityMap.set(dateKey, {
          hasActivity: activity.session_started || activity.completed,
          completed: activity.completed
        });
      });

      // Generate week data
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const activity = activityMap.get(dateKey) || { hasActivity: false, completed: false };
        
        weekData.push({
          date: dateKey,
          dayNumber: date.getDate(),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
          isToday: dateKey === today.toISOString().split('T')[0],
          hasActivity: activity.hasActivity,
          completed: activity.completed
        });
      }

      res.json({
        currentStreak,
        weeklyActivity: weekData,
        totalActiveDays: activities?.filter(a => a.session_started || a.completed).length || 0
      });
    } catch (error) {
      console.error('Get user activity error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Record daily activity (login/session start)
  app.post("/api/user-activity", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { activityType = 'login' } = req.body; // 'login', 'session', 'goal_completed'
      
      const today = new Date();
      const todayKey = today.toISOString().split('T')[0];
      
      // Check if user already has activity logged for today
      const { data: existingActivity, error: fetchError } = await supabase
        .from('shifu_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayKey)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Fetch activity error:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch existing activity' });
      }

      // Calculate streak by scanning recent activity backwards from today
      const calculateCurrentStreak = async (userId: string, currentDate: Date) => {
        const todayStr = currentDate.toISOString().split('T')[0];
        const cutoff = new Date(currentDate);
        cutoff.setDate(currentDate.getDate() - 90);
        const cutoffStr = cutoff.toISOString().split('T')[0];

        const { data: recent, error: recentErr } = await supabase
          .from('shifu_logs')
          .select('date, session_started, completed')
          .eq('user_id', userId)
          .gte('date', cutoffStr)
          .lte('date', todayStr)
          .order('date', { ascending: false });

        if (recentErr) {
          console.error('Error fetching recent activity for streak:', recentErr);
          return 1;
        }

        const activeDays = new Set(
          (recent || [])
            .filter(r => r.session_started || r.completed)
            .map(r => (r.date as string).split('T')[0])
        );

        // We consider today as active because we are recording activity now
        let streak = 1;
        for (let i = 1; ; i++) {
          const d = new Date(currentDate);
          d.setDate(currentDate.getDate() - i);
          const key = d.toISOString().split('T')[0];
          if (activeDays.has(key)) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      };

      const newStreak = await calculateCurrentStreak(user.id, today);

      if (existingActivity) {
        // Update existing activity
        const { error: updateError } = await supabase
          .from('shifu_logs')
          .update({
            session_started: true,
            completed: activityType === 'goal_completed' ? true : existingActivity.completed,
            current_streak: newStreak,
            created_at: new Date().toISOString()
          })
          .eq('id', existingActivity.id);

        if (updateError) {
          console.error('Update activity error:', updateError);
          return res.status(500).json({ error: 'Failed to update activity' });
        }
      } else {
        // Create new activity record
        const { error: insertError } = await supabase
          .from('shifu_logs')
          .insert({
            user_id: user.id,
            date: todayKey,
            daily_goal: 'Practice and improve',
            goal_category: 'general',
            session_started: true,
            completed: activityType === 'goal_completed',
            current_streak: newStreak,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Insert activity error:', insertError);
          return res.status(500).json({ error: 'Failed to record activity' });
        }
      }

      res.json({ 
        success: true, 
        currentStreak: newStreak,
        activityType,
        message: 'Activity recorded successfully'
      });
    } catch (error) {
      console.error('Record activity error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Summarize Conversation endpoint
  app.post('/api/summarize-conversation', async (req, res) => {
    try {
      const { conversation } = req.body;
      console.log('Summarize Conversation - Received:', {
        conversationLength: conversation?.length || 0,
        timestamp: new Date().toISOString()
      });

      if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
        return res.status(400).json({ error: 'Conversation data is required' });
      }

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.error('No OpenAI API key found');
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      // Generate a summary of the conversation
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an AI assistant tasked with summarizing a conversation between a pageant coach and a contestant. Create a concise but thorough summary that captures the key advice, strategies, and action items discussed. Format your summary with clear sections, bullet points for action items, and a professional tone. Include a title 'PAGEANT PLAN SUMMARY' at the top."
            },
            {
              role: "user",
              content: `Please summarize the following conversation about pageant preparation and provide a structured plan: ${JSON.stringify(conversation)}`
            }
          ],
          max_tokens: 800,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to generate summary' });
      }

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content || 'Summary could not be generated.';

      console.log('Summarize Conversation - Summary generated:', {
        summaryLength: summary.length,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        success: true, 
        summary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Summarize conversation error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Keep the email endpoint for backward compatibility
  app.post('/api/email-plan-summary', async (req, res) => {
    res.status(501).json({ error: 'Email functionality has been replaced with copy to clipboard' });
  });

  // ============================================================================
  // BOARD API ENDPOINTS - Pinterest-style image sharing
  // ============================================================================

  // Board image upload endpoint - uploads to public-board bucket
  const boardPhotoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
      }
    }
  });

  app.post("/api/board/upload", boardPhotoUpload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = await getAuthenticatedUser(req);
      
      // Create unique filename for public-board bucket
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `${user.id}/${timestamp}.${fileExtension}`;

      // Upload to public-board Supabase Storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-board')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Board upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image to board' });
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-board')
        .getPublicUrl(fileName);

      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Board photo upload error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else if ((error as any).code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get all board images with user info, like/save status
  app.get("/api/board/images", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      // Get all board images with user information and current user's like/save status
      const { data: images, error } = await supabase
        .from('board_images')
        .select(`
          *,
          board_likes!left(user_id),
          board_saves!left(user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get board images error:', error);
        return res.status(500).json({ error: 'Failed to fetch board images' });
      }

      // Get user info for each image from auth.users
      const userIds = Array.from(new Set(images?.map(img => img.user_id) || []));
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error('Get users error:', usersError);
        return res.status(500).json({ error: 'Failed to fetch user information' });
      }

      // Create user lookup map
      const userMap = new Map();
      users.users.forEach(u => {
        userMap.set(u.id, {
          id: u.id,
          username: u.user_metadata?.username || u.email?.split('@')[0] || 'Anonymous',
          fullName: u.user_metadata?.full_name || null,
          picture: u.user_metadata?.picture || u.user_metadata?.avatar_url || null
        });
      });

      // Format response with user info and like/save status
      const formattedImages = images?.map(img => ({
        id: img.id.toString(),
        url: img.url,
        title: img.title,
        description: img.description,
        category: img.category,
        tags: img.tags || [],
        width: img.width,
        height: img.height,
        likeCount: img.like_count || 0,
        saveCount: img.save_count || 0,
        createdAt: img.created_at,
        user: userMap.get(img.user_id) || {
          id: img.user_id,
          username: 'Anonymous',
          fullName: null,
          picture: null
        },
        isLiked: img.board_likes?.some((like: any) => like.user_id === user.id) || false,
        isSaved: img.board_saves?.some((save: any) => save.user_id === user.id) || false
      })) || [];

      res.json({ images: formattedImages });
    } catch (error) {
      console.error('Get board images error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create new board image entry
  app.post("/api/board/images", requireUsageLimit('board_save'), trackUsageAfterAction(), async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { url, title, description, category, tags, width, height } = req.body;

      if (!url || !category) {
        return res.status(400).json({ error: 'URL and category are required' });
      }

      // Validate category
      const validCategories = ['dress', 'shoes', 'nails', 'inspiration', 'personal'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      const { data: newImage, error } = await supabase
        .from('board_images')
        .insert({
          user_id: user.id,
          url,
          title: title || null,
          description: description || null,
          category,
          tags: tags || [],
          width: width || null,
          height: height || null
        })
        .select()
        .single();

      if (error) {
        console.error('Create board image error:', error);
        return res.status(500).json({ error: 'Failed to create board image' });
      }

      res.status(201).json(newImage);
    } catch (error) {
      console.error('Create board image error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Delete board image (owner only)
  app.delete("/api/board/images/:id", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { id } = req.params;

      // Check if user owns the image
      const { data: image, error: fetchError } = await supabase
        .from('board_images')
        .select('user_id, url')
        .eq('id', id)
        .single();

      if (fetchError || !image) {
        return res.status(404).json({ error: 'Image not found' });
      }

      if (image.user_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this image' });
      }

      // Delete from database (cascades to likes/saves)
      const { error: deleteError } = await supabase
        .from('board_images')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete board image error:', deleteError);
        return res.status(500).json({ error: 'Failed to delete board image' });
      }

      // Extract filename and delete from storage
      try {
        const urlParts = image.url.split('/');
        const fileName = urlParts.slice(-2).join('/'); // Gets "userId/timestamp.ext"
        
        await supabase.storage
          .from('public-board')
          .remove([fileName]);
      } catch (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue even if storage delete fails
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Delete board image error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Like an image
  app.post("/api/board/images/:id/like", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { id } = req.params;

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('board_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('image_id', id)
        .single();

      if (existingLike) {
        return res.status(400).json({ error: 'Already liked this image' });
      }

      // Add like
      const { error: likeError } = await supabase
        .from('board_likes')
        .insert({
          user_id: user.id,
          image_id: parseInt(id)
        });

      if (likeError) {
        console.error('Like image error:', likeError);
        return res.status(500).json({ error: 'Failed to like image' });
      }

      // Update like count
      const { data: currentImage } = await supabase
        .from('board_images')
        .select('like_count')
        .eq('id', id)
        .single();
      
      const { error: updateError } = await supabase
        .from('board_images')
        .update({ 
          like_count: (currentImage?.like_count || 0) + 1
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update like count error:', updateError);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Like image error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Unlike an image
  app.delete("/api/board/images/:id/like", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { id } = req.params;

      // Remove like
      const { error: unlikeError } = await supabase
        .from('board_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('image_id', id);

      if (unlikeError) {
        console.error('Unlike image error:', unlikeError);
        return res.status(500).json({ error: 'Failed to unlike image' });
      }

      // Update like count (don't go below 0)
      const { data: currentImage } = await supabase
        .from('board_images')
        .select('like_count')
        .eq('id', id)
        .single();
      
      const { error: updateError } = await supabase
        .from('board_images')
        .update({ 
          like_count: Math.max((currentImage?.like_count || 0) - 1, 0)
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update like count error:', updateError);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Unlike image error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Save an image to personal collection
  // Enforce limit and track when saving to personal collection too
  app.post("/api/board/images/:id/save", requireUsageLimit('board_save'), trackUsageAfterAction(), async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { id } = req.params;

      // Check if already saved
      const { data: existingSave } = await supabase
        .from('board_saves')
        .select('id')
        .eq('user_id', user.id)
        .eq('image_id', id)
        .single();

      if (existingSave) {
        return res.status(400).json({ error: 'Already saved this image' });
      }

      // Add save
      const { error: saveError } = await supabase
        .from('board_saves')
        .insert({
          user_id: user.id,
          image_id: parseInt(id)
        });

      if (saveError) {
        console.error('Save image error:', saveError);
        return res.status(500).json({ error: 'Failed to save image' });
      }

      // Update save count
      const { data: currentImage } = await supabase
        .from('board_images')
        .select('save_count')
        .eq('id', id)
        .single();
      
      const { error: updateError } = await supabase
        .from('board_images')
        .update({ 
          save_count: (currentImage?.save_count || 0) + 1
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update save count error:', updateError);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Save image error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Remove image from personal collection
  app.delete("/api/board/images/:id/save", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { id } = req.params;

      // Remove save
      const { error: unsaveError } = await supabase
        .from('board_saves')
        .delete()
        .eq('user_id', user.id)
        .eq('image_id', id);

      if (unsaveError) {
        console.error('Unsave image error:', unsaveError);
        return res.status(500).json({ error: 'Failed to unsave image' });
      }

      // Update save count (don't go below 0)
      const { data: currentImage } = await supabase
        .from('board_images')
        .select('save_count')
        .eq('id', id)
        .single();
      
      const { error: updateError } = await supabase
        .from('board_images')
        .update({ 
          save_count: Math.max((currentImage?.save_count || 0) - 1, 0)
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update save count error:', updateError);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Unsave image error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // ============================================================================
  // END BOARD API ENDPOINTS
  // ============================================================================

  app.delete("/api/delete-account", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required for account deletion' });
      }

      // Verify password by attempting to sign in with current credentials
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password
      });

      if (authError) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Delete user's gallery images from storage
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('gallery_images')
        .eq('user_id', user.id)
        .single();

      if (profile?.gallery_images && profile.gallery_images.length > 0) {
        // Extract file paths from URLs and delete from storage
        const filePaths = profile.gallery_images.map((url: string) => {
          const urlParts = url.split('/');
          return urlParts.slice(-2).join('/'); // Gets "userId/timestamp.ext"
        });

        await supabase.storage
          .from('user-photos')
          .remove(filePaths);
      }

      // Delete user profile data
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      // Delete calendar events
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id);

      // Delete user account from auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error('Failed to delete user account:', deleteError);
        return res.status(500).json({ error: 'Failed to delete account' });
      }

      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Health check endpoints
  app.post('/api/health', (req, res) => {
    res.json({
      status: 'success',
      message: 'Server is running properly',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.post('/api/health/database', async (req, res) => {
    try {
      // Test database connection by attempting a simple query
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      res.json({
        status: 'success',
        message: 'Database connection successful'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.post('/api/health/openai', async (req, res) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          status: 'error',
          message: 'OpenAI API key not configured'
        });
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        res.json({
          status: 'success',
          message: 'OpenAI API connection successful'
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: `OpenAI API error: ${response.status}`
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `OpenAI API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.post('/api/health/user-profile', async (req, res) => {
    try {
      // Test user profile endpoint functionality
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .limit(1);
        
      res.json({
        status: 'success',
        message: 'User profile system operational'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `User profile error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.post('/api/health/photo-upload', (req, res) => {
    try {
      // Test Supabase storage access
      const buckets = supabase.storage.listBuckets();
      res.json({
        status: 'success',
        message: 'Photo upload system ready'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Photo upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.post('/api/health/ocean-chat', async (req, res) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          status: 'error',
          message: 'OpenAI API key not configured for chat'
        });
      }

      // Test a simple chat completion
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'health check' }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        res.json({
          status: 'success',
          message: 'Ocean Chat AI system operational'
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: `Ocean Chat API error: ${response.status}`
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Ocean Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.post('/api/health/calendar', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('id')
        .limit(1);
        
      res.json({
        status: 'success',
        message: 'Calendar system operational'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Calendar error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.post('/api/health/filesystem', (req, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Test basic file system operations
      const testDir = './uploads/health-test';
      const testFile = path.join(testDir, 'test.txt');
      
      // Create test directory if it doesn't exist
      if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads', { recursive: true });
      }
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      // Write test file
      fs.writeFileSync(testFile, 'health check test');
      
      // Read test file
      const content = fs.readFileSync(testFile, 'utf8');
      
      // Clean up
      fs.unlinkSync(testFile);
      fs.rmdirSync(testDir);
      
      res.json({
        status: 'success',
        message: 'File system operational'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `File system error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // ==========================================
  // SUBSCRIPTION & USAGE TRACKING ROUTES
  // ==========================================
  
  const { 
    stripe, 
    STRIPE_PLANS, 
    createCustomer, 
    createCheckoutSession, 
    createBillingPortalSession 
  } = await import('./lib/stripe.js');

  // Get user's subscription status and usage
  app.get("/api/subscription/status", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);

      // Check for an active subscription in the 'subscriptions' table
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['premium', 'active']) // Standard active statuses
        .single();

      if (subError && subError.code !== 'PGRST116') { // Ignore "not found" errors
        console.error('Error fetching subscription:', subError.message);
        return res.status(500).json({ error: 'Failed to fetch subscription status.' });
      }

      if (subscription) {
        return res.json({
          status: subscription.status,
          planType: subscription.plan_type,
          isPremium: true,
        });
      }

      // If no subscription, check for a premium code usage
      const { data: codeUsage, error: codeError } = await supabase
        .from('premium_code_usage')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (codeError) {
        // Log the error but don't block the user
        console.error('Error checking premium code usage:', codeError.message);
      }

      if (codeUsage && codeUsage.length > 0) {
        return res.json({
          status: 'premium_code',
          planType: 'code',
          isPremium: true,
        });
      }

      // Default to basic if no active subscription or code is found
      res.json({
        status: 'basic',
        planType: 'free',
        isPremium: false,
      });

    } catch (error) {
      console.error("Error in /api/subscription/status:", error);
      if (error instanceof Error && error.message.includes("token")) {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: "An internal server error occurred." });
    }
  });

  // Get current usage counters and limits for the authenticated user
  app.get('/api/usage', async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      const usage = await getUserUsage(user.id);
      res.json({
        usage,
        limits: USAGE_LIMITS,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('token')) {
        return res.status(401).json({ error: error.message });
      }
      console.error('Error fetching usage:', error);
      res.status(500).json({ error: 'Failed to fetch usage' });
    }
  });

  // Increment routine minutes explicitly (used when a session ends)
  app.post('/api/usage/routine-minutes', async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { minutes } = req.body as { minutes?: number };
      const amount = Math.max(0, Math.floor(minutes || 0));
      if (!amount) return res.status(400).json({ error: 'Minutes must be a positive integer' });

      // Limit is expressed in 15s quarters; convert minutes->quarters in checker
      const status = await canUserPerformAction(user.id, 'walk_routine', amount);
      if (!status.allowed) return res.status(403).json({ error: 'Usage limit exceeded.' });

      // Update counters
      const { data } = await supabase
        .from('user_usage')
        .select('routine_minutes_this_month, routine_minutes_month_start')
        .eq('user_id', user.id)
        .single();

      const now = new Date();
      let fields: any = {};
      if (!data || !data.routine_minutes_month_start || new Date(data.routine_minutes_month_start).getMonth() !== now.getMonth() || new Date(data.routine_minutes_month_start).getFullYear() !== now.getFullYear()) {
        fields = { routine_minutes_this_month: amount, routine_minutes_month_start: now };
      } else {
        fields = { routine_minutes_this_month: (data.routine_minutes_this_month || 0) + amount };
      }
      await supabase.from('user_usage').upsert({ user_id: user.id, ...fields }, { onConflict: 'user_id' });

      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message.includes('token')) {
        return res.status(401).json({ error: error.message });
      }
      console.error('Error adding routine minutes:', error);
      res.status(500).json({ error: 'Failed to add routine minutes' });
    }
  });

  // Check if user can perform specific action
  app.post("/api/subscription/check-usage", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);

      let { action, amount = 1 } = req.body as { action?: string; amount?: number };
      // Normalize legacy names
      if (action === 'routine_minute') action = 'walk_routine';
      if (!action || !['board_save', 'walk_routine', 'talent_routine', 'interview_question', 'dress_tryon'].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const usageStatus = await canUserPerformAction(user.id, action as any, amount);
      res.json(usageStatus);
      
    } catch (error) {
      console.error("Error checking usage:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to check usage" });
      }
    }
  });

  // Validate premium code
  app.post("/api/subscription/validate-code", async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "Code is required" });
      }

      const result = await validatePremiumCode(code.trim().toUpperCase());
      res.json(result);
    } catch (error) {
      console.error("Error validating code:", error);
      res.status(500).json({ error: "Failed to validate code" });
    }
  });

  // Apply premium code
  app.post("/api/subscription/apply-code", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);

      const { code } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "Code is required" });
      }

      // Simple code validation - check if code exists and is active
      const { data: codeData, error: codeError } = await supabase
        .from('premium_codes')
        .select('id, code, is_active, usage_limit, used_count, expires_at')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (codeError || !codeData) {
        return res.status(400).json({ success: false, error: "Invalid or expired code" });
      }

      // Check if code has usage limit
      if (codeData.usage_limit && codeData.used_count >= codeData.usage_limit) {
        return res.status(400).json({ success: false, error: "Code usage limit exceeded" });
      }

      // Check if code is expired
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        return res.status(400).json({ success: false, error: "Code has expired" });
      }

      // Upsert a subscription row with premium_code and record usage
      const nowIso = new Date().toISOString();
      await supabase
        .from('subscriptions')
        .upsert([{
          user_id: user.id,
          status: 'premium_code',
          plan_type: 'code',
          premium_code_id: codeData.id,
          updated_at: nowIso,
        }], { onConflict: 'user_id' });

      // Record the code usage in premium_code_usage if not already present
      const { data: existingUsage } = await supabase
        .from('premium_code_usage')
        .select('id')
        .eq('user_id', user.id)
        .eq('code_id', codeData.id)
        .limit(1);
      if (!existingUsage || existingUsage.length === 0) {
        await supabase.from('premium_code_usage').insert({ user_id: user.id, code_id: codeData.id });
      }

      // Increment code usage counter
      await supabase
        .from('premium_codes')
        .update({ used_count: codeData.used_count + 1 })
        .eq('id', codeData.id);

      res.json({ success: true, message: "Premium access activated!" });
    } catch (error) {
      console.error("Error applying premium code:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: "Failed to apply code" });
      }
    }
  });

  // Create Stripe checkout session
  app.post("/api/subscription/create-checkout", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      const { planType } = req.body; // 'monthly' or 'yearly'
      if (!planType || !['monthly', 'yearly'].includes(planType)) {
        return res.status(400).json({ error: "Invalid plan type" });
      }

      const priceId = planType === 'monthly' ? STRIPE_PLANS.MONTHLY : STRIPE_PLANS.YEARLY;

      // Get user data from our database
      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('email', user.email)
        .single();

      // Get or create Stripe customer
      let stripeCustomerId = userData?.stripe_customer_id;
      if (!stripeCustomerId) {
        const customer = await createCustomer(user.email!, (user.user_metadata as any)?.full_name || '');
        stripeCustomerId = customer.id;
        
        // Update user record with Stripe customer ID
        await supabase
          .from('users')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('email', user.email);
      }

      // Create checkout session
      const origin = (req.headers.origin as string) || 'http://localhost:5001';
      const session = await createCheckoutSession(
        stripeCustomerId,
        priceId,
        `${origin}/app?subscription=success`,
        `${origin}/pricing?subscription=cancelled`
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Create billing portal session
  app.post("/api/subscription/billing-portal", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      // Get user data from our database
      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('email', user.email)
        .single();

      const stripeCustomerId = userData?.stripe_customer_id;
      if (!stripeCustomerId) {
        return res.status(401).json({ error: "No subscription found" });
      }

      const session = await createBillingPortalSession(
        stripeCustomerId,
        `${req.headers.origin}/app`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating billing portal session:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create billing portal session" });
      }
    }
  });

  // Stripe webhook endpoint
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          
          // Find user by Stripe customer ID
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', subscription.customer)
            .single();

          if (userData) {
            // Update user's payment status when subscription is active
            if (subscription.status === 'active') {
              await supabase
                .from('users')
                .update({ has_paid: true })
                .eq('id', userData.id);

              // Track referral conversion
              const { data: authUser } = await supabase.auth.admin.getUserById(userData.id);
              if (authUser?.user) {
                // Check if user has an attributed referral
                const { data: referralData } = await supabase
                  .from('referral_conversions')
                  .select('*')
                  .eq('user_id', userData.id)
                  .is('converted_at', null)
                  .single();

                if (referralData) {
                  // Calculate commission (assuming 20% of first month)
                  const planType = subscription.items.data[0]?.price.id === STRIPE_PLANS.YEARLY ? 'yearly' : 'monthly';
                  const monthlyAmount = planType === 'yearly' ? 10 : 15; // $10/mo yearly, $15/mo monthly
                  const commissionRate = 0.20; // 20% commission
                  const commissionEarned = monthlyAmount * commissionRate;

                  // Update referral conversion with payment details
                  await supabase
                    .from('referral_conversions')
                    .update({
                      converted_at: new Date().toISOString(),
                      conversion_type: 'stripe_subscription',
                      stripe_subscription_id: subscription.id,
                      plan_type: planType,
                      subscription_amount: monthlyAmount.toString(),
                      commission_earned: commissionEarned.toString(),
                    })
                    .eq('id', referralData.id);
                }
              }
            }

            // Update subscription status
            await supabase
              .from('subscriptions')
              .upsert([{
                user_id: userData.id,
                status: subscription.status === 'active' ? 'premium' : 'basic',
                plan_type: subscription.items.data[0]?.price.id === STRIPE_PLANS.YEARLY ? 'yearly' : 'monthly',
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              }]);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          
          // Find user by Stripe customer ID
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', subscription.customer)
            .single();

          if (userData) {
            // Update user's payment status
            await supabase
              .from('users')
              .update({ has_paid: false })
              .eq('id', userData.id);

            // Update subscription to basic
            await supabase
              .from('subscriptions')
              .update({
                status: 'basic',
                plan_type: 'basic',
                stripe_subscription_id: null,
                current_period_end: null,
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userData.id);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  // Onboarding completion routes
  app.get("/api/onboarding/status", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      
      // Check if user profile exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_data')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error checking user profile:", profileError);
        return res.status(500).json({ error: "Failed to check onboarding status" });
      }

      // If profile doesn't exist, create it
      if (!profileData) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            onboarding_completed: false,
            onboarding_data: null
          })
          .select('onboarding_completed, onboarding_data')
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          return res.status(500).json({ error: "Failed to create profile" });
        }

        return res.json({ 
          completed: false,
          data: newProfile
        });
      }

      // User has completed onboarding if they've filled out the form
      const completed = profileData.onboarding_completed || false;

      res.json({ 
        completed: completed,
        data: profileData
      });
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to check onboarding status" });
      }
    }
  });

  app.post("/api/onboarding/complete", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);

      const { answers } = req.body;
      if (!answers || typeof answers !== 'object') {
        return res.status(400).json({ error: "Onboarding answers are required" });
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          onboarding_data: answers
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error completing onboarding:", error);
        return res.status(500).json({ error: "Failed to save onboarding data" });
      }

      res.json({ success: true, message: "Onboarding completed successfully" });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      if (error instanceof Error && error.message.includes("token")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to complete onboarding" });
      }
    }
  });

     const server = createServer(app);
   return server;
}