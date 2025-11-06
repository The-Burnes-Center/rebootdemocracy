#!/bin/bash
# Simple test script

echo "Testing GET endpoint:"
curl -s https://partial-ssg--burnesblogtemplate.netlify.app/api/test | jq . || echo "Failed"

echo -e "\n\nTesting POST endpoint:"
curl -s -X POST https://partial-ssg--burnesblogtemplate.netlify.app/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' | jq . || echo "Failed"

echo -e "\n\nTesting revalidate endpoint:"
curl -s -X POST https://partial-ssg--burnesblogtemplate.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}' | jq . || echo "Failed"
