// Score validator function to prevent inflated scores in AI feedback
// This is used to ensure authentic, critical feedback

// Types from routes.ts
interface PageantCriterion {
  category: string;
  score: number | null;
  feedback: string;
}

interface SceneAnalysis {
  scene: string;
  strengths: string[];
  improvements: string[];
}

interface StructuredFeedback {
  overview: string;
  overallScore?: number;
  sceneAnalysis?: SceneAnalysis[];
  pageantCriteria?: PageantCriterion[];
  nextSteps?: string[];
}

/**
 * Validates and potentially adjusts scores in AI feedback to prevent overly positive scores
 * 
 * @param feedback The structured feedback to validate
 * @returns The feedback with adjusted scores if needed
 */
export function validateScores(feedback: StructuredFeedback | null): StructuredFeedback | null {
  if (!feedback || !feedback.pageantCriteria || !Array.isArray(feedback.pageantCriteria)) {
    return feedback;
  }
  
  // Track suspiciously high scores
  let highScoreCount = 0;
  const totalCriteria = feedback.pageantCriteria.length;
  let validScoresCount = 0;
  let scoreSum = 0;
  
  // Apply a general harshness factor - even stricter now
  const HARSHNESS_FACTOR = 0.85; // 15% reduction across the board
  
  // Count criteria with suspiciously high scores (above 75 now - stricter threshold)
  feedback.pageantCriteria = feedback.pageantCriteria.map(criterion => {
    if (criterion.score) {
      // Apply the harshness factor to all scores
      const adjustedScore = Math.round(criterion.score * HARSHNESS_FACTOR);
      
      // Track for average calculation
      scoreSum += adjustedScore;
      validScoresCount++;
      
      // Track high scores
      if (adjustedScore > 75) {
        highScoreCount++;
      }
      
      return {
        ...criterion,
        score: adjustedScore
      };
    }
    return criterion;
  });
  
  // If still more than 40% of scores are suspiciously high, scale them down further
  // Now using a stricter threshold of 40% instead of 50%
  if (highScoreCount > totalCriteria * 0.4) {
    console.warn('Detected inflated scores after initial adjustment - applying additional correction');
    // Scale down high scores further
    feedback.pageantCriteria = feedback.pageantCriteria.map(criterion => {
      if (criterion.score && criterion.score > 75) {
        // Apply a stronger reduction to high scores
        return {
          ...criterion,
          score: Math.round(criterion.score * 0.85) // Further 15% reduction for high scores
        };
      }
      return criterion;
    });
    
    // Recalculate sum for average
    scoreSum = 0;
    validScoresCount = 0;
    feedback.pageantCriteria.forEach(criterion => {
      if (criterion.score !== null && criterion.score !== undefined) {
        scoreSum += criterion.score;
        validScoresCount++;
      }
    });
  }
  
  // Calculate overall score as average of all criteria scores
  if (validScoresCount > 0) {
    feedback.overallScore = Math.round(scoreSum / validScoresCount);
    console.log(`Calculated overall score as ${feedback.overallScore} (average of ${validScoresCount} criteria)`);
  } else {
    feedback.overallScore = null;
  }
  
  return feedback;
}
