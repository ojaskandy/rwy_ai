const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all available martial arts videos
router.get('/videos', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.*,
        COUNT(ps.id) as frame_count,
        MAX(ps.timestamp_seconds) as max_timestamp
      FROM martial_arts_videos v
      LEFT JOIN pose_sequences ps ON v.id = ps.video_id
      GROUP BY v.id
      ORDER BY v.category, v.difficulty, v.name
    `;
    
    const result = await db.query(query);
    
    const videos = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      difficulty: row.difficulty,
      duration: row.duration_seconds,
      youtubeUrl: row.youtube_url,
      thumbnailUrl: row.thumbnail_url,
      hasPoseData: row.frame_count > 0,
      frameCount: parseInt(row.frame_count) || 0,
      maxTimestamp: parseFloat(row.max_timestamp) || 0
    }));
    
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get pose sequence for a specific video
router.get('/videos/:videoId/poses', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { startTime = 0, endTime, limit = 1000 } = req.query;
    
    let query = `
      SELECT 
        ps.frame_number,
        ps.timestamp_seconds,
        ps.pose_detected,
        ps.fps,
        json_agg(
          json_build_object(
            'id', pk.keypoint_id,
            'name', pk.keypoint_name,
            'x', pk.x,
            'y', pk.y,
            'z', pk.z,
            'visibility', pk.visibility
          ) ORDER BY pk.keypoint_id
        ) as keypoints
      FROM pose_sequences ps
      LEFT JOIN pose_keypoints pk ON ps.id = pk.sequence_id
      WHERE ps.video_id = $1 AND ps.timestamp_seconds >= $2
    `;
    
    const params = [videoId, startTime];
    let paramCount = 2;
    
    if (endTime) {
      paramCount++;
      query += ` AND ps.timestamp_seconds <= $${paramCount}`;
      params.push(endTime);
    }
    
    query += `
      GROUP BY ps.id, ps.frame_number, ps.timestamp_seconds, ps.pose_detected, ps.fps
      ORDER BY ps.timestamp_seconds
      LIMIT $${paramCount + 1}
    `;
    params.push(limit);
    
    const result = await db.query(query, params);
    
    const frames = result.rows.map(row => ({
      frameNumber: row.frame_number,
      timestamp: parseFloat(row.timestamp_seconds),
      poseDetected: row.pose_detected,
      fps: parseFloat(row.fps),
      keypoints: row.keypoints.filter(kp => kp.id !== null) // Remove null keypoints
    }));
    
    res.json({
      videoId: parseInt(videoId),
      frameCount: frames.length,
      frames
    });
    
  } catch (error) {
    console.error('Error fetching pose data:', error);
    res.status(500).json({ error: 'Failed to fetch pose data' });
  }
});

// Get pose data for a specific timestamp (for real-time overlay)
router.get('/videos/:videoId/poses/at/:timestamp', async (req, res) => {
  try {
    const { videoId, timestamp } = req.params;
    const tolerance = parseFloat(req.query.tolerance) || 0.1; // 100ms tolerance
    
    const query = `
      SELECT 
        ps.frame_number,
        ps.timestamp_seconds,
        ps.pose_detected,
        json_agg(
          json_build_object(
            'id', pk.keypoint_id,
            'name', pk.keypoint_name,
            'x', pk.x,
            'y', pk.y,
            'z', pk.z,
            'visibility', pk.visibility
          ) ORDER BY pk.keypoint_id
        ) as keypoints
      FROM pose_sequences ps
      LEFT JOIN pose_keypoints pk ON ps.id = pk.sequence_id
      WHERE ps.video_id = $1 
        AND ABS(ps.timestamp_seconds - $2) <= $3
        AND ps.pose_detected = true
      GROUP BY ps.id, ps.frame_number, ps.timestamp_seconds, ps.pose_detected
      ORDER BY ABS(ps.timestamp_seconds - $2)
      LIMIT 1
    `;
    
    const result = await db.query(query, [videoId, timestamp, tolerance]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No pose data found for timestamp' });
    }
    
    const frame = result.rows[0];
    res.json({
      frameNumber: frame.frame_number,
      timestamp: parseFloat(frame.timestamp_seconds),
      poseDetected: frame.pose_detected,
      keypoints: frame.keypoints.filter(kp => kp.id !== null)
    });
    
  } catch (error) {
    console.error('Error fetching pose at timestamp:', error);
    res.status(500).json({ error: 'Failed to fetch pose data' });
  }
});

module.exports = router; 