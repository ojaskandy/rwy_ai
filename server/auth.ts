import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Convert callback-based scrypt to Promise-based
const scryptAsync = promisify(scrypt);

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.VITE_GOOGLE_CLIENT_ID || process.env.IOS_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Hash password for storage
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Securely compare supplied password with stored hash
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  console.log("Comparing passwords - supplied:", supplied);
  console.log("Stored hash:", stored);
  
  if (!stored || !stored.includes('.')) {
    console.log("Invalid stored password format");
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  console.log("Extracted salt:", salt);
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  
  console.log("Hashed buffer length:", hashedBuf.length);
  console.log("Supplied buffer length:", suppliedBuf.length);
  
  const result = timingSafeEqual(hashedBuf, suppliedBuf);
  console.log("Password comparison result:", result);
  
  return result;
}

export function setupAuth(app: Express): void {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "coacht-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.NODE_ENV === "production" ? ".coacht.xyz" : undefined,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local strategy for username/password login
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Login attempt for username:", username);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log("User not found:", username);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log("User found, comparing passwords...");
        const passwordMatch = await comparePasswords(password, user.password);
        console.log("Password match result:", passwordMatch);
        
        if (!passwordMatch) {
          console.log("Password mismatch for user:", username);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log("Login successful for user:", username);
        return done(null, user);
      } catch (error) {
        console.error("Error during authentication:", error);
        return done(error);
      }
    }),
  );

  // Tell passport how to serialize and deserialize users
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register route - create a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create the user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Log the user in automatically
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Web Google OAuth login endpoint
  app.post("/api/auth/google", async (req, res, next) => {
    try {
      const { credential } = req.body;
      
      if (!credential) {
        return res.status(400).json({ message: "No credential provided" });
      }

      // Verify the Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.VITE_GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ message: "Invalid Google token" });
      }

      const { email, name, picture } = payload;

      if (!email) {
        return res.status(400).json({ message: "No email provided by Google" });
      }

      // Generate a smart username
      let username;
      if (name) {
        // Extract first name from full name
        const firstName = name.split(' ')[0];
        username = firstName.toLowerCase().replace(/[^a-z0-9]/g, ''); // Remove special characters
      } else {
        // Use email prefix without domain
        username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      }

      // Check if user already exists by email as username (for existing users)
      let user = await storage.getUserByUsername(email);

      if (!user) {
        // Check if the preferred username is already taken
        const existingUserWithUsername = await storage.getUserByUsername(username);
        if (existingUserWithUsername) {
          // If username is taken, append a number
          let counter = 1;
          let uniqueUsername = `${username}${counter}`;
          while (await storage.getUserByUsername(uniqueUsername)) {
            counter++;
            uniqueUsername = `${username}${counter}`;
          }
          username = uniqueUsername;
        }

        // Create a new user with the smart username
        user = await storage.createUser({
          username: username,
          password: '', // Empty password for OAuth users
        });
        
        // Create user profile with additional Google data
        await storage.createUserProfile({
          userId: user.id,
          profileImageUrl: picture || '',
        });
      }

      // Log the user in
      if (!user) {
        return res.status(500).json({ message: "Failed to create or find user" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.json({
          id: user.id,
          username: user.username,
          email: email,
          name: name || user.username,
          picture: picture,
          authProvider: 'google'
        });
      });
    } catch (error) {
      console.error("Web Google OAuth error:", error);
      res.status(400).json({ message: "Google authentication failed" });
    }
  });

  // Mobile Google login endpoint
  app.post("/api/mobile-login", async (req, res, next) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "No ID token provided" });
      }

      // Verify the Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.VITE_GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ message: "Invalid Google token" });
      }

      const { email, name, picture } = payload;

      if (!email) {
        return res.status(400).json({ message: "No email provided by Google" });
      }

             // Generate a smart username
       let username;
       if (name) {
         // Extract first name from full name
         const firstName = name.split(' ')[0];
         username = firstName.toLowerCase().replace(/[^a-z0-9]/g, ''); // Remove special characters
       } else {
         // Use email prefix without domain
         username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
       }

       // Check if user already exists by email as username (for existing users)
       let user = await storage.getUserByUsername(email);

       if (!user) {
         // Check if the preferred username is already taken
         const existingUserWithUsername = await storage.getUserByUsername(username);
         if (existingUserWithUsername) {
           // If username is taken, append a number
           let counter = 1;
           let uniqueUsername = `${username}${counter}`;
           while (await storage.getUserByUsername(uniqueUsername)) {
             counter++;
             uniqueUsername = `${username}${counter}`;
           }
           username = uniqueUsername;
         }

         // Create a new user with the smart username
         user = await storage.createUser({
           username: username,
           password: '', // Empty password for OAuth users
         });
         
         // Create user profile with additional Google data
         await storage.createUserProfile({
           userId: user.id,
           profileImageUrl: picture || '',
         });
       }

             // Log the user in
       if (!user) {
         return res.status(500).json({ message: "Failed to create or find user" });
       }

       req.login(user, (err) => {
         if (err) return next(err);
         res.json({
           id: user.id,
           username: user.username,
           email: email,
           name: name || user.username,
           picture: picture,
           authProvider: 'google'
         });
       });
    } catch (error) {
      console.error("Mobile Google OAuth error:", error);
      res.status(400).json({ message: "Mobile Google authentication failed" });
    }
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.sendStatus(401);
    }
  });
}