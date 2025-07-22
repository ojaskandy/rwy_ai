import type { Express } from "express";
import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

     const server = createServer(app);
   return server;
}