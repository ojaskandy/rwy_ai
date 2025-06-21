-- Existing tables above...

-- Martial Arts Videos metadata
CREATE TABLE martial_arts_videos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    duration_seconds DECIMAL(8,2),
    youtube_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-extracted pose sequences
CREATE TABLE pose_sequences (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES martial_arts_videos(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    timestamp_seconds DECIMAL(8,3) NOT NULL,
    pose_detected BOOLEAN NOT NULL DEFAULT FALSE,
    fps DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, frame_number)
);

-- Individual keypoints for each frame
CREATE TABLE pose_keypoints (
    id SERIAL PRIMARY KEY,
    sequence_id INTEGER REFERENCES pose_sequences(id) ON DELETE CASCADE,
    keypoint_id INTEGER NOT NULL,
    keypoint_name VARCHAR(50) NOT NULL,
    x DECIMAL(10,8) NOT NULL,
    y DECIMAL(10,8) NOT NULL,
    z DECIMAL(10,8),
    visibility DECIMAL(6,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifu AI Coach data table
CREATE TABLE shifu_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL UNIQUE,
    current_belt_level VARCHAR(20) NOT NULL DEFAULT 'white',
    last_challenge_attempted VARCHAR(100),
    last_challenge_category VARCHAR(50),
    last_challenge_accuracy INTEGER, -- percentage 0-100
    challenge_history JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifu logs table for daily goals and streak tracking
CREATE TABLE shifu_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    date TIMESTAMP NOT NULL,
    daily_goal TEXT NOT NULL,
    goal_category VARCHAR(50) NOT NULL,
    target_accuracy INTEGER, -- percentage 0-100
    completed BOOLEAN DEFAULT FALSE,
    actual_accuracy INTEGER, -- percentage 0-100
    session_started BOOLEAN DEFAULT FALSE,
    current_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_pose_sequences_video_timestamp ON pose_sequences(video_id, timestamp_seconds);
CREATE INDEX idx_pose_keypoints_sequence ON pose_keypoints(sequence_id);
CREATE INDEX idx_pose_keypoints_name ON pose_keypoints(keypoint_name);
CREATE INDEX idx_shifu_data_user ON shifu_data(user_id);
CREATE INDEX idx_shifu_logs_user_date ON shifu_logs(user_id, date);

-- Sample data for Taekwondo forms
INSERT INTO martial_arts_videos (name, description, category, difficulty, duration_seconds, youtube_url, thumbnail_url) VALUES
('Taegeuk 1 - Il Jang', 'First taekwondo poomsae with basic stances and blocks', 'taekwondo', 'beginner', 150, 'https://www.youtube.com/watch?v=WvnQmtjBmo8', 'https://img.youtube.com/vi/WvnQmtjBmo8/maxresdefault.jpg'),
('Taegeuk 2 - Ee Jang', 'Second taekwondo poomsae with advancing techniques', 'taekwondo', 'beginner', 165, 'https://www.youtube.com/watch?v=u_-gfpYK5NQ', 'https://img.youtube.com/vi/u_-gfpYK5NQ/maxresdefault.jpg'),
('Taegeuk 3 - Sam Jang', 'Third taekwondo poomsae with kicking combinations', 'taekwondo', 'intermediate', 180, 'https://www.youtube.com/watch?v=FggbmUaZlkA', 'https://img.youtube.com/vi/FggbmUaZlkA/maxresdefault.jpg'); 