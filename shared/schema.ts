import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Updated user schema for Google-only authentication with profile setup
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(), // Google email, unique but can be null for legacy users
  fullName: text("full_name"), // User's real name from profile setup
  password: text("password").default(""), // Optional for OAuth users
  picture: text("picture"), // Google profile picture URL
  authProvider: text("auth_provider").default("google"), // "google", "local", or "guest" for different auth methods
  profileCompleted: boolean("profile_completed").default(false), // Whether user completed initial setup
  taekwondoExperience: text("taekwondo_experience"), // "less_than_1_year", "1_3_years", "3_5_years", "5_plus_years"
  lastPracticeDate: timestamp("last_practice_date"),
  recordingsCount: integer("recordings_count").default(0),
  goal: text("goal").default(""),
  goalDueDate: timestamp("goal_due_date"),
  // Onboarding gating fields
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  hasPaid: boolean("has_paid").default(false),
  hasCodeBypass: boolean("has_code_bypass").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for initial user creation (Google OAuth)
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  fullName: true,
  password: true,
  picture: true,
  authProvider: true,
  profileCompleted: true,
  taekwondoExperience: true,
});

// Schema for profile completion
export const profileSetupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  taekwondoExperience: z.enum(["less_than_1_year", "1_3_years", "3_5_years", "5_plus_years"], {
    required_error: "Please select your taekwondo experience level"
  }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ProfileSetup = z.infer<typeof profileSetupSchema>;

// Onboarding gating schemas
export const onboardingStatusSchema = z.object({
  hasCompletedOnboarding: z.boolean(),
  hasPaid: z.boolean(),
  hasCodeBypass: z.boolean(),
});

export const updateOnboardingSchema = z.object({
  userId: z.number(),
  hasCompletedOnboarding: z.boolean().optional(),
  hasPaid: z.boolean().optional(),
  hasCodeBypass: z.boolean().optional(),
});

export const discountCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;
export type UpdateOnboarding = z.infer<typeof updateOnboardingSchema>;
export type DiscountCode = z.infer<typeof discountCodeSchema>;

// User profile schema for storing additional information
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  goal: text("goal"),
  goalDueDate: timestamp("goal_due_date"),
  profileImageUrl: text("profile_image_url"),
  galleryImages: jsonb("gallery_images").$type<string[]>().default([]),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).pick({
  userId: true,
  goal: true,
  goalDueDate: true,
  profileImageUrl: true,
  galleryImages: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// Schema for recording sessions
export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").default("Untitled Recording"),
  fileUrl: text("file_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"),
});

export const insertRecordingSchema = createInsertSchema(recordings).pick({
  userId: true,
  title: true,
  fileUrl: true,
  notes: true,
});

export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordings.$inferSelect;

// Schema for tracking settings
export const trackingSettings = pgTable("tracking_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  confidenceThreshold: text("confidence_threshold").notNull().default("0.5"),
  modelSelection: text("model_selection").notNull().default("lightning"),
  maxPoses: integer("max_poses").notNull().default(1),
  skeletonColor: text("skeleton_color").notNull().default("#BB86FC"),
  showSkeleton: boolean("show_skeleton").notNull().default(true),
  showPoints: boolean("show_points").notNull().default(true),
});

export const insertTrackingSettingsSchema = createInsertSchema(trackingSettings).pick({
  userId: true,
  confidenceThreshold: true,
  modelSelection: true,
  maxPoses: true,
  skeletonColor: true,
  showSkeleton: true,
  showPoints: true,
});

export type InsertTrackingSettings = z.infer<typeof insertTrackingSettingsSchema>;
export type TrackingSettings = typeof trackingSettings.$inferSelect;

// Schema for early access signups
export const earlyAccessSignups = pgTable("early_access_signups", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  referralSource: text("referral_source").notNull(),
  experienceLevel: text("experience_level"),
  newsletterOptIn: boolean("newsletter_opt_in").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEarlyAccessSchema = createInsertSchema(earlyAccessSignups).pick({
  fullName: true,
  email: true,
  referralSource: true,
  experienceLevel: true,
  newsletterOptIn: true,
});

export type InsertEarlyAccess = z.infer<typeof insertEarlyAccessSchema>;
export type EarlyAccessSignup = typeof earlyAccessSignups.$inferSelect;

// Reference moves for Taekwondo techniques
export const referenceMoves = pgTable("reference_moves", {
  id: serial("id").primaryKey(),
  moveId: integer("move_id").notNull(), // ID from the frontend move collection
  name: text("name").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  jointAngles: jsonb("joint_angles"),  // Store joint angles as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReferenceMoveSchema = createInsertSchema(referenceMoves).pick({
  moveId: true,
  name: true,
  category: true,
  imageUrl: true,
  jointAngles: true,
});

export type InsertReferenceMove = z.infer<typeof insertReferenceMoveSchema>;
export type ReferenceMove = typeof referenceMoves.$inferSelect;

// Email records for tracking sent emails
export const emailRecords = pgTable("email_records", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  status: text("status").notNull(), // success, failure, etc.
  source: text("source").default("mobile_landing"), // where the email was sent from
  responseData: jsonb("response_data"), // Store response data from email service
});

export const insertEmailRecordSchema = createInsertSchema(emailRecords).pick({
  email: true,
  status: true,
  source: true,
  responseData: true,
});

export type InsertEmailRecord = z.infer<typeof insertEmailRecordSchema>;
export type EmailRecord = typeof emailRecords.$inferSelect;

// Internship applications table
export const internshipApplications = pgTable("internship_applications", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  socialMediaHandle: text("social_media_handle"),
  socialMediaPlatform: text("social_media_platform"), // linkedin, twitter, github, etc.
  technicalHackAnswer: text("technical_hack_answer"),
  unorthodoxThingAnswer: text("unorthodox_thing_answer"),
  resumeFileName: text("resume_file_name"),
  resumeFileUrl: text("resume_file_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInternshipApplicationSchema = createInsertSchema(internshipApplications).pick({
  fullName: true,
  email: true,
  socialMediaHandle: true,
  socialMediaPlatform: true,
  technicalHackAnswer: true,
  unorthodoxThingAnswer: true,
  resumeFileName: true,
  resumeFileUrl: true,
});

export type InsertInternshipApplication = z.infer<typeof insertInternshipApplicationSchema>;
export type InternshipApplication = typeof internshipApplications.$inferSelect;

// Shifu AI Coach data table
export const shifuData = pgTable("shifu_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  currentBeltLevel: text("current_belt_level").notNull().default("white"),
  lastChallengeAttempted: text("last_challenge_attempted"),
  lastChallengeCategory: text("last_challenge_category"),
  lastChallengeAccuracy: integer("last_challenge_accuracy"), // percentage 0-100
  challengeHistory: jsonb("challenge_history").$type<Array<{
    challengeId: string;
    category: string;
    accuracy: number;
    completedAt: string;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShifuDataSchema = createInsertSchema(shifuData).pick({
  userId: true,
  currentBeltLevel: true,
  lastChallengeAttempted: true,
  lastChallengeCategory: true,
  lastChallengeAccuracy: true,
  challengeHistory: true,
});

export type InsertShifuData = z.infer<typeof insertShifuDataSchema>;
export type ShifuData = typeof shifuData.$inferSelect;

// Shifu logs table for daily goals and streak tracking
export const shifuLogs = pgTable("shifu_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  dailyGoal: text("daily_goal").notNull(),
  goalCategory: text("goal_category").notNull(),
  targetAccuracy: integer("target_accuracy"), // percentage 0-100
  completed: boolean("completed").default(false),
  actualAccuracy: integer("actual_accuracy"), // percentage 0-100
  sessionStarted: boolean("session_started").default(false),
  currentStreak: integer("current_streak").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShifuLogSchema = createInsertSchema(shifuLogs).pick({
  userId: true,
  date: true,
  dailyGoal: true,
  goalCategory: true,
  targetAccuracy: true,
  completed: true,
  actualAccuracy: true,
  sessionStarted: true,
  currentStreak: true,
});

export type InsertShifuLog = z.infer<typeof insertShifuLogSchema>;
export type ShifuLog = typeof shifuLogs.$inferSelect;

// Pose references table for Shifu Says challenge
export const poseReferences = pgTable("shifusays_references", {
  id: serial("id").primaryKey(),
  poseName: text("pose_name").notNull().unique(),
  displayName: text("display_name").notNull(),
  referenceData: jsonb("reference_data").$type<{
    keyAngles: Record<string, number>;
    tolerances: {
      angleTolerance: number;
      heightTolerance: number;
      stanceTolerance: number;
    };
  }>().notNull(),
  requiredKeypoints: jsonb("required_keypoints").$type<string[]>().notNull().default([]),
  minConfidence: text("min_confidence").notNull().default("0.6"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPoseReferenceSchema = createInsertSchema(poseReferences).pick({
  poseName: true,
  displayName: true,
  referenceData: true,
  requiredKeypoints: true,
  minConfidence: true,
});

export type InsertPoseReference = z.infer<typeof insertPoseReferenceSchema>;
export type PoseReference = typeof poseReferences.$inferSelect;
