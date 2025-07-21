import { 
  users, trackingSettings, userProfiles, recordings, earlyAccessSignups, referenceMoves, emailRecords, internshipApplications,
  shifuData, shifuLogs, poseReferences,
  type User, type InsertUser, 
  type TrackingSettings, type InsertTrackingSettings,
  type UserProfile, type InsertUserProfile,
  type Recording, type InsertRecording,
  type EarlyAccessSignup, type InsertEarlyAccess,
  type ReferenceMove, type InsertReferenceMove,
  type EmailRecord, type InsertEmailRecord,
  type InternshipApplication, type InsertInternshipApplication,
  type ShifuData, type InsertShifuData,
  type ShifuLog, type InsertShifuLog,
  type PoseReference, type InsertPoseReference
} from "@shared/schema";
import { supabase } from "./db";

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastPractice(userId: number, date?: Date): Promise<User>;
  incrementRecordingsCount(userId: number): Promise<number>;
  completeUserProfile(userId: number, profileData: { fullName: string; username: string; taekwondoExperience: string }): Promise<User>;
  
  // Onboarding gating methods
  updateOnboardingStatus(userId: number, status: Partial<{ hasCompletedOnboarding: boolean; hasPaid: boolean; hasCodeBypass: boolean; stripeCustomerId: string; stripeSubscriptionId: string }>): Promise<User>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeData: { stripeCustomerId: string; stripeSubscriptionId: string | null }): Promise<User>;
  
  // User profile methods
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  updateUserGoal(userId: number, goal: string, dueDate?: Date): Promise<UserProfile>;
  addGalleryImage(userId: number, imageUrl: string): Promise<string[]>;
  removeGalleryImage(userId: number, imageUrl: string): Promise<string[]>;
  
  // Recording methods
  getRecordings(userId: number): Promise<Recording[]>;
  saveRecording(recording: InsertRecording): Promise<Recording>;
  deleteRecording(id: number, userId: number): Promise<boolean>;
  
  // Tracking settings methods
  getTrackingSettings(userId: number): Promise<TrackingSettings | undefined>;
  saveTrackingSettings(settings: InsertTrackingSettings): Promise<TrackingSettings>;
  
  // Early access methods
  getEarlyAccessByEmail(email: string): Promise<EarlyAccessSignup | undefined>;
  saveEarlyAccess(data: InsertEarlyAccess): Promise<EarlyAccessSignup>;
  listEarlyAccessSignups(): Promise<EarlyAccessSignup[]>;
  
  // Reference move methods
  getReferenceMove(moveId: number): Promise<ReferenceMove | undefined>;
  saveReferenceMove(move: InsertReferenceMove): Promise<ReferenceMove>;
  getAllReferenceMoves(): Promise<ReferenceMove[]>;
  
  // Email record methods
  saveEmailRecord(record: InsertEmailRecord): Promise<EmailRecord>;
  getEmailRecords(): Promise<EmailRecord[]>;
  
  // Internship application methods
  saveInternshipApplication(application: InsertInternshipApplication): Promise<InternshipApplication>;
  getInternshipApplications(): Promise<InternshipApplication[]>;
  getInternshipApplicationById(id: number): Promise<InternshipApplication | undefined>;
  
  // Shifu AI Coach methods
  getShifuData(userId: number): Promise<ShifuData | undefined>;
  createShifuData(data: InsertShifuData): Promise<ShifuData>;
  updateShifuData(userId: number, updateData: Partial<InsertShifuData>): Promise<ShifuData>;
  getShifuLogs(userId: number, limit?: number): Promise<ShifuLog[]>;
  createShifuLog(log: InsertShifuLog): Promise<ShifuLog>;
  updateShifuLog(userId: number, date: Date, updates: Partial<InsertShifuLog>): Promise<ShifuLog>;
  getTodaysShifuGoal(userId: number): Promise<ShifuLog | undefined>;
  
  // Session store - simplified for no authentication
  sessionStore: any;
}

// Simplified in-memory session store for guest usage
class SimpleMemoryStore {
  private sessions: { [key: string]: any } = {};

  get(sid: string, callback: (err?: any, session?: any) => void) {
    callback(null, this.sessions[sid] || null);
  }

  set(sid: string, session: any, callback?: (err?: any) => void) {
    this.sessions[sid] = session;
    if (callback) callback();
  }

  destroy(sid: string, callback?: (err?: any) => void) {
    delete this.sessions[sid];
    if (callback) callback();
  }

  length(callback: (err?: any, length?: number) => void) {
    callback(null, Object.keys(this.sessions).length);
  }

  clear(callback?: (err?: any) => void) {
    this.sessions = {};
    if (callback) callback();
  }

  touch(sid: string, session: any, callback?: (err?: any) => void) {
    if (callback) callback();
  }
}

export class SupabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new SimpleMemoryStore();
  }
  
  // Early access methods
  async getEarlyAccessByEmail(email: string): Promise<EarlyAccessSignup | undefined> {
    const { data, error } = await supabase
      .from('early_access_signups')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return undefined;
    return data || undefined;
  }
  
  async saveEarlyAccess(data: InsertEarlyAccess): Promise<EarlyAccessSignup> {
    const { data: result, error } = await supabase
      .from('early_access_signups')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  async listEarlyAccessSignups(): Promise<EarlyAccessSignup[]> {
    const { data, error } = await supabase
      .from('early_access_signups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // User methods - simplified for guest usage
  async getUser(id: number): Promise<User | undefined> {
    // Return default guest user
    return {
      id: 1,
      username: "guest_user",
      email: "guest@runwayai.com",
      fullName: "Guest User",
      picture: null,
      authProvider: "guest",
      profileCompleted: true,
      taekwondoExperience: "beginner",
      hasCompletedOnboarding: true,
      hasPaid: true,
      hasCodeBypass: true,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
      lastPracticeDate: null,
      recordingsCount: 0,
      goal: "",
      goalDueDate: null,
      password: ""
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.getUser(1); // Always return guest user
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.getUser(1); // Always return guest user
  }

  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    return undefined; // No stripe for guest users
  }

  async completeUserProfile(userId: number, profileData: { fullName: string; username: string; taekwondoExperience: string }): Promise<User> {
    return this.getUser(userId) as Promise<User>; // Return guest user
  }

  async updateOnboardingStatus(userId: number, status: any): Promise<User> {
    return this.getUser(userId) as Promise<User>; // Return guest user
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    return this.getUser(userId) as Promise<User>; // Return guest user
  }

  async updateUserStripeInfo(userId: number, stripeData: any): Promise<User> {
    return this.getUser(userId) as Promise<User>; // Return guest user
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return this.getUser(1) as Promise<User>; // Return guest user
  }
  
  async updateUserLastPractice(userId: number, date: Date = new Date()): Promise<User> {
    return this.getUser(userId) as Promise<User>; // Return guest user
  }
  
  async incrementRecordingsCount(userId: number): Promise<number> {
    return 0; // Guest users don't persist recording counts
  }
  
  // Profile methods - simplified for guest usage
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return {
      id: 1,
      userId: 1,
      goal: "Improve pageantry skills",
      goalDueDate: null,
      profileImageUrl: null,
      galleryImages: []
    };
  }
  
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    return this.getUserProfile(1) as Promise<UserProfile>;
  }
  
  async updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    return this.getUserProfile(userId) as Promise<UserProfile>;
  }
  
  async updateUserGoal(userId: number, goal: string, dueDate?: Date): Promise<UserProfile> {
    return this.getUserProfile(userId) as Promise<UserProfile>;
  }
  
  async addGalleryImage(userId: number, imageUrl: string): Promise<string[]> {
    return []; // Guest users don't persist gallery images
  }
  
  async removeGalleryImage(userId: number, imageUrl: string): Promise<string[]> {
    return []; // Guest users don't persist gallery images
  }
  
  // Recording methods - simplified for guest usage
  async getRecordings(userId: number): Promise<Recording[]> {
    return []; // Guest users don't persist recordings
  }
  
  async saveRecording(recording: InsertRecording): Promise<Recording> {
    // Return a mock recording for guest users
    return {
      id: Date.now(),
      userId: recording.userId,
      title: recording.title || "Untitled Recording",
      fileUrl: recording.fileUrl,
      createdAt: new Date(),
      notes: recording.notes || ""
    };
  }
  
  async deleteRecording(id: number, userId: number): Promise<boolean> {
    return true; // Always return success for guest users
  }

  // Tracking settings methods - simplified for guest usage
  async getTrackingSettings(userId: number): Promise<TrackingSettings | undefined> {
    return {
      id: 1,
      userId: 1,
      confidenceThreshold: "0.5",
      modelSelection: "lightning",
      maxPoses: 1,
      skeletonColor: "#BB86FC",
      showSkeleton: true,
      showPoints: true
    };
  }

  async saveTrackingSettings(settings: InsertTrackingSettings): Promise<TrackingSettings> {
    return this.getTrackingSettings(1) as Promise<TrackingSettings>;
  }
  
  // Reference move methods - use Supabase for reference data
  async getReferenceMove(moveId: number): Promise<ReferenceMove | undefined> {
    const { data, error } = await supabase
      .from('reference_moves')
      .select('*')
      .eq('move_id', moveId)
      .single();
    
    if (error) return undefined;
    return data || undefined;
  }
  
  async saveReferenceMove(move: InsertReferenceMove): Promise<ReferenceMove> {
    // First check if move already exists
    const existing = await this.getReferenceMove(move.moveId);
    
    if (existing) {
      // Update existing move
      const { data, error } = await supabase
        .from('reference_moves')
        .update({ 
          ...move, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new move
      const { data, error } = await supabase
        .from('reference_moves')
        .insert(move)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
  
  async getAllReferenceMoves(): Promise<ReferenceMove[]> {
    const { data, error } = await supabase
      .from('reference_moves')
      .select('*')
      .order('move_id', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  // Email record methods - use Supabase
  async saveEmailRecord(record: InsertEmailRecord): Promise<EmailRecord> {
    const { data, error } = await supabase
      .from('email_records')
      .insert(record)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async getEmailRecords(): Promise<EmailRecord[]> {
    const { data, error } = await supabase
      .from('email_records')
      .select('*')
      .order('sent_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Internship application methods - use Supabase
  async saveInternshipApplication(application: InsertInternshipApplication): Promise<InternshipApplication> {
    const { data, error } = await supabase
      .from('internship_applications')
      .insert(application)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getInternshipApplications(): Promise<InternshipApplication[]> {
    const { data, error } = await supabase
      .from('internship_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getInternshipApplicationById(id: number): Promise<InternshipApplication | undefined> {
    const { data, error } = await supabase
      .from('internship_applications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data || undefined;
  }

  // Shifu AI Coach methods - simplified for guest usage
  async getShifuData(userId: number): Promise<ShifuData | undefined> {
    return undefined; // No Shifu data for guest users
  }

  async createShifuData(data: InsertShifuData): Promise<ShifuData> {
    throw new Error("Shifu data not supported for guest users");
  }

  async updateShifuData(userId: number, updateData: Partial<InsertShifuData>): Promise<ShifuData> {
    throw new Error("Shifu data not supported for guest users");
  }

  async getShifuLogs(userId: number, limit?: number): Promise<ShifuLog[]> {
    return []; // No Shifu logs for guest users
  }

  async createShifuLog(log: InsertShifuLog): Promise<ShifuLog> {
    throw new Error("Shifu logs not supported for guest users");
  }

  async updateShifuLog(userId: number, date: Date, updates: Partial<InsertShifuLog>): Promise<ShifuLog> {
    throw new Error("Shifu logs not supported for guest users");
  }

  async getTodaysShifuGoal(userId: number): Promise<ShifuLog | undefined> {
    return undefined; // No Shifu goals for guest users
  }
}

export const storage = new SupabaseStorage();
