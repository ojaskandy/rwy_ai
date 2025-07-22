-- Migration to add calendar_events table for pageant calendar functionality
-- Run this migration to add calendar events support

CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    date TIMESTAMP NOT NULL,
    time TEXT NOT NULL, -- stored as HH:MM format
    type TEXT NOT NULL DEFAULT 'pageant', -- pageant, interview, fitting, routine, photo, meeting, deadline, personal
    location TEXT,
    reminder INTEGER DEFAULT 60, -- minutes before event
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);

-- Insert some sample events for testing (optional)
-- Uncomment the lines below if you want sample data

/*
INSERT INTO calendar_events (user_id, title, description, date, time, type, location, reminder) VALUES
(1, 'Evening Gown Fitting', 'Final fitting for pageant evening gown', '2025-01-25 10:30:00', '10:30', 'fitting', 'Bella Boutique', 60),
(1, 'Interview Practice Session', 'Mock interview with pageant coach', '2025-01-27 16:00:00', '16:00', 'interview', 'Studio', 1440),
(1, 'Portfolio Photo Shoot', 'Professional headshots and full-body photos', '2025-01-30 09:00:00', '09:00', 'photo', 'Downtown Studio', 1440);
*/ 