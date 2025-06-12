#!/bin/bash

# Sync Convex API types to app common lib
# Run this after generating API types with convex-helpers

SOURCE="api.ts"
TARGET="../app/common/lib/api.ts"

if [ -f "$SOURCE" ]; then
  echo "Syncing Convex API types from $SOURCE to $TARGET..."
  
  # Create target directory if it doesn't exist
  mkdir -p "$(dirname "$TARGET")"
  
  cp "$SOURCE" "$TARGET"
  echo "✅ API types synced successfully to app/common/lib/api.ts!"
  echo "📍 App can now import: import { api } from '../../../common/lib/api'"
else
  echo "❌ Source file $SOURCE not found. Please generate API types first:"
  echo "   npx convex-helpers ts-api-spec --output-file api.ts"
  exit 1
fi 