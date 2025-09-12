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
export function validateScores(feedback: StructuredFeedback): StructuredFeedback {
  if (!feedback || !feedback.pageantCriteria || !Array.isArray(feedback.pageantCriteria)) {
    return feedback;
  }
  
  // Track suspiciously high scores
  let highScoreCount = 0;
  const totalCriteria = feedback.pageantCriteria.length;
  
  // Count criteria with suspiciously high scores (above 80)
  feedback.pageantCriteria.forEach(criterion => {
    if (criterion.score && criterion.score > 80) {
      highScoreCount++;
    }
  });
  
  // If more than 50% of scores are suspiciously high, scale them down
  if (highScoreCount > totalCriteria / 2) {
    console.warn('Detected inflated scores - applying correction factor');
    // Scale down all scores by 25%
    feedback.pageantCriteria = feedback.pageantCriteria.map(criterion => {
      if (criterion.score) {
        // Apply a scaling factor of 0.75 to reduce scores
        return {
          ...criterion,
          score: Math.round(criterion.score * 0.75)
        };
      }
      return criterion;
    });
    
    // Also scale down overall score if present
    if (feedback.overallScore) {
      feedback.overallScore = Math.round(feedback.overallScore * 0.75);
    }
  }
  
  return feedback;
}
