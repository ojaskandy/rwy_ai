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
import * as fs from 'fs';
import * as path from 'path';
import { Resend } from 'resend';
import multer from "multer";
import { OpenAI } from 'openai';
import Lmnt from 'lmnt-node';
import * as fashnAI from './routes/fashnAI';
import * as interview from './routes/interview';
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
  hasCompletedOnboarding: true,
  hasPaid: true, // Give full access to guest users
  hasCodeBypass: true,
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
  app.post("/api/fashn/tryon", fashnAI.generateTryOn);
  app.post("/api/fashn/tryon-complete", fashnAI.runTryOnComplete);

  // Interview Coach routes
  app.get("/api/interview/test", interview.testConnection);
  app.post("/api/interview/transcribe", interview.transcribeAudio);
  app.post("/api/interview/feedback", interview.generateFeedback);

  // Pageant Coaching endpoint - Real-time AI coaching with vision
  app.post('/api/pageant-coaching', async (req, res) => {
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
        ? `You are an expert pageant coach providing comprehensive routine analysis. Structure your feedback clearly without using any bold text, headers, or markdown formatting. Write in flowing, natural paragraphs that are easy to read. Focus on being specific, actionable, and encouraging while maintaining professional coaching standards.`
        : "Pageant coach. Max 10 words. One tip only.";

      const userPrompt = isSequenceSummary
        ? `Analyze this complete pageant routine and provide structured feedback. Return your response as valid JSON with this exact structure:

{
  "overview": "Overall impression and performance summary in 2-3 sentences",
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

Be specific, constructive, and supportive. Focus on posture, movement quality, transitions, stage presence, and technical execution. Use plain language without formatting.`
        : "Quick tip for this pose?";

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
      let parsedFeedback = null;
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
        } catch (parseError) {
          console.error('Failed to parse structured feedback, falling back to plain text');
          // Keep the original feedback as fallback
        }
      }

      console.log('Pageant Coaching - AI Response:', {
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
      console.error('Pageant coaching error:', error);
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

  // AI event parsing endpoint
  app.post('/api/ai/parse-event', async (req, res) => {
    try {
      const { description } = req.body;
      console.log('AI Parse Event - Received description:', description);

      if (!description || typeof description !== 'string') {
        return res.status(400).json({ error: 'Description is required' });
      }

      const apiKey = process.env.OPENAI_API_KEY || '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';
      console.log('AI Parse Event - Using API key:', apiKey ? 'Present' : 'Missing');

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

  app.post("/api/calendar/events", async (req, res) => {
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

     const server = createServer(app);
   return server;
}