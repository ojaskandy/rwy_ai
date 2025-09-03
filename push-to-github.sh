#!/bin/bash

# Auto-push to GitHub with timestamp and description
# Usage: ./push-to-github.sh "Short description of changes"

# Get current date and time
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Check if description was provided
if [ -z "$1" ]; then
  echo "Error: Please provide a short description of changes"
  echo "Usage: ./push-to-github.sh \"Short description of changes\""
  exit 1
fi

DESCRIPTION="$1"

# Add all changes
git add .

# Commit with timestamp and description
git commit -m "[$TIMESTAMP] $DESCRIPTION"

# Push to GitHub
git push

echo "Successfully pushed to GitHub at $TIMESTAMP"
echo "Description: $DESCRIPTION"
