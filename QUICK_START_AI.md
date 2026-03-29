# Quick Start Guide - AI Deck Generation

**Goal**: Generate flashcards using AI in 5 minutes

---

## Prerequisites

1. `firebase-tools` installed: `npm install -g firebase-tools`
2. OpenAI API key ready: https://platform.openai.com/account/api-keys
3. You're logged into Firebase: `firebase login`

---

## 5-Minute Setup

### 1. Set API Key (1 minute)

```bash
firebase functions:config:set openai.api_key="sk-PASTE_YOUR_KEY_HERE"
```

### 2. Install Dependencies (1 minute)

```bash
cd functions
npm install
cd ..
```

### 3. Deploy Functions (2 minutes)

```bash
firebase deploy --only functions
```

**Copy the Cloud Function URL** from the output:
```
Function URL: https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards
```

### 4. Configure Frontend (30 seconds)

Create `.env.local`:
```env
REACT_APP_GENERATE_FLASHCARDS_URL=https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards
```

### 5. Restart App (30 seconds)

```bash
npm start
```

Go to: http://localhost:3000/create-deck

---

## Test It

1. Scroll to "✨ Generate Deck with AI"
2. Enter topic: "Python Programming"
3. Click "Generate Flashcards"
4. Wait ~15 seconds for generation
5. Click "Save Deck"
6. Done! Cards are now in your study deck

---

## If It Doesn't Work

### Check function deployed
```bash
firebase functions:list
```

### Check API key is set
```bash
firebase functions:config:get
```

### See error logs
```bash
firebase functions:log
```

### Test directly
```bash
curl -X POST https://YOUR_FUNCTION_URL/generateFlashcards \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test","cardCount":5}'
```

---

## That's It!

Your AI deck generation is now live. Read `AI_IMPLEMENTATION.md` for detailed information.

---
