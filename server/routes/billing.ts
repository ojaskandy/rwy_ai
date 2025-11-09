import { type Request, type Response } from 'express';
import { getAuthenticatedUser } from '../lib/auth';
import { supabase } from '../db';
import { z } from 'zod';
import { validatePremiumCode } from '../lib/subscription';

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
    // Validate the premium code using Supabase premium_codes table
    const validation = await validatePremiumCode(code);
    
    if (!validation.valid) {
      return res.status(404).json({ error: validation.message || 'Invalid or expired code' });
    }

    // Get the code details from premium_codes table
    const { data: codeData, error: codeError } = await supabase
      .from('premium_codes')
      .select('id, used_count, usage_limit')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (codeError || !codeData) {
      return res.status(404).json({ error: 'Invalid or expired code' });
    }

    // Increment the used_count for the premium code
    await supabase
      .from('premium_codes')
      .update({ used_count: (codeData.used_count || 0) + 1 })
      .eq('id', codeData.id);
      
    // Grant the user premium access by creating or updating their subscription in Supabase
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        status: 'premium_code',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    // Also track which code was used in premium_code_usage table
    await supabase
      .from('premium_code_usage')
      .insert({
        premium_code_id: codeData.id,
        user_id: userId,
        used_at: new Date().toISOString(),
      });

    // Track referral conversion for premium code usage
    try {
      const { data: referralData } = await supabase
        .from('referral_conversions')
        .select('*')
        .eq('user_id', userId)
        .is('converted_at', null)
        .single();

      if (referralData) {
        // Update referral conversion with code usage details
        await supabase
          .from('referral_conversions')
          .update({
            converted_at: new Date().toISOString(),
            conversion_type: 'premium_code',
            plan_type: 'code',
            // No commission for code usage unless you want to track it differently
            commission_earned: '0',
          })
          .eq('id', referralData.id);
      }
    } catch (error) {
      console.error('Error tracking referral conversion:', error);
      // Don't fail the request if referral tracking fails
    }

    return res.json({ success: true, message: 'Code verified and premium access granted.' });

  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}
