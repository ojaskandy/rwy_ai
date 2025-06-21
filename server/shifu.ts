// Shifu AI Coach Module
export interface ChallengeHistory {
  challengeId: string;
  category: string;
  accuracy: number;
  completedAt: string;
}

export interface ShifuRecommendation {
  dailyGoal: string;
  category: string;
  targetAccuracy: number;
  difficulty: string;
  reasoning: string;
}

export class ShifuAI {
  private readonly challenges = {
    taekwondo: [
      { id: "side-kick", name: "Side Kick", difficulty: "intermediate", targetAccuracy: 85 },
      { id: "front-kick", name: "Front Kick", difficulty: "beginner", targetAccuracy: 80 },
      { id: "roundhouse-kick", name: "Roundhouse Kick", difficulty: "intermediate", targetAccuracy: 85 },
      { id: "back-kick", name: "Back Kick", difficulty: "advanced", targetAccuracy: 90 },
      { id: "axe-kick", name: "Axe Kick", difficulty: "advanced", targetAccuracy: 90 }
    ],
    karate: [
      { id: "front-punch", name: "Front Punch", difficulty: "beginner", targetAccuracy: 75 },
      { id: "uppercut", name: "Uppercut", difficulty: "intermediate", targetAccuracy: 80 },
      { id: "crane-stance", name: "Crane Stance", difficulty: "intermediate", targetAccuracy: 85 },
      { id: "horse-stance", name: "Horse Stance", difficulty: "beginner", targetAccuracy: 80 }
    ],
    general: [
      { id: "balance-pose", name: "Balance Pose", difficulty: "beginner", targetAccuracy: 75 },
      { id: "flexibility-stretch", name: "Flexibility Stretch", difficulty: "beginner", targetAccuracy: 70 },
      { id: "coordination-drill", name: "Coordination Drill", difficulty: "intermediate", targetAccuracy: 80 }
    ]
  };

  private readonly beltLevels = [
    "white", "yellow", "orange", "green", "blue", "purple", "brown", "black"
  ];

  generateDailyGoal(
    currentBeltLevel: string,
    challengeHistory: ChallengeHistory[] = [],
    lastChallengeCategory?: string
  ): ShifuRecommendation {
    const beltIndex = this.beltLevels.indexOf(currentBeltLevel) || 0;
    const isAdvanced = beltIndex >= 6; // brown belt and above
    
    // Get categories user hasn't practiced recently
    const recentCategories = challengeHistory
      .slice(0, 5) // last 5 challenges
      .map(c => c.category);
    
    // Avoid repeating the same category too often
    const availableCategories = Object.keys(this.challenges).filter(cat => {
      const recentCount = recentCategories.filter(rc => rc === cat).length;
      return recentCount < 2; // Don't repeat category more than twice in last 5
    });
    
    // If all categories have been used recently, reset to all categories
    const categoryPool = availableCategories.length > 0 ? availableCategories : Object.keys(this.challenges);
    
    // Prefer category different from last challenge
    let selectedCategory = lastChallengeCategory && categoryPool.length > 1 
      ? categoryPool.find(c => c !== lastChallengeCategory) || categoryPool[0]
      : categoryPool[Math.floor(Math.random() * categoryPool.length)];
    
    // Get appropriate challenges for user's level
    const categoryType = selectedCategory as keyof typeof this.challenges;
    const challenges = this.challenges[categoryType];
    
    const suitableChallenges = challenges.filter(challenge => {
      if (isAdvanced) return true; // Advanced users can do anything
      if (challenge.difficulty === "advanced") return beltIndex >= 5; // purple belt+
      if (challenge.difficulty === "intermediate") return beltIndex >= 3; // green belt+
      return true; // beginners can do beginner challenges
    });
    
    // Select a challenge
    const selectedChallenge = suitableChallenges[Math.floor(Math.random() * suitableChallenges.length)];
    
    // Adjust target accuracy based on recent performance
    let targetAccuracy = selectedChallenge.targetAccuracy;
    const recentAccuracy = this.calculateRecentAccuracy(challengeHistory, selectedCategory);
    
    if (recentAccuracy > 90) {
      targetAccuracy = Math.min(95, targetAccuracy + 5); // Increase target if performing well
    } else if (recentAccuracy < 70) {
      targetAccuracy = Math.max(60, targetAccuracy - 10); // Lower target if struggling
    }
    
    const reasoning = this.generateReasoning(selectedChallenge, challengeHistory, currentBeltLevel, recentAccuracy);
    
    return {
      dailyGoal: `${selectedChallenge.name} (${selectedChallenge.difficulty})`,
      category: selectedCategory,
      targetAccuracy,
      difficulty: selectedChallenge.difficulty,
      reasoning
    };
  }

  private calculateRecentAccuracy(challengeHistory: ChallengeHistory[], category: string): number {
    const recentChallenges = challengeHistory
      .filter(c => c.category === category)
      .slice(0, 3); // last 3 challenges in this category
    
    if (recentChallenges.length === 0) return 75; // default assumption
    
    const totalAccuracy = recentChallenges.reduce((sum, c) => sum + c.accuracy, 0);
    return totalAccuracy / recentChallenges.length;
  }

  private generateReasoning(
    challenge: any, 
    challengeHistory: ChallengeHistory[], 
    beltLevel: string, 
    recentAccuracy: number
  ): string {
    const reasons = [];
    
    if (challengeHistory.length === 0) {
      reasons.push("Starting your martial arts journey");
    } else if (recentAccuracy > 90) {
      reasons.push("You've been performing excellently - time to push your limits");
    } else if (recentAccuracy < 70) {
      reasons.push("Let's focus on building solid fundamentals");
    }
    
    if (challenge.difficulty === "advanced" && this.beltLevels.indexOf(beltLevel) >= 6) {
      reasons.push("Your advanced belt level allows for complex techniques");
    } else if (challenge.difficulty === "beginner") {
      reasons.push("Mastering the basics is key to martial arts excellence");
    }
    
    return reasons[0] || "Continue developing your martial arts skills";
  }

  calculateStreak(logs: Array<{ date: Date; completed: boolean; sessionStarted: boolean }>): number {
    // Sort logs by date descending
    const sortedLogs = logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date);
      logDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (logDate.getTime() === expectedDate.getTime() && sortedLogs[i].sessionStarted) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

export const shifuAI = new ShifuAI(); 