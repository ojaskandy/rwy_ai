# Martial Arts Videos

This directory contains local video files for the martial arts forms available in CoachT.

## Directory Structure

```
videos/
├── taekwondo/
├── karate/
├── kung-fu/
├── boxing/
├── muay-thai/
└── jiu-jitsu/
```

## Adding New Videos

To add a new martial arts video:

1. **Place the video file** in the appropriate category directory (e.g., `videos/taekwondo/form-1-il-jang.mp4`)

2. **Optionally add a thumbnail** image in the same directory (e.g., `videos/taekwondo/form-1-il-jang-thumb.jpg`)

3. **Update the video data** in `src/data/martialArtsVideos.ts`:
   ```typescript
   {
     id: 'unique-video-id',
     name: 'Display Name',
     description: 'Brief description of the form or technique',
     category: 'taekwondo', // or karate, kung-fu, boxing, muay-thai, jiu-jitsu
     difficulty: 'beginner', // or intermediate, advanced
     duration: '2:30', // approximate duration
     videoUrl: '/videos/taekwondo/your-video-file.mp4',
     thumbnailUrl: '/videos/taekwondo/your-thumbnail.jpg',
     isLocalFile: true
   }
   ```

## Supported Video Formats

- MP4 (recommended)
- WebM
- OGG
- Any format supported by HTML5 video element

## Thumbnail Images

- Recommended size: 640x360 (16:9 aspect ratio)
- Supported formats: JPG, PNG, WebP
- If no thumbnail is provided, a category icon will be displayed

## Current Files

The following video files are expected based on the current configuration:

### Taekwondo Forms
- `form-1-il-jang.mp4` + thumbnail
- `form-2-ee-jang.mp4` + thumbnail
- `form-3-sam-jang.mp4` + thumbnail
- `form-4-sa-jang.mp4` + thumbnail
- `form-5-oh-jang.mp4` + thumbnail
- `form-6-yook-jang.mp4` + thumbnail
- `form-7-chil-jang.mp4` + thumbnail
- `form-8-pal-jang.mp4` + thumbnail

## Benefits of Local Videos

✅ **Full Pose Detection**: Complete skeleton analysis and joint angle measurement
✅ **No Network Required**: Videos work offline once loaded
✅ **Better Performance**: No streaming delays or quality issues
✅ **Privacy**: No external video platform tracking

## Note

Make sure video files are optimized for web delivery (compressed but good quality) to ensure fast loading times. 