// Types shared with scoreValidator.ts
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
  overallScore?: number | null;
  sceneAnalysis?: SceneAnalysis[];
  pageantCriteria?: PageantCriterion[];
  nextSteps?: string[];
}
