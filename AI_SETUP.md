# AI Deck Generation Setup Guide

This guide walks you through setting up Firebase Cloud Functions with OpenAI integration for FlashLearn's AI-powered deck generation feature.

## Architecture Overview

```
React Frontend
    ↓ (fetch POST)
Firebase Cloud Function (generateFlashcards)
    ↓ (API call)
OpenAI API (gpt-3.5-turbo)
    ↓ (returns JSON)
Firestore
```

**Key Security Point**: The OpenAI API key is **never** exposed to the frontend. It lives only in the Cloud Function backend.

---

## Prerequisites

1. **Google Cloud SDK** - Install from https://cloud.google.com/sdk/docs/install
2. **Node.js 18+** - Install from https://nodejs.org
3. **Firebase CLI** - Install with `npm install -g firebase-tools`
4. **OpenAI API Key** - Get from https://platform.openai.com/account/api-keys
5. **Existing Google Cloud Project** - The one associated with your Firebase project (flashlearn-49cc8)

---

## Step 1: Authenticate Firebase CLI

```bash
firebase login
```

This will open a browser window to authenticate.

---

## Step 2: Set OpenAI API Key in Cloud Functions

Set the API key as an environment variable for your Cloud Functions:

```bash
firebase functions:config:set openai.api_key="sk-your-actual-api-key-here"
```

To verify it's set:
```bash
firebase functions:config:get
```

You should see:
```json
{
  "openai": {
    "api_key": "sk-..."
  }
}
```

---

## Step 3: Install Dependencies

Install dependencies for Cloud Functions:

```bash
cd functions
npm install
cd ..
```

This will install:
- `firebase-functions` - Cloud Functions framework
- `firebase-admin` - Admin SDK
- `openai` - OpenAI Node.js library
- `cors` - CORS support for your functions

---

## Step 4: Configure Frontend Environment Variables

Create or edit `.env.local` in your project root:

```bash
# For production (deployed Cloud Function)
REACT_APP_GENERATE_FLASHCARDS_URL=https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards

# For local development (Firebase emulator)
# REACT_APP_FIREBASE_FUNCTIONS_EMULATOR=http://localhost:5001/flashlearn-49cc8/REGION/generateFlashcards
```

Replace:
- `REGION` - Your Firebase region (default: `us-central1`)
- `PROJECT_ID` - Your Firebase project ID (`flashlearn-49cc8`)

**To find your Cloud Function URL after deployment:**
```bash
firebase functions:list
```

---

## Step 5: Deploy Cloud Functions

Deploy the functions to Firebase:

```bash
firebase deploy --only functions
```

You'll see output like:
```
✓ functions[generateFlashcards] deployed
✓ functions[healthCheck] deployed
```

Copy the function URL from the output and update your `.env.local` file.

---

## Step 6: Test the Setup

### Test Cloud Function directly (without frontend):

```bash
curl -X POST \
  https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Photosynthesis",
    "cardCount": 5
  }'
```

Expected response:
```json
{
  "success": true,
  "flashcards": [
    {
      "front": "What is photosynthesis?",
      "back": "Photosynthesis is the process by which plants convert light energy..."
    }
  ],
  "count": 5
}
```

### Test in React App:

1. Start your React dev server: `npm start`
2. Go to `/create-deck`
3. Scroll to "Generate Deck with AI" section
4. Enter topic: "Photosynthesis"
5. Click "✨ Generate Flashcards"
6. You should see a loading state, then 5-10 generated flashcards

---

## Local Development (Optional)

If you want to test Cloud Functions locally before deploying:

### Install Emulator

```bash
firebase emulators:start --only functions
```

This starts the Firebase emulator on `http://localhost:5001`

### Update .env.local for local testing

```bash
REACT_APP_FIREBASE_FUNCTIONS_EMULATOR=http://localhost:5001/flashlearn-49cc8/us-central1
```

Then start your React app and test the AI generation locally without deploying to production.

---

## Files Created/Modified

### New Files
- `functions/package.json` - Cloud Functions dependencies
- `functions/index.js` - Cloud Function implementations
- `src/lib/aiGeneration.js` - Frontend AI interface (updated)

### Modified Files
- `src/pages/CreateDeckPage.js` - Added AI generation UI (already done)
- `src/pages/StatsPage.js` - Fixed dark mode (already done)

### Environment Files (to create)
- `.env.local` - Frontend environment variables

---

## Troubleshooting

### "OpenAI API key not configured"
- Verify: `firebase functions:config:get`
- Make sure your API key starts with `sk-`
- Re-run: `firebase functions:config:set openai.api_key="sk-..."`
- Redeploy: `firebase deploy --only functions`

### "Cloud Function URL not configured"
- Update `.env.local` with the correct function URL
- From deployment output or: `firebase functions:list`
- Restart your React dev server after changing `.env.local`

### CORS Errors
- The Cloud Function is set up with CORS enabled
- Check browser console for the actual error message
- Verify your `REACT_APP_GENERATE_FLASHCARDS_URL` is correct

### "Failed to generate flashcards"
- Check Cloud Function logs: `firebase functions:log`
- Verify OpenAI API key has credits available
- Try a simpler topic like "Science"

### Cards not saving to Firestore
- Check browser console for errors
- Verify user is logged in
- Check Firestore security rules allow writing cards
- Check deck was created successfully first

---

## Production Checklist

Before going live with AI features:

- [ ] OpenAI API key is set in Cloud Functions config (not in .env.local)
- [ ] Cloud Functions are deployed: `firebase deploy --only functions`
- [ ] `.env.local` has correct production Cloud Function URL
- [ ] Tested AI generation end-to-end on deployed function
- [ ] Firestore security rules allow card creation
- [ ] Error handling is visible to users
- [ ] Rate limiting is considered (OpenAI has usage limits)

---

## API Cost Estimates

OpenAI pricing (as of March 2024):
- `gpt-3.5-turbo`: ~$0.0005 per 1K input tokens, $0.0015 per 1K output tokens
- Generating 10 flashcards: ~$0.01 per request
- 100 users/day generating 10 cards: ~$1/day

Monitor your OpenAI usage at https://platform.openai.com/account/usage

---

## Next Steps

1. Run through all the steps above
2. Test AI generation in your React app
3. Try creating and saving an AI-generated deck
4. Verify cards appear in Firestore under `users/{uid}/decks/{deckId}/cards/`

---

## Support

If you encounter issues:

1. Check Cloud Function logs: `firebase functions:log`
2. Check browser console (DevTools → Console)
3. Verify all environment variables are set
4. Verify OpenAI API key is valid and has credits
5. Make sure you're using the correct Firebase project

---

## Extending the Feature

Once the basic implementation is working, you can:

- Add PDF parsing to `/create-deck` (update Cloud Function)
- Support different AI models (Claude, Gemini)
- Add batch processing for large decks
- Save generation history
- Rate limit per user
- Add cost tracking per user

---
