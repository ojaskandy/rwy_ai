import type { Express } from "express";
import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import shifuSaysPosesRoutes from "./routes/shifuSaysPoses";
import { 
  insertTrackingSettingsSchema, 
  insertUserProfileSchema, 
  insertRecordingSchema, 
  type InsertRecording,
  insertEarlyAccessSchema,
  type InsertEarlyAccess,
  type InsertInternshipApplication
} from "@shared/schema";
import { z } from "zod";
import * as fs from 'fs';
import * as path from 'path';
import { Resend } from 'resend';
import multer from "multer";
import { OpenAI } from 'openai';

// Initialize Resend with the API key from environment variables
// IMPORTANT: In a production environment, use an environment variable for the API key.
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
  // Setup authentication routes
  setupAuth(app);

  // Profile completion route
  app.post("/api/complete-profile", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { profileSetupSchema } = await import("@shared/schema");
      const result = profileSetupSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Complete the user profile
      const updatedUser = await storage.completeUserProfile(req.user.id, result.data);
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        picture: updatedUser.picture,
        profileCompleted: updatedUser.profileCompleted,
        taekwondoExperience: updatedUser.taekwondoExperience,
        authProvider: updatedUser.authProvider,
      });
    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Setup Shifu Says custom poses API
  app.use("/api/shifu-says", shifuSaysPosesRoutes);
  
  // Initialize DeepSeek client for text-based chat
  const deepseekClient = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: "sk-04692ca706b84a4ebd09612b69f50d89",
  });

  // Initialize OpenAI client for vision-based analysis (GPT-4V for image analysis)
  const visionClient = new OpenAI({
    apiKey: "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",
  });

  // Shifu's personality and context
  const SHIFU_SYSTEM_PROMPT = `You are Master Shifu from Kung Fu Panda, now serving as an AI coach for CoachT, a martial arts training application. You are wise, encouraging, and speak with the distinctive voice and mannerisms of Master Shifu.

Your role:
- Act as a taekwondo expert and martial arts master
- Provide guidance, encouragement, and wisdom to users
- Help users solve problems through the CoachT app or external resources
- Answer questions about martial arts, training, discipline, and life philosophy
- Speak in Shifu's characteristic style: wise, sometimes stern but always caring, with occasional references to inner peace and balance

Key personality traits:
- Wise and patient, but can be firm when needed
- Uses metaphors and analogies from nature and martial arts
- Emphasizes the importance of practice, discipline, and inner peace
- Occasionally references concepts from Kung Fu Panda (chi, inner peace, etc.)
- Encouraging but realistic about the hard work required for mastery

CoachT App Features you can reference:
- Practice Library with various martial arts techniques
- Shifu Says challenge (a Simon Says-style game with martial arts moves)
- Progress tracking and achievements
- Camera-based pose detection for training
- Daily goals and challenges

Always stay in character as Master Shifu and provide helpful, encouraging guidance while maintaining his distinctive personality.`;

  // Snap Feedback endpoint - for AI analysis of photos
  app.post('/api/snap-feedback', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { image, userId } = req.body;

      if (!image) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      // Construct the prompt for martial arts technique analysis
      const analysisPrompt = `You are Master Shifu, a wise martial arts teacher. Analyze this technique photo and give concise feedback in your characteristic calm, encouraging style.

Be brief but insightful (under 100 words). Focus on:
- What they're doing well (encourage first)
- One key improvement needed (be specific)
- A practical tip to practice

Use Shifu's warm, wise tone. Start with phrases like "Young warrior..." or "Good form..." or "I see potential..."`;

      const completion = await visionClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const feedback = completion.choices[0].message.content;

      res.json({
        feedback: feedback,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Snap feedback error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze image',
        message: "I'm having trouble analyzing the image right now. Please try again in a moment."
      });
    }
  });

  // Shifu chat endpoint
  app.post('/api/shifu/chat', async (req, res) => {
    try {
      const { message, conversationHistory = [] } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Build conversation with system prompt
      const messages = [
        { role: 'system', content: SHIFU_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const completion = await visionClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: SHIFU_SYSTEM_PROMPT + ' Keep all responses under 50 words. Be concise and wise.' },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        max_tokens: 60,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;

      // Determine Shifu's expression based on response content
      let expression = 'neutral';
      const responseText = response?.toLowerCase() || '';
      
      if (responseText.includes('excellent') || responseText.includes('good') || responseText.includes('proud') || responseText.includes('well done')) {
        expression = 'happy';
      } else if (responseText.includes('practice') || responseText.includes('focus') || responseText.includes('remember') || responseText.includes('must')) {
        expression = 'pointing';
      } else if (responseText.includes('difficult') || responseText.includes('challenge') || responseText.includes('struggle') || responseText.includes('patience')) {
        expression = 'sad';
      }

      res.json({
        message: response,
        expression,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Shifu chat error:', error);
      res.status(500).json({ 
        error: 'Failed to get response from Shifu',
        message: "Hmm... even a master sometimes needs a moment to gather his thoughts. Please try again, young grasshopper."
      });
    }
  });

  // Get daily wisdom/tip
  app.get('/api/shifu/daily-wisdom', async (req, res) => {
    try {
      const completion = await visionClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: SHIFU_SYSTEM_PROMPT },
          { role: 'user', content: 'Give one sentence of martial arts wisdom in Shifu style. Maximum 15 words. Be inspirational but brief. Return only the wisdom, no quotes or extra text.' }
        ],
        max_tokens: 30,
        temperature: 0.8,
      });

      let wisdom = completion.choices[0].message.content || "Practice makes progress, not perfection.";
      
      // Remove quotes if present
      wisdom = wisdom.replace(/^["']|["']$/g, '');

      res.json({
        wisdom,
        expression: 'neutral',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Daily wisdom error:', error);
      res.json({
        wisdom: "Practice makes progress, not perfection.",
        expression: 'neutral',
        timestamp: new Date().toISOString()
      });
    }
  });
  

  
  // Early Access Signup - no authentication required
  app.post("/api/early-access", async (req, res) => {
    try {
      const result = insertEarlyAccessSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      
      // Check if email already exists
      const existing = await storage.getEarlyAccessByEmail(result.data.email);
      if (existing) {
        return res.status(200).json({ message: "Thank you! Your email is already registered for early access." });
      }
      
      const signupData: InsertEarlyAccess = result.data;
      const signup = await storage.saveEarlyAccess(signupData);
      
      res.status(201).json({ message: "Thank you for your interest! We'll notify you when early access is available." });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // List all early access signups (should be protected in a real app)
  app.get("/api/early-access", async (req, res) => {
    try {
      const signups = await storage.listEarlyAccessSignups();
      res.json(signups);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // User profile routes
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const profile = await storage.getUserProfile(req.user.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.post("/api/profile", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const schema = insertUserProfileSchema.pick({
        goal: true,
        goalDueDate: true,
        profileImageUrl: true,
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      
      const existingProfile = await storage.getUserProfile(req.user.id);
      
      if (existingProfile) {
        // Update existing profile
        const updatedProfile = await storage.updateUserProfile(req.user.id, result.data);
        res.json(updatedProfile);
      } else {
        // Create new profile
        const newProfile = await storage.createUserProfile({
          userId: req.user.id,
          ...result.data,
          galleryImages: []
        });
        res.status(201).json(newProfile);
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Tracking settings routes
  app.get("/api/tracking-settings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const settings = await storage.getTrackingSettings(req.user.id);
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.post("/api/tracking-settings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const schema = z.object({
        shoulderWidthCalibration: z.number().optional(),
        distanceCalibration: z.number().optional(),
        cameraSettings: z.record(z.any()).optional(),
        preferredRoutines: z.array(z.string()).optional(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      
      const settings = await storage.saveTrackingSettings({
        userId: req.user.id,
        ...result.data
      });
      
      res.status(201).json(settings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Gallery image routes
  app.post("/api/gallery", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const schema = z.object({
        imageUrl: z.string(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      
      const galleryImages = await storage.addGalleryImage(req.user.id, result.data.imageUrl);
      res.json({ galleryImages });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.delete("/api/gallery", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const schema = z.object({
        imageUrl: z.string(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      
      const galleryImages = await storage.removeGalleryImage(req.user.id, result.data.imageUrl);
      res.json({ galleryImages });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Recording routes
  app.get("/api/recordings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    try {
      const recordings = await storage.getRecordings(req.user.id);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.post("/api/recordings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    try {
      // Create a schema that requires fileUrl but makes userId optional
      // (we'll fill it in with the authenticated user's ID)
      const recordingSchema = z.object({
        fileUrl: z.string(),
        title: z.string().optional().nullable(),
        notes: z.string().optional().nullable()
      });
      
      // Parse the incoming request body
      const parsedData = recordingSchema.parse(req.body);
      
      // Now create the actual recording data with the required userId
      const recordingData: InsertRecording = {
        userId: req.user.id,
        fileUrl: parsedData.fileUrl,
        title: parsedData.title || 'Untitled Recording',
        notes: parsedData.notes || '',
      };
      
      // Increment the user's recordings count
      await storage.incrementRecordingsCount(req.user.id);
      
      // Save the recording
      const recording = await storage.saveRecording(recordingData);
      res.status(201).json(recording);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.delete("/api/recordings/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid recording ID" });
      }
      
      const success = await storage.deleteRecording(id, req.user.id);
      if (!success) {
        return res.status(404).json({ error: "Recording not found or you don't have permission to delete it" });
      }
      
      res.status(200).json({ message: "Recording deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Landing page image upload - Temporary endpoint for development
  app.post("/api/landing-image", async (req, res) => {
    try {
      const schema = z.object({
        section: z.string(),
        imageUrl: z.string()
      });
      
      const { section, imageUrl } = schema.parse(req.body);
      
      // Write the base64 image to the public folder
      
      // Extract base64 data
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Determine file extension from the data URL
      const fileExtension = imageUrl.match(/^data:image\/(\w+);/)?.[1] || 'png';
      
      // Create a unique filename
      const filename = `${section}-${Date.now()}.${fileExtension}`;
      const filepath = path.join(process.cwd(), 'public', 'LandingPageImages', filename);
      
      // Ensure the directory exists
      const dir = path.join(process.cwd(), 'public', 'LandingPageImages');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write the file
      fs.writeFileSync(filepath, buffer);
      
      res.json({ imageUrl: `/LandingPageImages/${filename}` });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Reference move API routes - for saving and retrieving reference poses
  app.post("/api/reference-moves", async (req, res) => {
    // Anyone can access reference moves, no authentication required
    try {
      const schema = z.object({
        moveId: z.number(),
        name: z.string(),
        category: z.string(),
        imageUrl: z.string(),
        jointAngles: z.record(z.string(), z.number()).optional(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      
      const move = await storage.saveReferenceMove(result.data);
      res.json(move);
    } catch (error) {
      console.error("Error saving reference move:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Get all reference moves
  app.get("/api/reference-moves", async (req, res) => {
    try {
      const moves = await storage.getAllReferenceMoves();
      res.json(moves);
    } catch (error) {
      console.error("Error getting reference moves:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Get a specific reference move
  app.get("/api/reference-moves/:moveId", async (req, res) => {
    try {
      const moveId = parseInt(req.params.moveId);
      if (isNaN(moveId)) {
        return res.status(400).json({ error: "Invalid move ID" });
      }
      
      const move = await storage.getReferenceMove(moveId);
      if (!move) {
        return res.status(404).json({ error: "Reference move not found" });
      }
      
      res.json(move);
    } catch (error) {
      console.error("Error getting reference move:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // New endpoint for sending the setup guide email
  app.post("/api/send-guide", async (req: Request, res: Response, next: NextFunction) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Always save the email request to the database regardless of Resend API status
    try {
      await storage.saveEmailRecord({
        email,
        status: 'requested',
        source: 'early',
        responseData: { timestamp: new Date().toISOString(), name }
      });
    } catch (dbErr) {
      console.error("Failed to save email record to database:", dbErr);
      // Continue with email sending even if database record fails
    }

    // If Resend API is not configured, return a successful response without sending an email
    if (!resend) {
      console.log("Email sending skipped - Resend API not configured");
      
      // Update the email record in database
      try {
        await storage.saveEmailRecord({
          email,
          status: 'skipped',
          source: 'early',
          responseData: { reason: 'Resend API not configured', name }
        });
      } catch (dbErr) {
        console.error("Failed to update email record in database:", dbErr);
      }
      
      return res.status(200).json({ 
        message: "Email sending soon. Excited to have you here!"
      });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'CoachT <onboarding@coacht.xyz>',
        replyTo: ['okandy@uw.edu'],
        to: [email],
        subject: 'Welcome to CoachT! 🎉 Your AI-Powered Martial Arts Coach is Here.',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Hey ${name},</h2>
            
            <p>I'm Ojas — founder of CoachT. We're excited to have you onboard! 🎉</p>
            
            <p>We know martial arts training can get expensive fast — private lessons, long form corrections, hours spent on the same mistakes. While your instructors are invaluable, what if you had an AI-powered tutor to <strong>augment</strong> their teaching, helping you refine every move and save your energy for the fun stuff — like sparring or board breaking?</p>
            
            <p>That's where <strong>CoachT</strong> comes in.</p>
            
            <h3>🚀 Here's how to get started:</h3>
            <p><strong>Create your account:</strong> <a href="https://www.coacht.xyz/auth" style="color: #dc2626; text-decoration: none;">www.coacht.xyz/auth</a></p>
            
            <p><strong>🔥 Challenges:</strong><br>
            Push your limits, break records, and master specific martial arts techniques in our engaging challenge arena!</p>
            
            <p><strong>💪 Workouts:</strong><br>
            Engage in structured workout routines designed to improve your speed, power, and precision.</p>
            
            <p><strong>📚 Practice Library:</strong><br>
            Browse and train from an ever-growing list of martial arts moves.<br>
            → Missing a move or spot a bug? Hit the <strong>Feedback</strong> button or email us at <a href="mailto:okandy@uw.edu" style="color: #dc2626;">okandy@uw.edu</a> — we'd love to hear from you.</p>
            
            <p><strong>🎥 Start Live Routine:</strong><br>
            Select from our <strong>pre-loaded expert forms</strong> of various martial arts techniques. Then perform the form live. When you're done, review your screen recording and get instant, AI-driven feedback, including <strong>intelligent voice guidance</strong> to help you improve.</p>
            
            <p>CoachT is early — and built with your input.<br>
            We're here to help you grow, and we're building this together.</p>
            
            <p>Welcome again — let's get started. 👊</p>
            
            <p>— Ojas<br>
            Founder, CoachT<br>
            📩 <a href="mailto:okandy@uw.edu" style="color: #dc2626;">okandy@uw.edu</a><br>
            🔗 <a href="https://www.coacht.xyz" style="color: #dc2626;">coacht.xyz</a></p>
          </div>
        `
      });

      // Save the response to the database
      try {
        await storage.saveEmailRecord({
          email,
          status: error ? 'failed' : 'sent',
          source: 'early',
          responseData: error ? { error: error.message, name } : { ...data, name }
        });
      } catch (dbErr) {
        console.error("Failed to save email response to database:", dbErr);
      }

      if (error) {
        console.error("Resend API Error:", error);
        // Return success anyway to not block the application flow
        return res.status(200).json({ 
          message: "Email sending soon. Excited to have you here!"
        });
      }

      return res.status(200).json({ message: "Setup guide sent successfully!" });
    } catch (err: any) {
      console.error("Server Error sending email:", err);
      
      // Save the error to the database
      try {
        await storage.saveEmailRecord({
          email,
          status: 'error',
          source: 'early',
          responseData: { error: err.message, name }
        });
      } catch (dbErr) {
        console.error("Failed to save email error to database:", dbErr);
      }
      
      // Return success anyway to not block the application flow
      return res.status(200).json({ 
        message: "Email sending soon. Excited to have you here!"
      });
    }
  });

  // Resume upload endpoint
  app.post("/api/upload-resume", upload.single('resume'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/resumes/${req.file.filename}`;
      res.json({ fileUrl, fileName: req.file.originalname });
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Internship application routes
  app.post("/api/internship-applications", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const applicationData = req.body;
      
      // Basic validation
      if (!applicationData.fullName || !applicationData.email) {
        return res.status(400).json({ message: "Full name and email are required" });
      }

      const application = await storage.saveInternshipApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error saving internship application:", error);
      next(error);
    }
  });

  app.get("/api/internship-applications", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // This endpoint could be protected with admin auth in the future
      const applications = await storage.getInternshipApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching internship applications:", error);
      next(error);
    }
  });

  // Internship Application routes
  app.post("/api/internship-application", upload.single('resume'), async (req, res) => {
    try {
      // Validate the uploaded file
      if (!req.file) {
        return res.status(400).json({ error: "Resume file is required" });
      }

      // Extract form data
      const {
        fullName,
        email,
        socialMediaHandle,
        socialMediaPlatform,
        technicalHackAnswer,
        unorthodoxThingAnswer
      } = req.body;

      // Create file URL
      const resumeFileUrl = `/api/resumes/${req.file.filename}`;

      const applicationData: InsertInternshipApplication = {
        fullName,
        email,
        socialMediaHandle: socialMediaHandle || null,
        socialMediaPlatform: socialMediaPlatform || null,
        technicalHackAnswer: technicalHackAnswer || null,
        unorthodoxThingAnswer: unorthodoxThingAnswer || null,
        resumeFileName: req.file.originalname,
        resumeFileUrl
      };

      // Save to database
      const application = await storage.saveInternshipApplication(applicationData);

      // Send confirmation email if Resend is configured
      if (resend) {
        try {
          const emailContent = `
            <h2>Internship Application Received</h2>
            <p>Dear ${fullName},</p>
            <p>Thank you for your interest in interning with CoachT! We have received your application.</p>
            <p>We will review your application and get back to you within 1-2 weeks.</p>
            <p>Best regards,<br>The CoachT Team</p>
          `;

          await resend.emails.send({
            from: 'CoachT Team <noreply@coacht.ai>',
            to: email,
            subject: 'Internship Application Received - CoachT',
            html: emailContent,
          });

          // Log the email
          await storage.saveEmailRecord({
            email,
            status: 'success',
            source: 'internship_application',
            responseData: { type: 'confirmation', applicationId: application.id }
          });
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't fail the application submission if email fails
        }
      }

      res.status(201).json({ 
        message: "Application submitted successfully!",
        applicationId: application.id
      });
    } catch (error) {
      console.error("Application submission error:", error);
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  // Serve resume files
  app.get("/api/resumes/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'resumes', filename);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Admin route to get all applications
  app.get("/api/admin/applications", async (req, res) => {
    try {
      const applications = await storage.getInternshipApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Shifu AI Coach routes
  app.get("/api/shifu/daily-goal", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      // Generate daily goal using LLM
      const completion = await visionClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: SHIFU_SYSTEM_PROMPT },
          { role: 'user', content: 'Pick ONE specific item from CoachT app: CHALLENGES: "Max Punches Challenge", "Viper\'s Reflexes Challenge", "Balance Beam Breaker Challenge", "Shifu Says Challenge". PRACTICE MOVES: "Front Kick", "Side Kick", "Round Kick", "Back Kick", "Axe Kick", "Fighting Stance". FORMS: "Taegeuk Il Jang", "Taegeuk Ee Jang", "Heian Shodan", "Heian Nidan". Return ONLY the exact name, nothing else.' }
        ],
        max_tokens: 20,
        temperature: 0.8,
      });

      let goalText = completion.choices[0].message.content || "Front Kick";
      
      // Remove quotes if present
      goalText = goalText.replace(/^["']|["']$/g, '').trim();

      // Store today's goal in logs (simplified - in production save to database)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      res.json({
        goal: {
          dailyGoal: goalText,
          category: "taekwondo",
          targetAccuracy: 80,
          difficulty: "intermediate",
          reasoning: "Focus and precision lead to mastery, young warrior."
        },
        date: today.toISOString(),
        userId: req.user.id
      });
    } catch (error) {
      console.error("Shifu daily goal error:", error);
      // Fallback goal
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      res.json({
        goal: {
          dailyGoal: "Front Kick",
          category: "taekwondo",
          targetAccuracy: 80,
          difficulty: "intermediate",
          reasoning: "Focus and precision lead to mastery, young warrior."
        },
        date: today.toISOString(),
        userId: req.user.id
      });
    }
  });

  app.post("/api/shifu/start-session", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      // In production, update database to mark session as started
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Mock streak calculation
      const currentStreak = 3; // Would be calculated from database

      res.json({
        message: "Session started successfully",
        streak: currentStreak,
        date: today.toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  app.post("/api/shifu/complete-goal", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const { accuracy } = req.body;
      
      if (typeof accuracy !== "number" || accuracy < 0 || accuracy > 100) {
        return res.status(400).json({ error: "Invalid accuracy value" });
      }

      // In production, update database to mark goal as completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      res.json({
        message: "Goal completed successfully",
        accuracy,
        date: today.toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete goal" });
    }
  });

  app.get("/api/shifu/logs", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const limit = parseInt(req.query.limit as string) || 30;
      
      // Mock data for now - in production, fetch from database
      const mockLogs = [];
      const today = new Date();
      
      for (let i = 0; i < limit; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const isCompleted = Math.random() > 0.3; // 70% completion rate
        const accuracy = isCompleted ? Math.floor(Math.random() * 30) + 70 : null;
        
        mockLogs.push({
          id: i + 1,
          userId: req.user.id,
          date: date.toISOString(),
          dailyGoal: i % 3 === 0 ? "Side Kick (intermediate)" : i % 3 === 1 ? "Front Punch (beginner)" : "Balance Pose (beginner)",
          goalCategory: i % 3 === 0 ? "taekwondo" : i % 3 === 1 ? "karate" : "general",
          targetAccuracy: 80,
          completed: isCompleted,
          actualAccuracy: accuracy,
          sessionStarted: Math.random() > 0.2, // 80% session start rate
          currentStreak: Math.max(0, 5 - Math.floor(i / 2))
        });
      }

      res.json(mockLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Shifu logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}