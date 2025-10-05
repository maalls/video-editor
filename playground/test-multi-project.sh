#!/bin/bash

# Multi-Project Video Editor Test Script
echo "🧪 Testing Multi-Project Video Editor API"
echo "=========================================="

# Test server health
echo "1. Testing server health..."
curl -s http://localhost:3000/health | jq

echo -e "\n2. Creating test projects..."

# Create first project
echo "Creating 'Demo Project'..."
curl -s -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Demo Project"}' | jq

# Create second project with custom slug
echo "Creating 'Client Work' with custom slug..."
curl -s -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Client Work", "slug": "client-work-2024"}' | jq

echo -e "\n3. Listing all projects..."
curl -s http://localhost:3000/projects | jq

echo -e "\n4. Getting project details..."
curl -s http://localhost:3000/projects/demo-project | jq

echo -e "\n5. Testing project videos (should be empty initially)..."
curl -s http://localhost:3000/projects/demo-project/videos | jq

echo -e "\n6. Testing legacy endpoints (should still work)..."
curl -s http://localhost:3000/videos | jq '.[:2]'  # Show first 2 videos

echo -e "\n✅ Multi-project API test completed!"