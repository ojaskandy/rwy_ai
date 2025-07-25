# Board Feature Setup Instructions

## Overview
This document provides step-by-step instructions for setting up the Pinterest-style Board feature with Supabase Storage integration.

## 1. Supabase Storage Bucket Setup

### Create the Public Board Bucket

1. **Go to your Supabase Dashboard**
   - Navigate to Storage > Buckets
   - Click "Create new bucket"

2. **Create Bucket with these settings:**
   ```
   Bucket Name: public-board
   Public: ✅ Enabled (this allows public read access)
   File size limit: 10MB (recommended)
   Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
   ```

3. **Configure Bucket Policies (RLS)**
   ```sql
   -- Allow public read access
   CREATE POLICY "Public read access" ON storage.objects
   FOR SELECT USING (bucket_id = 'public-board');
   
   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'public-board' 
     AND auth.role() = 'authenticated'
   );
   
   -- Allow users to delete their own uploads
   CREATE POLICY "Users can delete own files" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'public-board' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

### Verify Bucket Configuration

1. **Test Upload Access:**
   - Try uploading a test image through the Supabase dashboard
   - Verify the image is publicly accessible via the generated URL

2. **Check URL Format:**
   - URLs should follow: `https://[your-project].supabase.co/storage/v1/object/public/public-board/[path]`

## 2. Database Schema Migration

Run the following SQL to create the necessary tables:

```sql
-- Board functionality tables
CREATE TABLE IF NOT EXISTS board_images (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('dress', 'shoes', 'nails', 'inspiration', 'personal')),
    tags JSONB DEFAULT '[]',
    width INTEGER,
    height INTEGER,
    like_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS board_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    image_id INTEGER REFERENCES board_images(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, image_id)
);

CREATE TABLE IF NOT EXISTS board_saves (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    image_id INTEGER REFERENCES board_images(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, image_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_board_images_user_id ON board_images(user_id);
CREATE INDEX IF NOT EXISTS idx_board_images_category ON board_images(category);
CREATE INDEX IF NOT EXISTS idx_board_images_created_at ON board_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_likes_user_id ON board_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_board_likes_image_id ON board_likes(image_id);
CREATE INDEX IF NOT EXISTS idx_board_saves_user_id ON board_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_board_saves_image_id ON board_saves(image_id);
```

## 3. Backend API Endpoints Required

✅ **COMPLETED - All endpoints implemented in server/routes.ts:**

### Image Upload Endpoint
✅ `POST /api/board/upload` - Uploads image to public-board bucket

### Board Images Management
✅ `GET /api/board/images` - Fetch all board images with user info, like/save status
✅ `POST /api/board/images` - Create new board image entry
✅ `DELETE /api/board/images/:id` - Delete board image (owner only)

### Like/Save Functionality
✅ `POST /api/board/images/:id/like` - Like an image
✅ `DELETE /api/board/images/:id/like` - Unlike an image
✅ `POST /api/board/images/:id/save` - Save an image to personal collection
✅ `DELETE /api/board/images/:id/save` - Remove from personal collection

**All API endpoints have been implemented with:**
- ✅ Proper authentication checks
- ✅ Error handling and validation
- ✅ TypeScript type safety
- ✅ Optimistic UI support
- ✅ Secure file upload to public-board bucket
- ✅ User authorization for delete operations
- ✅ Like/save count management

## 4. Environment Variables

Ensure these environment variables are set:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 5. Frontend Integration

The Board page is ready and includes:

✅ **Pinterest-style masonry layout**
- Responsive grid (2-4 columns based on screen size)
- Smooth animations and transitions
- Auto-adjusting layout on window resize

✅ **Image Upload**
- File selection with preview
- Category and tag assignment
- Progress indication
- Image dimension extraction

✅ **Like & Save Functionality**
- Heart icon for likes with real-time counter
- Bookmark icon for saves
- Optimistic UI updates
- Visual feedback (filled icons when active)

✅ **User Information**
- Profile avatars
- Username/full name display
- Upload date formatting

✅ **Search & Filtering**
- Search by title, description, tags, or username
- Category filtering with emoji icons
- "My Saves" filter
- Real-time filtering

✅ **Modal Details**
- Large image view
- User profile information
- Like/save actions
- Full description and tags
- Upload statistics

## 6. Navigation Integration

The Board has been added to:
- ✅ GlobalDock navigation (Images icon)
- ✅ App.tsx routing system
- ✅ Protected route wrapper

## 7. Security Considerations

🔒 **Storage Security:**
- Images are stored in public-board bucket (separate from user-photos)
- Users can only delete their own uploads
- File size and type restrictions enforced

🔒 **API Security:**
- All endpoints require authentication
- User can only like/save once per image
- Proper authorization checks for delete operations

## 8. Testing Checklist

Before deploying, verify:

- [ ] Supabase bucket created and configured
- [ ] Database tables created successfully
- [ ] Backend API endpoints implemented
- [ ] File upload works to public-board bucket
- [ ] Images display in masonry grid
- [ ] Like/save functionality works
- [ ] Search and filtering works
- [ ] Modal opens with full details
- [ ] Navigation works from GlobalDock

## 9. Performance Optimizations

The implementation includes:

- **Lazy loading** for images
- **Masonry layout optimization** with proper grid calculation
- **Optimistic UI updates** for like/save actions
- **Debounced search** functionality
- **Image dimension caching** in database
- **Proper indexing** for database queries

## 10. Future Enhancements

Consider adding:
- Image compression/resizing on upload
- Infinite scroll for large image collections
- User profile pages with their uploads
- Comments on images
- Image collections/boards
- Advanced search filters (date, popularity)
- Image sharing functionality

---

**Next Step:** Implement the backend API endpoints listed in section 3 to complete the Board functionality. 