import express, { Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../db';
import path from 'path';

const router = express.Router();

// Default guest user for Runway AI (no authentication needed)
const DEFAULT_GUEST_USER = {
  id: 1,
  username: "guest_user",
  email: "guest@runwayai.com",
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

// Upload photo endpoint
router.post('/upload-photo', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Use guest user for Runway AI (no authentication required)
    const userId = DEFAULT_GUEST_USER.id;
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${userId}/${Date.now()}${fileExtension}`;

    // For now, create a simple mock URL for development
    // In production, this would upload to Supabase Storage
    const publicUrl = `https://via.placeholder.com/200x200/FFB6C1/FFFFFF?text=Photo-${Date.now()}`;

    // Get user's current profile or create if doesn't exist
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId);

    if (profileError) {
      console.error('Profile query error:', profileError);
      return res.status(500).json({ error: 'Failed to access user profile' });
    }

    let currentGalleryImages: string[] = [];
    
    if (profiles && profiles.length > 0) {
      // Update existing profile
      currentGalleryImages = profiles[0].gallery_images || [];
      const updatedGalleryImages = [...currentGalleryImages, publicUrl];

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ gallery_images: updatedGalleryImages })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          gallery_images: [publicUrl]
        });

      if (insertError) {
        console.error('Profile insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create profile' });
      }
    }

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile endpoint
router.get('/user-profile', async (req: Request, res: Response) => {
  try {
    // Use guest user for Runway AI (no authentication required)
    const userId = DEFAULT_GUEST_USER.id;

    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Profile query error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    if (profiles && profiles.length > 0) {
      res.json({
        ...profiles[0],
        galleryImages: profiles[0].gallery_images || []
      });
    } else {
      // Return empty profile if none exists
      res.json({
        userId,
        galleryImages: []
      });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;