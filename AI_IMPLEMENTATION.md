# AI Deck Generation Implementation Summary

This document provides a complete overview of the AI deck generation feature implementation using Firebase Cloud Functions and OpenAI.

---

## What Was Implemented

### 1. Backend: Firebase Cloud Function (`functions/index.js`)

**Purpose**: Securely call OpenAI API without exposing API key to frontend

**Capabilities**:
- Validates user input (topic, card count)
- Calls OpenAI's `gpt-3.5-turbo` model
- Generates structured JSON flashcards
- Handles errors gracefully
- Returns flashcards in format: `[{front: string, back: string}]`

**Security**:
- OpenAI API key stored in Cloud Functions config (backend only)
- Never exposed to browser/frontend
- CORS-enabled for frontend access

**Cloud Functions Created**:
- **generateFlashcards** (POST) - Main AI generation function
- **healthCheck** (GET) - Health check endpoint

### 2. Frontend: Updated `/create-deck` Page

**Features**:
- **Manual Deck Creation** - Existing functionality preserved
  - Deck name input
  - Optional description
  - Clear button resets form without navigation
  
- **AI Deck Generation Section** - Now fully functional
  - Topic input field
  - Card count selector (5, 10, or 15)
  - Optional deck name field
  - "Generate Flashcards" button
  - Loading state during generation
  - Preview of generated cards in scrollable list
  - "Save AI Deck" button to persist to Firestore
  - "Generate Again" button to retry with same topic
  - Full error handling with user-friendly messages

**UI/UX**:
- Clean, focused layout
- Dark mode support with CSS variables
- Responsive preview cards
- Clear visual hierarchy

### 3. Frontend AI Service (`src/lib/aiGeneration.js`)

**Purpose**: Interface between React and Cloud Function

**Features**:
- Calls Cloud Function securely
- Transforms response format: `{front, back}` → `{question, answer}`
- Proper error handling and logging
- Supports both production and emulator URLs
- Environment variable configuration

### 4. Stats Page Dark Mode Fix (`src/pages/StatsPage.js`)

**Changes**:
- Replaced all hardcoded colors with CSS variables
- Updated styles:
  - Container background: `var(--background-color)`
  - Text colors: `var(--text-primary)`, `var(--text-secondary)`
  - Card backgrounds: `var(--card-color)`
  - Borders: `var(--border-color)`
- Fully respects light/dark mode toggle
- No more light areas in dark mode

### 5. Backend Dependencies (`functions/package.json`)

**Dependencies Added**:
- `firebase-functions@^4.3.0` - Cloud Functions framework
- `firebase-admin@^12.0.0` - Firestore admin access
- `openai@^4.20.0` - OpenAI Node.js library
- `cors@^2.8.5` - CORS support

**No changes to main `package.json`** - Cloud Functions have separate dependencies

---

## File Changes

### New Files Created
- `functions/package.json` - Cloud Functions configuration
- `functions/index.js` - Cloud Function implementations
- `AI_SETUP.md` - Complete setup guide
- `.env.local.example` - Environment variables template

### Modified Files
- `src/lib/aiGeneration.js` - Rewrote to call Cloud Function (secure)
- `src/pages/CreateDeckPage.js` - Already updated with AI UI (no additional changes needed)
- `src/pages/StatsPage.js` - Fixed dark mode with CSS variables
- **Main `package.json`** - NO CHANGES (dependencies remain stable)

### Unchanged Files
- All Dashboard, DeckPage, StudySession functionality preserved
- Firestore integration unchanged
- Authentication flow unchanged
- Card creation logic unchanged

---

## Setup Instructions (Required)

Follow these steps **exactly** to get AI generation working:

### Step 0: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Step 1: Set OpenAI API Key

```bash
firebase functions:config:set openai.api_key="sk-your-actual-api-key-here"
```

Get your API key from: https://platform.openai.com/account/api-keys

### Step 2: Install Cloud Functions Dependencies

```bash
cd functions
npm install
cd ..
```

This installs Node packages needed by Cloud Functions.

### Step 3: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

Output will show:
```
✓ functions[generateFlashcards] deployed
✓ functions[healthCheck] deployed
Function URL: https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards
```

### Step 4: Configure Frontend

Create `.env.local` in your project root:

```env
REACT_APP_GENERATE_FLASHCARDS_URL=https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards
```

Replace `REGION` and `PROJECT_ID` with values from Step 3 output.

### Step 5: Restart Dev Server

```bash
npm start
```

---

## Testing the Implementation

### Test Cloud Function (Direct)

```bash
curl -X POST \
  https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards \
  -H "Content-Type: application/json" \
  -d '{"topic": "Photosynthesis", "cardCount": 5}'
```

Expected response: Array of 5 flashcards with `{front, back}` properties

### Test in React App

1. Go to `http://localhost:3000/create-deck`
2. Scroll to "✨ Generate Deck with AI" section
3. Enter topic: "Photosynthesis"
4. Select card count: 10 cards
5. Click "Generate Flashcards"
6. Wait for generation (10-15 seconds)
7. Review the preview cards
8. Click "Save Deck"
9. Verify you're navigated to the new deck's card editor

---

## Environment Variables Required

### `.env.local` (Frontend)

```bash
# Required for AI generation
REACT_APP_GENERATE_FLASHCARDS_URL=https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards

# Optional: For local development
# REACT_APP_FIREBASE_FUNCTIONS_EMULATOR=http://localhost:5001/flashlearn-49cc8/us-central1/generateFlashcards
```

### Firebase Functions Config (Backend)

```bash
# Set using: firebase functions:config:set openai.api_key="..."
openai.api_key = sk-your-api-key-here
```

**IMPORTANT**: The OpenAI API key is **NOT** in `.env.local`. It's only in Cloud Functions config.

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│      React App (/create-deck)           │
│                                         │
│  - Topic input                          │
│  - Card count selector                  │
│  - Generate button                      │
│  - Preview cards                        │
│  - Save to Firestore                    │
└────────────────────┬────────────────────┘
                     │ (HTTP POST)
                     │ REACT_APP_GENERATE_FLASHCARDS_URL
                     ▼
┌─────────────────────────────────────────┐
│    Firebase Cloud Function              │
│  (generateFlashcards)                   │
│                                         │
│  - Validates input                      │
│  - Gets OpenAI API key from config      │
│  - Calls OpenAI API                     │
│  - Parses response                      │
│  - Returns JSON flashcards              │
└────────────────────┬────────────────────┘
                     │ (HTTP)
                     ▼
           ┌─────────────────┐
           │   OpenAI API    │
           │  (gpt-3.5-turbo)│
           └─────────────────┘

React Preview & Save
    │
    ▼
Firebase Firestore
(users/{uid}/decks/{deckId}/cards/)
```

---

## Data Flow

### Generate Flashcards

1. User enters topic: "Photosynthesis"
2. User selects card count: 10
3. User clicks "Generate Flashcards"
4. Frontend calls Cloud Function with: `{topic: "Photosynthesis", cardCount: 10}`
5. Cloud Function calls OpenAI API
6. OpenAI returns 10 flashcard pairs
7. Cloud Function returns: `{flashcards: [{front: "...", back: "..."}, ...]}`
8. Frontend displays preview list to user
9. User reviews and clicks "Save AI Deck"
10. Frontend creates deck in Firestore
11. Frontend creates 10 cards in Firestore
12. Frontend navigates to new deck's editor

### Card Data Structure

Generated cards are stored in Firestore with:
```json
{
  "front": "Question text",
  "back": "Answer text",
  "easeFactor": 2.5,
  "interval": 0,
  "repetitions": 0,
  "dueAt": "2024-03-13",
  "createdAt": "2024-03-13T...",
  "updatedAt": "2024-03-13T..."
}
```

The SM-2 fields (easeFactor, interval, etc.) are automatically initialized to default values.

---

## Important Security Notes

1. **API Key Protection**
   - OpenAI API key is NEVER in browser
   - Stored only in Cloud Functions config
   - Set via: `firebase functions:config:set openai.api_key="..."`

2. **Frontend Secrets**
   - Never put `REACT_APP_OPENAI_API_KEY` in `.env.local`
   - Frontend env vars are public (included in built bundle)
   - Only the Cloud Function URL goes in `.env.local`

3. **CORS Enabled**
   - Cloud Functions have CORS enabled for frontend access
   - Requests from `localhost:3000` and deployed domain work

---

## Troubleshooting

### "Cloud Function URL not configured"
- Confirm `.env.local` has `REACT_APP_GENERATE_FLASHCARDS_URL`
- Check URL format: `https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards`
- Restart dev server: `npm start`

### "OpenAI API key not configured"
- Run: `firebase functions:config:get` to verify it's set
- Re-run: `firebase functions:config:set openai.api_key="sk-..."`
- Redeploy: `firebase deploy --only functions`

### Generation times out or fails
- Check Cloud Function logs: `firebase functions:log`
- Verify OpenAI account has credits
- Try simpler topic first: "Science"

### API returns 401 error
- OpenAI API key is invalid or expired
- Check key at https://platform.openai.com/account/api-keys
- Re-set with correct key: `firebase functions:config:set openai.api_key="..."`

### Cards not saving after generation
- Check Firestore security rules allow writes to `users/{uid}/decks/{deckId}/cards`
- Verify user is logged in
- Check browser console for errors
- Check Firestore logs

---

## Performance & Costs

### Generation Speed
- Typical generation time: 10-20 seconds for 10 cards
- Depends on OpenAI API latency and complexity

### OpenAI Pricing
- `gpt-3.5-turbo`: ~$0.0005 per 1K input tokens
- Generating 10 flashcards: ~$0.01 per request
- Monitor at: https://platform.openai.com/account/usage

---

## Next Steps

1. **Immediate**: Follow setup instructions (Steps 0-5)
2. **Test**: Verify end-to-end in `/create-deck`
3. **Monitor**: Check Cloud Function logs and OpenAI usage
4. **Optimize**: Add rate limiting if needed
5. **Extend**: Consider adding PDF parsing, bulk generation, etc.

---

## Support

For detailed setup help, see: `AI_SETUP.md`

Key commands:
- `firebase functions:list` - See deployed functions and URLs
- `firebase functions:log` - View function execution logs
- `firebase functions:config:get` - See current config
- `firebase deploy --only functions` - Redeploy functions
- `npm run build` - Build React app (check for errors)

---
