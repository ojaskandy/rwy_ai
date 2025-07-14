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
  process.env.GOOGLE_CLIENT_SECRET,
);

// Hash password for storage
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Securely compare supplied password with stored hash
async function comparePasswords(
  supplied: string,
  stored: string,
): Promise<boolean> {
  console.log("Comparing passwords - supplied:", supplied);
  console.log("Stored hash:", stored);

  if (!stored || !stored.includes(".")) {
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
    },
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
        if (!user.password) {
          console.log("User has no password set:", username);
          return done(null, false, { message: "Invalid username or password" });
        }
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
      if (!user) {
        return done(null, false);
      }
      done(null, user as Express.User);
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
        console.log("Session ID after registration:", req.sessionID);
        console.log("Session cookie config:", req.sessionStore.options?.cookie);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate(
      "local",
      (
        err: Error | null,
        user: Express.User | false,
        info: { message: string } | undefined,
      ) => {
        if (err) return next(err);
        if (!user) {
          return res
            .status(401)
            .json({ message: info?.message || "Invalid credentials" });
        }

        req.login(user, (err) => {
          if (err) return next(err);
          return res.json(user);
        });
      },
    )(req, res, next);
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

      // Check if user already exists by email
      let user = email ? await storage.getUserByEmail(email) : undefined;

      if (!user) {
        // Generate a temporary username from email (will be customizable during profile setup)
        let tempUsername = email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        // Ensure the temporary username is unique
        const existingUserWithUsername = await storage.getUserByUsername(tempUsername);
        if (existingUserWithUsername) {
          let counter = 1;
          let uniqueUsername = `${tempUsername}${counter}`;
          while (await storage.getUserByUsername(uniqueUsername)) {
            counter++;
            uniqueUsername = `${tempUsername}${counter}`;
          }
          tempUsername = uniqueUsername;
        }

        // Create a new user with Google info
        user = await storage.createUser({
          username: tempUsername,
          email: email || "",
          fullName: name || "",
          password: "",
          picture: picture || "",
          authProvider: "google",
        });

        // Create user profile
        await storage.createUserProfile({
          userId: user.id,
          profileImageUrl: picture || "",
        });
      }

      // Log the user in
      if (!user) {
        return res
          .status(500)
          .json({ message: "Failed to create or find user" });
      }

      req.login(user as Express.User, (err) => {
        if (err) return next(err);
        res.json({
          id: user.id,
          username: user.username,
          email: user.email || email || "",
          fullName: user.fullName || name || "",
          picture: user.picture || picture || "",
          authProvider: user.authProvider || "google",
          profileCompleted: user.profileCompleted || false,
          taekwondoExperience: user.taekwondoExperience,
        });
      });
    } catch (error) {
      console.error("Web Google OAuth error:", error);
      res.status(400).json({ message: "Google authentication failed" });
    }
  });

  // Test endpoint for debugging mobile tokens
  app.post("/api/debug-token", async (req, res) => {
    try {
      const { idToken } = req.body;

      console.log("=== TOKEN DEBUG ENDPOINT ===");
      console.log("Raw token received:", idToken);
      console.log("Token length:", idToken?.length);
      console.log("Token type:", typeof idToken);

      if (!idToken) {
        return res.json({ error: "No token provided" });
      }

      // Clean the token
      const cleanToken = idToken.trim().replace(/\s/g, '');

      // Basic format checks
      const formatChecks = {
        original: idToken,
        cleaned: cleanToken,
        originalLength: idToken.length,
        cleanedLength: cleanToken.length,
        hasThreeParts: cleanToken.split('.').length === 3,
        startsWithEy: cleanToken.startsWith('ey'),
        containsSpecialChars: /[^A-Za-z0-9._-]/.test(cleanToken),
        hasUrlEncoding: cleanToken.includes('%'),
        parts: cleanToken.split('.').map((part: string) => ({
          length: part.length,
          firstChars: part.substring(0, 10),
          lastChars: part.substring(-10),
        })),
      };

      // Try to decode JWT parts
      let decodedInfo = null;
      try {
        const parts = cleanToken.split('.');
        if (parts.length >= 2) {
          // Add padding if needed
          const addPadding = (str: string) => {
            while (str.length % 4) {
              str += '=';
            }
            return str;
          };

          const header = JSON.parse(Buffer.from(addPadding(parts[0]), 'base64').toString());
          const payload = JSON.parse(Buffer.from(addPadding(parts[1]), 'base64').toString());

          decodedInfo = {
            header,
            payload: {
              iss: payload.iss,
              aud: payload.aud,
              sub: payload.sub,
              email: payload.email,
              exp: payload.exp,
              iat: payload.iat,
            },
          };
        }
      } catch (decodeError) {
        const errorMessage = decodeError instanceof Error ? decodeError.message : "Unknown decode error";
        decodedInfo = { error: "Failed to decode JWT", details: errorMessage };
      }

      // Try Google verification
      let verificationResult = null;
      try {
        const audiences = [
          process.env.VITE_GOOGLE_CLIENT_ID,
          process.env.IOS_GOOGLE_CLIENT_ID,
        ].filter((id): id is string => Boolean(id));

        const ticket = await googleClient.verifyIdToken({
          idToken: cleanToken,
          audience: audiences,
        });

        verificationResult = { success: true, payload: ticket.getPayload() };
      } catch (verifyError) {
        const errorMessage = verifyError instanceof Error ? verifyError.message : "Unknown verification error";
        const errorType = verifyError instanceof Error ? verifyError.constructor.name : "UnknownError";
        verificationResult = { 
          success: false, 
          error: errorMessage,
          errorType: errorType,
        };
      }

      console.log("Debug results:", {
        formatChecks,
        decodedInfo,
        verificationResult,
      });

      res.json({
        formatChecks,
        decodedInfo,
        verificationResult,
        environment: {
          hasWebClientId: !!process.env.VITE_GOOGLE_CLIENT_ID,
          hasIosClientId: !!process.env.IOS_GOOGLE_CLIENT_ID,
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        },
      });

    } catch (error) {
      console.error("Debug endpoint error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Mobile Google login endpoint
  app.post("/api/mobile-login", async (req, res, next) => {
    try {
      const { idToken } = req.body;

      console.log("=== MOBILE LOGIN BACKEND DEBUG ===");
      console.log("Received ID token:", idToken);
      console.log("Token length:", idToken?.length);
      console.log("Token type:", typeof idToken);
      console.log("Token first 50 chars:", idToken?.substring(0, 50));
      console.log("Token last 50 chars:", idToken?.substring(-50));
      console.log("Token format:", {
        hasThreeParts: idToken?.split('.').length,
        startsWithEy: idToken?.startsWith('ey'),
        containsSpecialChars: /[^A-Za-z0-9._-]/.test(idToken || ''),
        hasUrlEncoding: idToken?.includes('%'),
        hasSpaces: idToken?.includes(' '),
        hasNewlines: idToken?.includes('\n'),
        rawLength: idToken?.length,
        trimmedLength: idToken?.trim().length,
      });
      console.log("Environment variables:");
      console.log("- VITE_GOOGLE_CLIENT_ID:", process.env.VITE_GOOGLE_CLIENT_ID);
      console.log("- IOS_GOOGLE_CLIENT_ID:", process.env.IOS_GOOGLE_CLIENT_ID);
      console.log("- GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "[SET]" : "[NOT SET]");

      if (!idToken) {
        return res.status(400).json({ message: "No ID token provided" });
      }

      // Clean the token
      const cleanToken = idToken.trim().replace(/\s/g, '');
      console.log("Cleaned token length:", cleanToken.length);
      console.log("Token changed after cleaning:", cleanToken !== idToken);

      // Pre-validate JWT format before Google verification
      const tokenParts = cleanToken.split('.');
      if (tokenParts.length !== 3) {
        console.error("❌ Invalid JWT format: expected 3 parts, got", tokenParts.length);
        return res.status(400).json({ 
          message: "Invalid JWT format", 
          details: `Expected 3 parts, got ${tokenParts.length}` 
        });
      }

      // Try to decode the header and payload for debugging
      try {
        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log("Decoded JWT header:", header);
        console.log("Decoded JWT payload summary:", {
          iss: payload.iss,
          aud: payload.aud,
          sub: payload.sub,
          email: payload.email,
          exp: payload.exp,
          iat: payload.iat,
        });

        // Check if audience matches our expected client IDs
        const expectedAudiences = [
          process.env.VITE_GOOGLE_CLIENT_ID,
          process.env.IOS_GOOGLE_CLIENT_ID,
        ].filter(Boolean);

        console.log("Expected audiences:", expectedAudiences);
        console.log("Token audience:", payload.aud);
        console.log("Audience match:", expectedAudiences.includes(payload.aud));

      } catch (decodeError) {
        console.error("Failed to decode JWT for debugging:", decodeError);
      }

      // Verify the Google ID token
      const audiences = [
        process.env.VITE_GOOGLE_CLIENT_ID,
        process.env.IOS_GOOGLE_CLIENT_ID,
      ].filter((id): id is string => Boolean(id));

      console.log("Attempting to verify token with audiences:", audiences);

      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: cleanToken,
          audience: audiences,
        });

        console.log("✅ Token verification successful!");
        const payload = ticket.getPayload();
        console.log("Token payload:", {
          iss: payload?.iss,
          aud: payload?.aud,
          sub: payload?.sub,
          email: payload?.email,
          email_verified: payload?.email_verified,
          exp: payload?.exp,
          iat: payload?.iat,
        });

        if (!payload) {
          return res.status(400).json({ message: "Invalid Google token" });
        }

        const { email, name, picture } = payload;

        if (!email) {
          return res.status(400).json({ message: "No email provided by Google" });
        }

        // Check if user already exists by email
        let user = email ? await storage.getUserByEmail(email) : undefined;

        if (!user) {
          // Generate a temporary username from email (will be customizable during profile setup)
          let tempUsername = email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

          // Ensure the temporary username is unique
          const existingUserWithUsername = await storage.getUserByUsername(tempUsername);
          if (existingUserWithUsername) {
            let counter = 1;
            let uniqueUsername = `${tempUsername}${counter}`;
            while (await storage.getUserByUsername(uniqueUsername)) {
              counter++;
              uniqueUsername = `${tempUsername}${counter}`;
            }
            tempUsername = uniqueUsername;
          }

          // Create a new user with Google info
          user = await storage.createUser({
            username: tempUsername,
            email: email || "",
            fullName: name || "",
            password: "",
            picture: picture || "",
            authProvider: "google",
          });

          // Create user profile
          await storage.createUserProfile({
            userId: user.id,
            profileImageUrl: picture || "",
          });
        }

        // Log the user in
        if (!user) {
          return res
            .status(500)
            .json({ message: "Failed to create or find user" });
        }

        req.login(user as Express.User, (err) => {
          if (err) return next(err);
          console.log("Mobile login successful for user:", user.username);
          console.log("=== END MOBILE LOGIN DEBUG ===");
          res.json({
            id: user.id,
            username: user.username,
            email: user.email || email || "",
            fullName: user.fullName || name || "",
            picture: user.picture || picture || "",
            authProvider: user.authProvider || "google",
            profileCompleted: user.profileCompleted || false,
            taekwondoExperience: user.taekwondoExperience,
          });
        });

      } catch (verificationError) {
        console.error("❌ Token verification failed:", verificationError);

        // Check for specific error messages
        if (verificationError instanceof Error) {
          console.error("Verification error details:", {
            message: verificationError.message,
            name: verificationError.name,
            stack: verificationError.stack,
          });

          // Check for the specific "string did not match expected pattern" error
          if (verificationError.message.includes("string did not match the expected pattern")) {
            console.error("🔍 PATTERN MISMATCH ERROR DETECTED!");
            console.error("This usually means the JWT format is malformed");
            console.error("Token being verified:", cleanToken.substring(0, 100) + "...");

            return res.status(400).json({ 
              message: "JWT format error", 
              details: "Token format does not match expected JWT pattern",
              hint: "Check if token is properly base64 encoded"
            });
          }

          if (verificationError.message.includes("audience")) {
            return res.status(400).json({ 
              message: "Audience mismatch", 
              details: verificationError.message 
            });
          }
        }

        throw verificationError; // Re-throw if not handled above
      }

    } catch (error) {
      console.error("Mobile Google OAuth error:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      console.log("=== END MOBILE LOGIN DEBUG (ERROR) ===");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Mobile Google authentication failed", details: errorMessage });
    }
  });

  // Magic Link authentication endpoint
  app.post("/api/auth/magic", async (req, res, next) => {
    try {
      const { email, issuer } = req.body;

      console.log("=== MAGIC LINK LOGIN ===");
      console.log("Email:", email);
      console.log("Issuer:", issuer);

      if (!email) {
        return res.status(400).json({ message: "Missing email" });
      }

      // Trust the frontend Magic authentication since the user successfully authenticated there

      // Check if user already exists by email
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Generate a temporary username from email
        let tempUsername = email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        // Ensure the temporary username is unique
        const existingUserWithUsername = await storage.getUserByUsername(tempUsername);
        if (existingUserWithUsername) {
          let counter = 1;
          let uniqueUsername = `${tempUsername}${counter}`;
          while (await storage.getUserByUsername(uniqueUsername)) {
            counter++;
            uniqueUsername = `${tempUsername}${counter}`;
          }
          tempUsername = uniqueUsername;
        }

        // Create a new user with Magic info
        user = await storage.createUser({
          username: tempUsername,
          email: email,
          fullName: "", // Will be set during profile completion
          password: "",
          picture: "",
          authProvider: "magic",
        });

        // Create user profile
        await storage.createUserProfile({
          userId: user.id,
          profileImageUrl: "",
        });
      }

      // Log the user in
      if (!user) {
        return res.status(500).json({ message: "Failed to create or find user" });
      }

      req.login(user as Express.User, (err) => {
        if (err) return next(err);
        console.log("Magic Link login successful for user:", user.username);
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          picture: user.picture,
          authProvider: user.authProvider || "magic",
          profileCompleted: user.profileCompleted || false,
          taekwondoExperience: user.taekwondoExperience,
        });
      });

    } catch (error) {
      console.error("Magic Link authentication error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Magic Link authentication failed", details: errorMessage });
    }
  });

  // Guest login endpoint
  app.post("/api/guest-login", async (req, res, next) => {
    try {
      // Create a guest user with a unique username based on timestamp
      const guestUsername = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Generate a secure random password for guest
      const randomPassword = randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);

      console.log("Guest login - random password:", randomPassword);
      console.log("Guest login - hashed password:", hashedPassword);

      if (!hashedPassword) {
        throw new Error("Failed to generate password hash");
      }

      const guestUser = await storage.createUser({
        username: guestUsername,
        email: null,
        password: hashedPassword,
        fullName: "Guest User",
        picture: null,
        authProvider: "guest",
        profileCompleted: true, // Skip profile setup for guests
        taekwondoExperience: "beginner",
      });

      // Log the guest user in automatically
      req.login(guestUser, (err) => {
        if (err) return next(err);
        console.log("Guest login successful for user:", guestUser.username);
        res.json({
          id: guestUser.id,
          username: guestUser.username,
          email: guestUser.email,
          fullName: guestUser.fullName,
          picture: guestUser.picture,
          authProvider: guestUser.authProvider,
          profileCompleted: guestUser.profileCompleted,
          taekwondoExperience: guestUser.taekwondoExperience,
        });
      });
    } catch (error) {
      console.error("Guest login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Guest login failed", details: errorMessage });
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