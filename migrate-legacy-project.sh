#!/bin/bash

# Migration Script: Legacy Project to Multi-Project Structure
echo "🔄 Migrating Legacy Project to Multi-Project Structure"
echo "======================================================"

# Configuration
WORK_DIR="/Users/malo/Sites/video-editor/playground/var/work"
LEGACY_PROJECT_NAME="Legacy Project"
LEGACY_PROJECT_SLUG="legacy-project"
SERVER_URL="http://localhost:3000"

echo "📁 Current structure:"
echo "   Legacy dailies: $WORK_DIR/dailies/"
echo "   Legacy thumbnails: $WORK_DIR/thumbnails/"
echo "   Legacy database: $WORK_DIR/database.json"

# Check if server is running
echo ""
echo "🔍 Checking server status..."
if ! curl -s "$SERVER_URL/health" > /dev/null; then
    echo "❌ Server is not running. Please start the server first:"
    echo "   node run.js &"
    exit 1
fi
echo "✅ Server is running"

# Step 1: Create the legacy project
echo ""
echo "📦 Step 1: Creating legacy project..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/projects" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$LEGACY_PROJECT_NAME\", \"slug\": \"$LEGACY_PROJECT_SLUG\"}")

if echo "$RESPONSE" | grep -q '"success": true'; then
    echo "✅ Legacy project created successfully"
else
    if echo "$RESPONSE" | grep -q "already exists"; then
        echo "ℹ️  Legacy project already exists, continuing..."
    else
        echo "❌ Failed to create legacy project:"
        echo "$RESPONSE"
        exit 1
    fi
fi

# Step 2: Move video files
echo ""
echo "📹 Step 2: Moving video files..."
LEGACY_DAILIES_DIR="$WORK_DIR/$LEGACY_PROJECT_SLUG/dailies"

if [ -d "$WORK_DIR/dailies" ] && [ "$(ls -A $WORK_DIR/dailies)" ]; then
    echo "   Moving videos from $WORK_DIR/dailies/ to $LEGACY_DAILIES_DIR/"
    
    # Count videos before moving
    VIDEO_COUNT=$(ls "$WORK_DIR/dailies"/*.MP4 2>/dev/null | wc -l | tr -d ' ')
    echo "   Found $VIDEO_COUNT video files to migrate"
    
    # Move all video files
    mv "$WORK_DIR/dailies"/*.MP4 "$LEGACY_DAILIES_DIR/" 2>/dev/null
    
    echo "✅ Videos moved successfully"
else
    echo "ℹ️  No videos found in legacy dailies folder"
fi

# Step 3: Move thumbnail files
echo ""
echo "🖼️  Step 3: Moving thumbnail files..."
LEGACY_THUMBNAILS_DIR="$WORK_DIR/$LEGACY_PROJECT_SLUG/thumbnails"

if [ -d "$WORK_DIR/thumbnails" ] && [ "$(ls -A $WORK_DIR/thumbnails)" ]; then
    echo "   Moving thumbnails from $WORK_DIR/thumbnails/ to $LEGACY_THUMBNAILS_DIR/"
    
    # Count thumbnails before moving
    THUMB_COUNT=$(ls "$WORK_DIR/thumbnails"/*.jpg 2>/dev/null | wc -l | tr -d ' ')
    echo "   Found $THUMB_COUNT thumbnail files to migrate"
    
    # Move all thumbnail files
    if [ $THUMB_COUNT -gt 0 ]; then
        mv "$WORK_DIR/thumbnails"/*.jpg "$LEGACY_THUMBNAILS_DIR/" 2>/dev/null
        echo "✅ Thumbnails moved successfully"
    else
        echo "ℹ️  No thumbnails found to migrate"
    fi
else
    echo "ℹ️  No thumbnails found in legacy thumbnails folder"
fi

# Step 4: Move database file
echo ""
echo "📊 Step 4: Moving database file..."
LEGACY_DATABASE_PATH="$WORK_DIR/$LEGACY_PROJECT_SLUG/database.json"

if [ -f "$WORK_DIR/database.json" ]; then
    echo "   Moving database from $WORK_DIR/database.json to $LEGACY_DATABASE_PATH"
    
    # Backup the existing empty database
    if [ -f "$LEGACY_DATABASE_PATH" ]; then
        mv "$LEGACY_DATABASE_PATH" "$LEGACY_DATABASE_PATH.backup"
    fi
    
    # Move the legacy database
    mv "$WORK_DIR/database.json" "$LEGACY_DATABASE_PATH"
    echo "✅ Database moved successfully"
else
    echo "ℹ️  No legacy database file found"
fi

# Step 5: Clean up empty legacy directories
echo ""
echo "🧹 Step 5: Cleaning up empty legacy directories..."

if [ -d "$WORK_DIR/dailies" ] && [ ! "$(ls -A $WORK_DIR/dailies)" ]; then
    rmdir "$WORK_DIR/dailies"
    echo "✅ Removed empty legacy dailies directory"
fi

if [ -d "$WORK_DIR/thumbnails" ] && [ ! "$(ls -A $WORK_DIR/thumbnails)" ]; then
    rmdir "$WORK_DIR/thumbnails"
    echo "✅ Removed empty legacy thumbnails directory"
fi

# Step 6: Refresh the project database
echo ""
echo "🔄 Step 6: Refreshing project database..."
REFRESH_RESPONSE=$(curl -s -X POST "$SERVER_URL/projects/$LEGACY_PROJECT_SLUG/refresh")

if echo "$REFRESH_RESPONSE" | grep -q '"success": true'; then
    echo "✅ Project database refreshed successfully"
else
    echo "⚠️  Warning: Failed to refresh project database automatically"
    echo "   You may need to restart the server for changes to take effect"
fi

# Step 7: Verification
echo ""
echo "✅ Step 7: Verification"
echo "======================"

# Get project info
PROJECT_INFO=$(curl -s "$SERVER_URL/projects/$LEGACY_PROJECT_SLUG")
echo "📋 Project created successfully:"
echo "$PROJECT_INFO" | jq -r '.project | "   Name: \(.name)\n   Slug: \(.slug)\n   Videos: \(.stats.videos)\n   Thumbnails: \(.stats.thumbnails)\n   Database Entries: \(.stats.databaseEntries)"'

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📁 New structure:"
echo "   Project: $WORK_DIR/$LEGACY_PROJECT_SLUG/"
echo "   ├── dailies/         (migrated videos)"
echo "   ├── thumbnails/      (migrated thumbnails)"
echo "   ├── database.json    (migrated database)"
echo "   └── preferences.json (project settings)"
echo ""
echo "🔗 API endpoints for legacy project:"
echo "   GET  $SERVER_URL/projects/$LEGACY_PROJECT_SLUG"
echo "   GET  $SERVER_URL/projects/$LEGACY_PROJECT_SLUG/videos"
echo "   GET  $SERVER_URL/projects/$LEGACY_PROJECT_SLUG/project"
echo ""
echo "💡 Next steps:"
echo "   1. Test the migrated project: curl $SERVER_URL/projects/$LEGACY_PROJECT_SLUG/videos"
echo "   2. Update frontend to use project-specific endpoints"
echo "   3. Consider restarting the server to ensure all changes are loaded"