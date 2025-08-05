import { type Request, type Response } from 'express';
import { getAuthenticatedUser } from '../lib/auth';
import { db, supabase } from '../db';
import { oneTimeCodes, subscriptions, users } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Zod schema for validating the request body
const codeValidationSchema = z.object({
  code: z.string().min(1, { message: "Code is required." }),
});

export async function verifyCode(req: Request, res: Response) {
  // Validate request body
  const validation = codeValidationSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Invalid request body", details: validation.error.errors });
  }

  const { code } = validation.data;
  const user = await getAuthenticatedUser(req);
  const userId = user.id;

  try {
    // Check if the one-time code is valid and unused
    const codeEntry = await db
      .select()
      .from(oneTimeCodes)
      .where(and(eq(oneTimeCodes.code, code), eq(oneTimeCodes.isUsed, false)))
      .get();

    if (!codeEntry) {
      return res.status(404).json({ error: 'Invalid or used code.' });
    }

    // Mark the code as used
    await db
      .update(oneTimeCodes)
      .set({
        isUsed: true,
        usedAt: new Date(),
        usedByUserId: userId,
      })
      .where(eq(oneTimeCodes.id, codeEntry.id));
      
    // Grant the user premium access by creating or updating their subscription
    // This uses an "upsert" pattern.
    await db
      .insert(subscriptions)
      .values({
        userId: userId,
        status: 'premium_code',
        planType: 'code',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          status: 'premium_code',
          planType: 'code',
          premiumCodeId: null, // Clear any previous premium code link if needed
          updatedAt: new Date(),
        },
      });

    // Also update the user's main profile to indicate they have bypassed payment
    if (user.email) {
      await db
          .update(users)
          .set({ hasCodeBypass: true })
          .where(eq(users.email, user.email));
    }

    return res.json({ success: true, message: 'Code verified and premium access granted.' });

  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}
