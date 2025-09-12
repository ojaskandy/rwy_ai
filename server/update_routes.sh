#!/bin/bash

# This script applies the necessary changes to make feedback more authentic and critical

# Find all instances of 'parsedFeedback = JSON.parse(cleanResponse);' and add the validation call after it
sed -i '' 's/parsedFeedback = JSON.parse(cleanResponse);/parsedFeedback = JSON.parse(cleanResponse);\n          \n          \/\/ Apply score validation to prevent inflated scores\n          parsedFeedback = validateScores(parsedFeedback);/g' routes.ts
