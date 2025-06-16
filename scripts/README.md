# Pose Data Extraction Workflow

This system extracts pose data from martial arts videos and stores it in the database for real-time overlay during training sessions.

## Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up database schema:**
```bash
psql -d your_database -f ../server/db/schema.sql
```

## Usage

### Extract Pose Data from Video

```bash
# Basic extraction to JSON file
python extract_pose_data.py path/to/video.mp4

# Specify output file
python extract_pose_data.py path/to/video.mp4 -o output.json

# Extract and store in database (TODO: implement)
python extract_pose_data.py path/to/video.mp4 -d
```

### Example Workflow

1. **Download a martial arts video** (ensure you have rights to use it)
2. **Extract pose data:**
   ```bash
   python extract_pose_data.py taegeuk_1.mp4 -o taegeuk_1_poses.json
   ```
3. **Upload to database** (manual for now):
   ```sql
   INSERT INTO martial_arts_videos (name, category, difficulty, youtube_url) 
   VALUES ('Taegeuk 1', 'taekwondo', 'beginner', 'https://youtube.com/...');
   ```

## Output Format

The extracted JSON contains:
```json
{
  "video_info": {
    "filename": "taegeuk_1.mp4",
    "fps": 30.0,
    "total_frames": 4500,
    "duration_seconds": 150.0
  },
  "frames": [
    {
      "frame_number": 0,
      "timestamp": 0.0,
      "pose_detected": true,
      "keypoints": [
        {
          "id": 0,
          "name": "nose",
          "x": 0.5123,
          "y": 0.2456,
          "z": -0.1234,
          "visibility": 0.9876
        }
        // ... 32 more keypoints
      ]
    }
    // ... more frames
  ]
}
```

## Benefits

✅ **Scalable**: Small JSON files vs large video files  
✅ **Fast**: Pre-computed pose data loads instantly  
✅ **Efficient**: Only download pose coordinates, not video pixels  
✅ **Flexible**: Works with any video source (YouTube, local, etc.)  
✅ **Cost-effective**: Minimal storage and bandwidth requirements  

## File Sizes

- **Video file**: ~50MB for 3-minute martial arts form
- **Pose data**: ~500KB for same video (100x smaller!)
- **Network transfer**: Only skeleton coordinates, not video data

## Next Steps

1. **Implement database storage** in `extract_pose_data.py`
2. **Create batch processing** for multiple videos
3. **Add pose data validation** and quality checks
4. **Integrate with client-side overlay** system
5. **Add pose smoothing** and interpolation algorithms 