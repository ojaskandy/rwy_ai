# Referral System Implementation Guide

## Overview
The referral system allows content creators to be credited when users they refer sign up and become paid subscribers. Instead of using referral links (which don't work well across website → app transitions), we use a simple modal that asks users who referred them after they click "Start Now" on the pricing page.

## How It Works

### 1. User Flow
1. User signs up for the app
2. User goes to `/pricing` page 
3. User clicks "Start Now" to upgrade
4. **Referral Modal appears** asking "Who told you about Runway AI?"
5. User clicks on a creator name - immediately proceeds to checkout
6. User completes Stripe payment
7. When payment completes, the referral is marked as converted

### 2. Database Schema

#### `referral_creators` table
- Stores all content creators who can receive referrals
- Fields: `creator_code`, `display_name`, `email`, `commission_rate`, `is_active`

#### `referral_conversions` table  
- Tracks which users were referred by which creators
- Fields include attribution timestamp, conversion timestamp, subscription details, commission earned

### 3. Key Components

#### Frontend
- **`ReferralModal.tsx`**: The modal component that shows creator list
- **`Pricing.tsx`**: Updated to show modal before checkout

#### Backend
- **`routes/referral.ts`**: API endpoints for referral management
- **Stripe Webhook**: Tracks conversions when payment succeeds
- **Premium Code Handler**: Also tracks conversions for code usage

### 4. API Endpoints

- `GET /api/referral/creators` - Get list of active creators for the modal
- `POST /api/referral/attribute` - Save which creator referred a user
- `GET /api/referral/stats/:creatorCode` - Get stats for a creator
- `POST /api/referral/create-creator` - Admin endpoint to add new creators

## Adding New Creators

### Option 1: Direct Database Insert (Supabase Dashboard)
1. Go to Supabase dashboard
2. Navigate to `referral_creators` table
3. Insert new row with:
   - `creator_code`: lowercase, no spaces (e.g., "johndoe")
   - `display_name`: Full name shown in modal (e.g., "John Doe")
   - `email`: Creator's email (optional)
   - `commission_rate`: Default "0.20" (20%)
   - `is_active`: true

### Option 2: API Endpoint
```bash
curl -X POST https://your-api.com/api/referral/create-creator \
  -H "Content-Type: application/json" \
  -d '{
    "creatorCode": "johndoe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "commissionRate": "0.20"
  }'
```

### Option 3: Admin Interface (Future)
You could build a simple admin page that calls the create-creator endpoint.

## Viewing Referral Stats

To see how a creator is performing:
```bash
curl https://your-api.com/api/referral/stats/ojaskandy
```

Returns:
```json
{
  "totalReferrals": 45,
  "convertedReferrals": 12,
  "pendingConversions": 33,
  "totalRevenue": 180,
  "totalCommission": 36,
  "pendingCommission": 36,
  "conversions": [...]
}
```

## Commission Calculation

- **Monthly Plan**: $15/month → $3 commission (20%)
- **Yearly Plan**: $10/month → $2 commission (20%)
- **Premium Codes**: No commission by default (configurable)

Commissions are calculated on the first month's revenue only.

## Database Migrations

Run the migration to create the referral tables:
```bash
psql $DATABASE_URL -f server/db/referral_system_migration.sql
```

## Security Considerations

1. **Attribution is one-time only**: Once a user is attributed to a creator, it cannot be changed
2. **Conversion tracking is automatic**: Happens in Stripe webhook, so it's reliable
3. **Creator codes are unique**: Database constraint prevents duplicates
4. **Stats endpoint**: Currently public - you may want to add authentication

## Future Enhancements

1. **Creator Dashboard**: Build a web interface for creators to see their stats
2. **Automated Payouts**: Integrate with payment system for automatic commissions
3. **Referral Links**: Add support for rwyai.app/ref/[code] URLs that auto-select creator
4. **Analytics**: Track click-through rates if using referral links
5. **Email Notifications**: Notify creators when they get conversions

## Testing the System

1. Add test creator in Supabase
2. Sign up as new user
3. Go to pricing page
4. Click "Start Now"
5. Select the test creator in modal
6. Complete payment (use Stripe test card)
7. Check `referral_conversions` table - should show conversion

## Important Notes

- The system works across web → mobile app transitions
- No cookies or localStorage needed
- Attribution happens before payment (important for tracking)
- Creators can be added/removed without code changes
- All tracking is GDPR-compliant (user explicitly selects referrer)
