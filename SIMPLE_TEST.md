# Simple Test - Verify Server Routes Work

## Step 1: Test Simple GET Endpoint

```bash
curl https://partial-ssg--burnesblogtemplate.netlify.app/api/test
```

**Expected**: JSON response with `success: true`

## Step 2: Test Simple POST Endpoint

```bash
curl -X POST https://partial-ssg--burnesblogtemplate.netlify.app/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Expected**: JSON response with `success: true` and the data you sent

## Step 3: If Simple Endpoints Work, Test Revalidate

```bash
curl -X POST https://partial-ssg--burnesblogtemplate.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'
```

## What This Tells Us

- If `/api/test` works → Server routes are working, issue is with revalidate endpoint
- If `/api/test` doesn't work → Server routes aren't being handled, issue is with redirect/config

