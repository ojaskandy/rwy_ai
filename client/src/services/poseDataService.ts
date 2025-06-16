interface PoseKeypoint {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface PoseFrame {
  frameNumber: number;
  timestamp: number;
  poseDetected: boolean;
  fps: number;
  keypoints: PoseKeypoint[];
}

interface PoseSequence {
  videoId: number;
  frameCount: number;
  frames: PoseFrame[];
}

interface MartialArtsVideo {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  youtubeUrl: string;
  thumbnailUrl: string;
  hasPoseData: boolean;
  frameCount: number;
  maxTimestamp: number;
}

class PoseDataService {
  private baseUrl: string;
  private cache: Map<string, any> = new Map();
  
  constructor(baseUrl: string = '/api/pose-data') {
    this.baseUrl = baseUrl;
  }
  
  // Get all available videos with pose data
  async getVideos(): Promise<MartialArtsVideo[]> {
    const cacheKey = 'videos';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/videos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const videos = await response.json();
      this.cache.set(cacheKey, videos);
      return videos;
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  }
  
  // Get pose sequence for a video (with optional time range)
  async getPoseSequence(
    videoId: number, 
    startTime: number = 0, 
    endTime?: number,
    limit: number = 1000
  ): Promise<PoseSequence> {
    const cacheKey = `poses_${videoId}_${startTime}_${endTime}_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      let url = `${this.baseUrl}/videos/${videoId}/poses?startTime=${startTime}&limit=${limit}`;
      if (endTime !== undefined) {
        url += `&endTime=${endTime}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const poseSequence = await response.json();
      this.cache.set(cacheKey, poseSequence);
      return poseSequence;
    } catch (error) {
      console.error('Error fetching pose sequence:', error);
      throw error;
    }
  }
  
  // Get pose data for a specific timestamp (for real-time overlay)
  async getPoseAtTimestamp(
    videoId: number, 
    timestamp: number, 
    tolerance: number = 0.1
  ): Promise<PoseFrame | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/videos/${videoId}/poses/at/${timestamp}?tolerance=${tolerance}`
      );
      
      if (response.status === 404) {
        return null; // No pose data found for this timestamp
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching pose at timestamp:', error);
      return null;
    }
  }
  
  // Clear cache (useful when data is updated)
  clearCache(): void {
    this.cache.clear();
  }
  
  // Pre-load pose data for a video (for smooth playback)
  async preloadPoseData(videoId: number, duration: number): Promise<void> {
    const chunkSize = 30; // Load 30-second chunks
    const chunks = Math.ceil(duration / chunkSize);
    
    console.log(`Pre-loading pose data for video ${videoId} in ${chunks} chunks`);
    
    const promises = [];
    for (let i = 0; i < chunks; i++) {
      const startTime = i * chunkSize;
      const endTime = Math.min((i + 1) * chunkSize, duration);
      
      promises.push(
        this.getPoseSequence(videoId, startTime, endTime).catch(error => {
          console.warn(`Failed to load chunk ${i}:`, error);
        })
      );
    }
    
    await Promise.all(promises);
    console.log(`Pose data pre-loading complete for video ${videoId}`);
  }
}

// Create singleton instance
export const poseDataService = new PoseDataService();

// Export types for use in components
export type {
  PoseKeypoint,
  PoseFrame,
  PoseSequence,
  MartialArtsVideo
}; 