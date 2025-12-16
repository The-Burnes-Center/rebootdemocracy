#!/bin/bash

TOKEN="A4z-ew_eQ1gCYAzJk0oQZl6-npLVYhI1"
BASE_URL="https://burnes-center.directus.app/revisions"

# Log file
LOG_FILE="test_revision_$(date +%Y%m%d_%H%M%S).log"

# Search for a slug across ALL revisions (not filtered by item ID)
SLUG="test-draft-version"

# Function to log and echo
log_and_echo() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Build query parameters with URL-encoded brackets
# %5B = [ and %5D = ]
# Filter by collection and use search parameter to find revisions containing the slug
# The search parameter searches across fields that contain the given search query
QUERY="filter%5Bcollection%5D%5B_eq%5D=reboot_democracy_blog"
# Use search parameter to find revisions containing the slug
QUERY="${QUERY}&search=${SLUG}"
QUERY="${QUERY}&fields%5B%5D=id"
QUERY="${QUERY}&fields%5B%5D=item"
QUERY="${QUERY}&fields%5B%5D=collection"
QUERY="${QUERY}&fields%5B%5D=data"
QUERY="${QUERY}&fields%5B%5D=delta"
QUERY="${QUERY}&sort%5B%5D=-id"
QUERY="${QUERY}&limit=500"

# Use single quotes to prevent any shell interpretation
FULL_URL="${BASE_URL}?${QUERY}"

log_and_echo "=========================================="
log_and_echo "Revision Lookup Test - $(date)"
log_and_echo "=========================================="
log_and_echo ""
log_and_echo "Searching ALL revisions in reboot_democracy_blog for slug: ${SLUG}"
log_and_echo "Using search parameter to find revisions containing the slug in any field"
log_and_echo "URL: ${FULL_URL}"
log_and_echo ""

RESPONSE=$(curl -s -X GET "${FULL_URL}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

log_and_echo "$RESPONSE"
log_and_echo ""

# Check if search returned results
if echo "$RESPONSE" | grep -q '"data":\[\]'; then
  log_and_echo "⚠️  Search returned empty array"
  log_and_echo "   Note: Directus 'search' parameter doesn't search inside JSON fields (data/delta)"
  log_and_echo "   This is expected - we need to fetch revisions and check manually"
  log_and_echo ""
  log_and_echo "---"
  log_and_echo "Verifying: Fetching recent revisions to check if slug exists in data/delta fields..."
  log_and_echo ""
  
  # First, try using Directus's native JSON querying (if available)
  # Based on PR #21158 and #15889, Directus may support json() function for filtering
  log_and_echo "Attempting native JSON query for slug '${SLUG}'..."
  log_and_echo ""
  
  # Try filtering by data.slug using json() function
  # Syntax: filter[json(data$.slug)][_eq]=slug-value
  JSON_FILTER_URL="${BASE_URL}?filter%5Bcollection%5D%5B_eq%5D=reboot_democracy_blog&filter%5Bjson(data%24.slug)%5D%5B_eq%5D=${SLUG}&fields%5B%5D=id&fields%5B%5D=item&limit=1"
  
  log_and_echo "Testing JSON query for data.slug..."
  JSON_RESPONSE=$(curl -s -X GET "${JSON_FILTER_URL}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  if echo "$JSON_RESPONSE" | grep -q '"data"'; then
    JSON_COUNT=$(echo "$JSON_RESPONSE" | node -e "
      try {
        const d = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
        console.log(d.data ? d.data.length : 0);
      } catch (e) {
        console.log(0);
      }
    " 2>/dev/null || echo "0")
    
    if [ "$JSON_COUNT" -gt 0 ]; then
      ITEM_ID=$(echo "$JSON_RESPONSE" | node -e "
        try {
          const d = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
          if (d.data && d.data[0]) {
            console.log(d.data[0].item);
          }
        } catch (e) {
          console.log('');
        }
      " 2>/dev/null || echo "")
      
      if [ -n "$ITEM_ID" ]; then
        log_and_echo "✓ SUCCESS: Found slug using native JSON query in data.slug!"
        log_and_echo "  Item ID: ${ITEM_ID}"
        log_and_echo ""
        log_and_echo "This proves Directus JSON querying works for revisions!"
        exit 0
      fi
    fi
  fi
  
  # Try filtering by delta.slug using json() function
  DELTA_FILTER_URL="${BASE_URL}?filter%5Bcollection%5D%5B_eq%5D=reboot_democracy_blog&filter%5Bjson(delta%24.slug)%5D%5B_eq%5D=${SLUG}&fields%5B%5D=id&fields%5B%5D=item&limit=1"
  
  log_and_echo "Testing JSON query for delta.slug..."
  DELTA_RESPONSE=$(curl -s -X GET "${DELTA_FILTER_URL}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  if echo "$DELTA_RESPONSE" | grep -q '"data"'; then
    DELTA_COUNT=$(echo "$DELTA_RESPONSE" | node -e "
      try {
        const d = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
        console.log(d.data ? d.data.length : 0);
      } catch (e) {
        console.log(0);
      }
    " 2>/dev/null || echo "0")
    
    if [ "$DELTA_COUNT" -gt 0 ]; then
      ITEM_ID=$(echo "$DELTA_RESPONSE" | node -e "
        try {
          const d = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
          if (d.data && d.data[0]) {
            console.log(d.data[0].item);
          }
        } catch (e) {
          console.log('');
        }
      " 2>/dev/null || echo "")
      
      if [ -n "$ITEM_ID" ]; then
        log_and_echo "✓ SUCCESS: Found slug using native JSON query in delta.slug!"
        log_and_echo "  Item ID: ${ITEM_ID}"
        log_and_echo ""
        log_and_echo "This proves Directus JSON querying works for revisions!"
        exit 0
      fi
    fi
  fi
  
  log_and_echo "Native JSON queries not available/working, falling back to manual pagination..."
  log_and_echo ""
  
  # Use pagination to search through ALL revisions in batches
  # This ensures we don't miss old slugs that might be far back in history
  BATCH_SIZE=100
  MAX_REVISIONS=50000  # Safety limit to prevent runaway queries
  OFFSET=0
  TOTAL_CHECKED=0
  FOUND_SLUG=false
  
  log_and_echo "Searching revisions using pagination (batch size: ${BATCH_SIZE}, max: ${MAX_REVISIONS})..."
  log_and_echo ""
  
  # Create temp file to accumulate all found items
  FOUND_ITEMS_TEMP=$(mktemp)
  echo "[]" > "$FOUND_ITEMS_TEMP"
  
  while [ $TOTAL_CHECKED -lt $MAX_REVISIONS ]; do
    # Build query with pagination
    QUERY_ALL="filter%5Bcollection%5D%5B_eq%5D=reboot_democracy_blog"
    QUERY_ALL="${QUERY_ALL}&fields%5B%5D=id"
    QUERY_ALL="${QUERY_ALL}&fields%5B%5D=item"
    QUERY_ALL="${QUERY_ALL}&fields%5B%5D=data"
    QUERY_ALL="${QUERY_ALL}&fields%5B%5D=delta"
    QUERY_ALL="${QUERY_ALL}&sort%5B%5D=-id"
    QUERY_ALL="${QUERY_ALL}&limit=${BATCH_SIZE}"
    QUERY_ALL="${QUERY_ALL}&offset=${OFFSET}"
    
    FULL_URL_ALL="${BASE_URL}?${QUERY_ALL}"
    
    if [ $OFFSET -eq 0 ]; then
      log_and_echo "Fetching first batch (offset: ${OFFSET}, limit: ${BATCH_SIZE})..."
    else
      log_and_echo "Fetching next batch (offset: ${OFFSET}, limit: ${BATCH_SIZE}, total checked: ${TOTAL_CHECKED})..."
    fi
    
    BATCH_RESPONSE=$(curl -s -X GET "${FULL_URL_ALL}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json")
    
    # Check if response is valid
    if [ -z "$BATCH_RESPONSE" ] || ! echo "$BATCH_RESPONSE" | grep -q '"data"'; then
      log_and_echo "⚠️  Invalid response or no more revisions (offset: ${OFFSET})"
      break
    fi
    
    # Log response size
    RESPONSE_SIZE=$(echo "$BATCH_RESPONSE" | wc -c | tr -d ' ')
    log_and_echo "  Response: ${RESPONSE_SIZE} bytes"
    
    # Use Node.js to parse this batch and check for the slug
    BATCH_TEMP=$(mktemp)
    echo "$BATCH_RESPONSE" > "$BATCH_TEMP"
    
    BATCH_FOUND=$(node -e "
    const fs = require('fs');
    
    // Same sanitization function as above
    function sanitizeJson(jsonString) {
      let result = '';
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        
        if (escapeNext) {
          result += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\\\') {
          escapeNext = true;
          result += char;
          continue;
        }
        
        if (char === '\"') {
          inString = !inString;
          result += char;
          continue;
        }
        
        if (inString && /[\\x00-\\x1F\\x7F]/.test(char)) {
          const code = char.charCodeAt(0);
          if (code === 9) result += '\\\\t';
          else if (code === 10) result += '\\\\n';
          else if (code === 13) result += '\\\\r';
          else result += '\\\\u' + code.toString(16).padStart(4, '0');
        } else {
          result += char;
        }
      }
      
      return result;
    }
    
    try {
      let jsonInput = fs.readFileSync('$BATCH_TEMP', 'utf8');
      let response;
      try {
        response = JSON.parse(jsonInput);
      } catch (e) {
        // Try sanitizing if initial parse fails
        const sanitized = sanitizeJson(jsonInput);
        response = JSON.parse(sanitized);
      }
      const revisions = response.data || [];
      const foundItems = [];
      
      for (const revision of revisions) {
        try {
          // Check data.slug field (full item state at revision time)
          if (revision.data) {
            const data = typeof revision.data === 'string' ? JSON.parse(revision.data) : revision.data;
            if (data && typeof data === 'object' && data.slug === '${SLUG}') {
              foundItems.push({ itemId: revision.item, revisionId: revision.id, field: 'data.slug' });
            }
          }
          
          // Check delta.slug field (changed fields only)
          if (revision.delta) {
            const delta = typeof revision.delta === 'string' ? JSON.parse(revision.delta) : revision.delta;
            if (delta && typeof delta === 'object' && delta.slug === '${SLUG}') {
              foundItems.push({ itemId: revision.item, revisionId: revision.id, field: 'delta.slug' });
            }
          }
        } catch (e) {
          // Skip revisions with parse errors
        }
      }
      
      console.log(JSON.stringify({ found: foundItems, count: revisions.length }));
    } catch (e) {
      console.log(JSON.stringify({ found: [], count: 0 }));
    }
  " 2>/dev/null)
  
    rm -f "$BATCH_TEMP"
    
    # Extract batch info
    BATCH_COUNT=$(echo "$BATCH_FOUND" | node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(d.count || 0);" 2>/dev/null || echo "0")
    BATCH_ITEMS=$(echo "$BATCH_FOUND" | node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(JSON.stringify(d.found || []));" 2>/dev/null || echo "[]")
    
    TOTAL_CHECKED=$((TOTAL_CHECKED + BATCH_COUNT))
    
    # If we found the slug in this batch, merge with accumulated results
    if [ "$BATCH_ITEMS" != "[]" ] && [ -n "$BATCH_ITEMS" ]; then
      FOUND_SLUG=true
      # Merge with existing found items
      echo "$BATCH_ITEMS" | node -e "
        const batch = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
        const existing = JSON.parse(require('fs').readFileSync('$FOUND_ITEMS_TEMP', 'utf-8'));
        const merged = [...existing, ...batch];
        console.log(JSON.stringify(merged));
      " > "$FOUND_ITEMS_TEMP" 2>/dev/null
      log_and_echo "  ✓ Found slug in this batch! (checked ${TOTAL_CHECKED} revisions so far)"
    else
      log_and_echo "  No match in this batch (${BATCH_COUNT} revisions, total checked: ${TOTAL_CHECKED})"
    fi
    
    # If we got fewer revisions than requested, we've reached the end
    if [ "$BATCH_COUNT" -lt "$BATCH_SIZE" ]; then
      log_and_echo "  Reached end of revisions (got ${BATCH_COUNT}, expected ${BATCH_SIZE})"
      break
    fi
    
    # If we found the slug, stop searching (we only need the first match)
    if [ "$FOUND_SLUG" = true ]; then
      log_and_echo "  ✓ Slug found! Stopping search early."
      break
    fi
    
    # Move to next batch
    OFFSET=$((OFFSET + BATCH_SIZE))
  done
  
  log_and_echo ""
  log_and_echo "Pagination complete. Total revisions checked: ${TOTAL_CHECKED}"
  
  if [ $TOTAL_CHECKED -ge $MAX_REVISIONS ]; then
    log_and_echo "⚠️  Reached safety limit (${MAX_REVISIONS} revisions)"
  fi
  
  log_and_echo ""
  
  # Read accumulated found items
  FOUND_ITEMS=$(cat "$FOUND_ITEMS_TEMP" 2>/dev/null || echo "[]")
  rm -f "$FOUND_ITEMS_TEMP"
  
  if [ -n "$FOUND_ITEMS" ] && [ "$FOUND_ITEMS" != "[]" ]; then
    log_and_echo "✓ CONFIRMED: Slug '${SLUG}' EXISTS in revisions!"
    log_and_echo "   This proves search doesn't work for JSON fields"
    log_and_echo ""
    log_and_echo "   Item IDs with this slug:"
    echo "$FOUND_ITEMS" | node -e "
      const items = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
      const uniqueItems = [...new Set(items.map(i => i.itemId))];
      uniqueItems.forEach(itemId => {
        const matches = items.filter(i => i.itemId === itemId);
        const fields = matches.map(m => m.field).join(', ');
        console.log(\"     → Item ID: \" + itemId + \" (found in: \" + fields + \")\");
      });
    " 2>/dev/null || echo "$FOUND_ITEMS"
  else
    log_and_echo "✗ Slug '${SLUG}' not found in revisions"
    log_and_echo "   (Checked ${REVISION_NUM} revisions by parsing JSON data.slug and delta.slug fields)"
    log_and_echo "   (Slug might not exist in revision history)"
  fi
else
  log_and_echo "✓ Search found results - parsing JSON to check data.slug and delta.slug..."
  log_and_echo ""
  
  # Parse JSON properly to check data.slug and delta.slug
  FOUND_ITEMS=$(echo "$RESPONSE" | node -e "
    let jsonInput = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { jsonInput += chunk; });
    process.stdin.on('end', () => {
      try {
        const response = JSON.parse(jsonInput);
        const revisions = response.data || [];
        const foundItems = [];
        
        for (const revision of revisions) {
          try {
            // Check data.slug field (full item state at revision time)
            if (revision.data) {
              const data = typeof revision.data === 'string' ? JSON.parse(revision.data) : revision.data;
              if (data && typeof data === 'object' && data.slug === '${SLUG}') {
                foundItems.push({ itemId: revision.item, revisionId: revision.id, field: 'data.slug' });
              }
            }
            
            // Check delta.slug field (changed fields only)
            if (revision.delta) {
              const delta = typeof revision.delta === 'string' ? JSON.parse(revision.delta) : revision.delta;
              if (delta && typeof delta === 'object' && delta.slug === '${SLUG}') {
                foundItems.push({ itemId: revision.item, revisionId: revision.id, field: 'delta.slug' });
              }
            }
          } catch (e) {
            // Skip revisions with parse errors
          }
        }
        
        console.log(JSON.stringify(foundItems));
      } catch (e) {
        console.log('[]');
      }
    });
  " 2>/dev/null)
  
  if [ -n "$FOUND_ITEMS" ] && [ "$FOUND_ITEMS" != "[]" ]; then
    log_and_echo "✓ Found exact slug match in search results!"
    echo "$FOUND_ITEMS" | node -e "
      const items = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
      const uniqueItems = [...new Set(items.map(i => i.itemId))];
      uniqueItems.forEach(itemId => {
        const matches = items.filter(i => i.itemId === itemId);
        const fields = matches.map(m => m.field).join(', ');
        console.log(\"  → Item ID: \" + itemId + \" (found in: \" + fields + \")\");
      });
    " 2>/dev/null || echo "$FOUND_ITEMS"
  else
    log_and_echo "⚠️  Search found results but no exact slug match in data.slug or delta.slug"
  fi
fi

log_and_echo ""
log_and_echo "=========================================="
log_and_echo "Test completed. Log saved to: ${LOG_FILE}"
log_and_echo "=========================================="

# Note: This script requires Node.js to properly parse JSON and check data.slug/delta.slug fields
# If Node.js is not available, the script will fall back to basic grep (less accurate)