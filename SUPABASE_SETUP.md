# Supabase Setup for Photo Uploads

## 1. Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Create user_profiles table for storing user gallery images
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gallery_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own profiles
CREATE POLICY "Users can access their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
```

## 2. Storage Bucket Setup

### In Supabase Dashboard:

1. **Go to Storage → Buckets**
2. **Create a new bucket:**
   - Name: `user-photos`
   - Public: ✅ **Yes** (so images can be displayed)
   - File size limit: `5MB`
   - Allowed MIME types: `image/jpeg,image/png,image/webp,image/gif`

3. **Set up Storage Policies:**

Go to Storage → Policies and add these policies for the `user-photos` bucket:

#### Policy 1: Allow authenticated users to upload
```sql
-- Policy Name: "Allow authenticated uploads"
-- Operation: INSERT
-- Target Roles: authenticated

(auth.role() = 'authenticated')
```

#### Policy 2: Allow public read access
```sql
-- Policy Name: "Allow public downloads" 
-- Operation: SELECT
-- Target Roles: public

true
```

#### Policy 3: Allow users to delete their own files
```sql
-- Policy Name: "Allow users to delete own files"
-- Operation: DELETE  
-- Target Roles: authenticated

(auth.uid()::text = (storage.foldername(name))[1])
```

## 3. Environment Variables

Make sure these are set in your `.env` file:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 4. Testing the Setup

1. **Restart your server:** `PORT=5001 npm run dev`
2. **Try uploading an image** on the home page
3. **Check Supabase Storage** to see your uploaded file
4. **Refresh the page** - images should persist!

## 5. Troubleshooting

### If uploads fail:
- Check the server console for error messages
- Verify the storage bucket exists and is public
- Ensure storage policies are configured correctly
- Check that your Supabase service role key has storage permissions

### If images don't persist:
- Check that the database migration ran successfully
- Verify user authentication is working
- Look for database errors in server logs 