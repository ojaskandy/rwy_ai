import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

interface CustomPose {
  id: number;
  name: string;
  joints: any[];
  angles: Record<string, number>;
  heights: Record<string, number>;
  measurements: Record<string, number>;
  keyAngles: string[];
  timestamp: string;
}

// Get all custom poses for a user
router.get('/poses/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM shifu_says_custom_poses WHERE user_id = $1 ORDER BY pose_slot',
      [userId]
    );
    
    const poses: Record<number, CustomPose> = {};
    result.rows.forEach((row: any) => {
      poses[row.pose_slot] = {
        id: row.pose_slot,
        name: row.pose_name,
        joints: row.joint_data,
        angles: row.angle_data,
        heights: row.height_data,
        measurements: row.measurement_data,
        keyAngles: row.key_angles,
        timestamp: row.created_at
      };
    });
    
    res.json(poses);
  } catch (error) {
    console.error('Error fetching custom poses:', error);
    res.status(500).json({ error: 'Failed to fetch poses' });
  }
});

// Save a custom pose to a specific slot
router.post('/poses/:userId/:slot', async (req: Request, res: Response) => {
  try {
    const { userId, slot } = req.params;
    const { name, joints, angles, heights, measurements, keyAngles }: CustomPose = req.body;
    
    // Check if pose already exists in this slot
    const existingPose = await pool.query(
      'SELECT id FROM shifu_says_custom_poses WHERE user_id = $1 AND pose_slot = $2',
      [userId, slot]
    );
    
    if (existingPose.rows.length > 0) {
      // Update existing pose
      await pool.query(
        `UPDATE shifu_says_custom_poses 
         SET pose_name = $3, joint_data = $4, angle_data = $5, height_data = $6, 
             measurement_data = $7, key_angles = $8, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND pose_slot = $2`,
        [userId, slot, name, JSON.stringify(joints), JSON.stringify(angles), 
         JSON.stringify(heights), JSON.stringify(measurements), keyAngles]
      );
    } else {
      // Insert new pose
      await pool.query(
        `INSERT INTO shifu_says_custom_poses 
         (user_id, pose_slot, pose_name, joint_data, angle_data, height_data, measurement_data, key_angles)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, slot, name, JSON.stringify(joints), JSON.stringify(angles), 
         JSON.stringify(heights), JSON.stringify(measurements), keyAngles]
      );
    }
    
    res.json({ success: true, message: `Pose saved to slot ${slot}` });
  } catch (error) {
    console.error('Error saving custom pose:', error);
    res.status(500).json({ error: 'Failed to save pose' });
  }
});

// Delete a custom pose from a slot
router.delete('/poses/:userId/:slot', async (req: Request, res: Response) => {
  try {
    const { userId, slot } = req.params;
    
    await pool.query(
      'DELETE FROM shifu_says_custom_poses WHERE user_id = $1 AND pose_slot = $2',
      [userId, slot]
    );
    
    res.json({ success: true, message: `Pose deleted from slot ${slot}` });
  } catch (error) {
    console.error('Error deleting custom pose:', error);
    res.status(500).json({ error: 'Failed to delete pose' });
  }
});

// Export poses for backup
router.get('/export/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM shifu_says_custom_poses WHERE user_id = $1 ORDER BY pose_slot',
      [userId]
    );
    
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      poses: result.rows.map((row: any) => ({
        slot: row.pose_slot,
        name: row.pose_name,
        joints: row.joint_data,
        angles: row.angle_data,
        heights: row.height_data,
        measurements: row.measurement_data,
        keyAngles: row.key_angles,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="shifu-says-poses-${userId}-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting poses:', error);
    res.status(500).json({ error: 'Failed to export poses' });
  }
});

export default router; 