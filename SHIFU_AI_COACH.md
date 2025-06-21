# Shifu AI Coach

The Shifu AI Coach is an intelligent training assistant integrated into CoachT that provides personalized daily goals and tracks your martial arts progress.

## Features

### 🎯 Daily Goal Generation
- **Smart Goal Selection**: AI analyzes your belt level, recent challenge history, and accuracy performance to recommend appropriate daily goals
- **Category Variety**: Ensures you don't repeat the same martial arts category too often (rotates between Taekwondo, Karate, and General exercises)
- **Adaptive Difficulty**: Adjusts target accuracy based on your recent performance:
  - Increases target if you're performing well (>90% accuracy)
  - Lowers target if you're struggling (<70% accuracy)
  - Suggests appropriate difficulty level based on your belt level

### 📊 Progress Tracking
- **Completion Rate**: Tracks how often you complete your daily goals
- **Average Accuracy**: Monitors your overall performance accuracy
- **Streak Tracking**: Counts consecutive days of session starts
- **Weekly Accuracy Graph**: Visual representation of your weekly progress

### 🏆 Belt-Based Recommendations
The AI considers your belt level when suggesting challenges:
- **Beginner Belts** (White, Yellow, Orange): Focus on fundamental techniques
- **Intermediate Belts** (Green, Blue, Purple): Mix of basic and intermediate techniques
- **Advanced Belts** (Brown, Black): Access to all techniques including advanced moves

## How to Use

### 1. Dashboard Daily Goal
- When you log in, Shifu displays your daily goal on the main dashboard
- Click "Start Session" to begin training and track your streak
- The goal includes the technique name, difficulty level, and target accuracy

### 2. Profile Shifu Log
- Visit your Profile page to see the "Shifu AI Coach" section
- View your training statistics, weekly accuracy chart, and recent goals
- Use the Week/Month/All tabs to filter your goal history

## API Endpoints

### GET /api/shifu/daily-goal
Returns today's AI-generated daily goal for the authenticated user.

**Response:**
```json
{
  "goal": {
    "dailyGoal": "Side Kick (intermediate)",
    "category": "taekwondo",
    "targetAccuracy": 85,
    "difficulty": "intermediate",
    "reasoning": "Continue developing your martial arts skills"
  },
  "date": "2025-01-XX",
  "userId": 123
}
```

### POST /api/shifu/start-session
Marks that the user has started their training session for the day.

### POST /api/shifu/complete-goal
Records the completion of a daily goal with accuracy results.

**Request Body:**
```json
{
  "accuracy": 87
}
```

### GET /api/shifu/logs
Retrieves the user's Shifu training log history.

**Query Parameters:**
- `limit` (optional): Number of log entries to return (default: 30)

## Database Schema

### shifu_data table
Stores user's current belt level and challenge history.

### shifu_logs table
Tracks daily goals, completion status, accuracy results, and streak information.

## AI Algorithm

The Shifu AI uses the following logic to generate daily goals:

1. **Belt Level Assessment**: Determines available techniques based on user's belt level
2. **Category Rotation**: Avoids repeating the same category more than twice in the last 5 challenges
3. **Performance Analysis**: Reviews recent accuracy to adjust target expectations
4. **Random Selection**: Chooses from appropriate techniques within constraints
5. **Personalized Reasoning**: Generates motivational text based on performance trends

## Future Enhancements

- Integration with actual pose detection accuracy from training sessions
- Advanced ML model for more sophisticated goal recommendations
- Achievement badges and rewards system
- Social features for comparing progress with friends
- Detailed analytics and progress reports

## Implementation Status

- ✅ Backend Shifu AI module (`server/shifu.ts`)
- ✅ API endpoints for goal generation and tracking
- ✅ Frontend daily goal display on dashboard
- ✅ Profile page Shifu Log section with statistics and charts
- ⏳ Database integration (currently using mock data)
- ⏳ Real pose accuracy integration from training sessions

## Technical Notes

The current implementation uses mock data for demonstration. To fully integrate:

1. Run database migrations to create `shifu_data` and `shifu_logs` tables
2. Update storage methods to handle Shifu data operations
3. Connect pose detection accuracy results to the Shifu system
4. Implement proper error handling and edge cases

The Shifu AI Coach enhances the CoachT experience by providing personalized guidance and motivation for martial arts training. 