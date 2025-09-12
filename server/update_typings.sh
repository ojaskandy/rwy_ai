#!/bin/bash

# This script updates the StructuredFeedback interface in routes.ts

# First, locate the interface definition
interface_start_line=$(grep -n "interface StructuredFeedback {" routes.ts | cut -d: -f1)

if [ -z "$interface_start_line" ]; then
  echo "StructuredFeedback interface not found in routes.ts"
  
  # Add the interface to the top of the file under the imports
  import_end_line=$(grep -n "import { validateScores } from \"./scoreValidator\";" routes.ts | cut -d: -f1)
  
  # Assuming the interface doesn't exist in the file, insert it after the imports
  if [ ! -z "$import_end_line" ]; then
    sed -i '' "${import_end_line}a\\
\\
// Types shared with scoreValidator.ts\\
interface PageantCriterion {\\
  category: string;\\
  score: number | null;\\
  feedback: string;\\
}\\
\\
interface SceneAnalysis {\\
  scene: string;\\
  strengths: string[];\\
  improvements: string[];\\
}\\
\\
interface StructuredFeedback {\\
  overview: string;\\
  overallScore?: number | null;\\
  sceneAnalysis?: SceneAnalysis[];\\
  pageantCriteria?: PageantCriterion[];\\
  nextSteps?: string[];\\
}\\
" routes.ts
  fi
else
  # If interface exists, update the overallScore type to include null
  line_to_update=$(grep -n "overallScore?" routes.ts | cut -d: -f1)
  
  if [ ! -z "$line_to_update" ]; then
    sed -i '' "${line_to_update}s/overallScore?: number;/overallScore?: number | null;/" routes.ts
  fi
fi

echo "TypeScript definitions updated"
