import { Request, Response } from 'express';
import { db } from '../db';
import { referralCreators, referralConversions } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '../lib/auth';

// Get list of active creators for the modal
export async function getCreators(req: Request, res: Response) {
  try {
    const creators = await db
      .select({
        creatorCode: referralCreators.creatorCode,
        displayName: referralCreators.displayName,
      })
      .from(referralCreators)
      .where(eq(referralCreators.isActive, true));

    res.json({ creators });
  } catch (error) {
    console.error('Error fetching creators:', error);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
}

// Save referral attribution
export async function attributeReferral(req: Request, res: Response) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { creatorCode } = req.body;
    if (!creatorCode) {
      return res.status(400).json({ error: 'Creator code is required' });
    }

    // Check if creator exists
    const creator = await db
      .select()
      .from(referralCreators)
      .where(eq(referralCreators.creatorCode, creatorCode))
      .get();

    if (!creator) {
      return res.status(400).json({ error: 'Invalid creator code' });
    }

    // Check if user already has attribution
    const existingAttribution = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.userId, user.id))
      .get();

    if (existingAttribution) {
      return res.json({ 
        success: true, 
        message: 'Referral already attributed',
        existingCreator: existingAttribution.creatorCode 
      });
    }

    // Create new attribution
    await db.insert(referralConversions).values({
      creatorCode,
      userId: user.id,
      userEmail: user.email || '',
      attributedAt: new Date(),
    });

    res.json({ success: true, message: 'Referral attributed successfully' });
  } catch (error) {
    console.error('Error attributing referral:', error);
    res.status(500).json({ error: 'Failed to attribute referral' });
  }
}

// Get referral stats for a creator (admin endpoint)
export async function getCreatorStats(req: Request, res: Response) {
  try {
    const { creatorCode } = req.params;
    
    if (!creatorCode) {
      return res.status(400).json({ error: 'Creator code is required' });
    }

    // Get all conversions for this creator
    const conversions = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.creatorCode, creatorCode));

    const stats = {
      totalReferrals: conversions.length,
      convertedReferrals: conversions.filter(c => c.convertedAt).length,
      pendingConversions: conversions.filter(c => !c.convertedAt).length,
      totalRevenue: conversions
        .filter(c => c.subscriptionAmount)
        .reduce((sum, c) => sum + parseFloat(c.subscriptionAmount || '0'), 0),
      totalCommission: conversions
        .filter(c => c.commissionEarned)
        .reduce((sum, c) => sum + parseFloat(c.commissionEarned || '0'), 0),
      pendingCommission: conversions
        .filter(c => c.payoutStatus === 'pending' && c.commissionEarned)
        .reduce((sum, c) => sum + parseFloat(c.commissionEarned || '0'), 0),
      conversions: conversions.map(c => ({
        userId: c.userId,
        userEmail: c.userEmail,
        attributedAt: c.attributedAt,
        convertedAt: c.convertedAt,
        planType: c.planType,
        subscriptionAmount: c.subscriptionAmount,
        commissionEarned: c.commissionEarned,
        payoutStatus: c.payoutStatus,
      })),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching creator stats:', error);
    res.status(500).json({ error: 'Failed to fetch creator stats' });
  }
}

// Admin endpoint to add new creators
export async function createCreator(req: Request, res: Response) {
  try {
    const { creatorCode, displayName, email, commissionRate } = req.body;

    if (!creatorCode || !displayName) {
      return res.status(400).json({ error: 'Creator code and display name are required' });
    }

    // Check if code already exists
    const existing = await db
      .select()
      .from(referralCreators)
      .where(eq(referralCreators.creatorCode, creatorCode))
      .get();

    if (existing) {
      return res.status(400).json({ error: 'Creator code already exists' });
    }

    await db.insert(referralCreators).values({
      creatorCode: creatorCode.toLowerCase().replace(/\s+/g, ''),
      displayName,
      email,
      commissionRate: commissionRate || '0.20',
      isActive: true,
    });

    res.json({ success: true, message: 'Creator added successfully' });
  } catch (error) {
    console.error('Error creating creator:', error);
    res.status(500).json({ error: 'Failed to create creator' });
  }
}
