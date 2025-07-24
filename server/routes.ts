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
        ? "Expert pageant coach. Give detailed analysis and improvement tips."
        : "Pageant coach. Max 10 words. One tip only.";

      const userPrompt = isSequenceSummary
        ? "Analyze this complete routine. Give comprehensive feedback."
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
          max_tokens: isSequenceSummary ? 150 : 20,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to get AI feedback' });
      }

      const data = await response.json();
      const feedback = data.choices?.[0]?.message?.content || 'Great work! Keep practicing your form and confidence.';

      console.log('Pageant Coaching - AI Response:', {
        feedback: feedback.substring(0, 100) + '...',
        tokens: data.usage?.total_tokens || 0
      });

      res.json({ 
        success: true, 
        feedback,
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
          content: `You are an expert AI pageant coach. Give CONCISE, actionable advice in this format:

🎯 **QUICK TIP:**
[1-2 sentence direct answer]

📝 **ACTION STEPS:**
• Step 1: [specific action]
• Step 2: [specific action] 
• Step 3: [specific action]

✨ **PRO SECRET:**
[One insider tip]

👑 [Encouraging closing line]

RULES:
- Keep responses under 150 words
- Use bullet points and line breaks for clarity
- Be specific and actionable
- Include ONE relevant emoji per section
- No long paragraphs - use short, punchy sentences
- Focus on ONE main topic per response`
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

      // Upsert user profile with gallery images
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          gallery_images: photos,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to save photos' });
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
    limits: { fileSize: 5 * 1024 * 1024 },
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
        res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

     const server = createServer(app);
   return server;
}