# 🚀 AI Generation Setup Guide (Final Step)

> **Status:** The AI deck generation feature is fully implemented and ready to use. This guide walks you through the one-time setup required.

---

## ⚡ Quick Start (5 minutes)

### Step 1: Deploy Cloud Functions

In your terminal, from the FlashLearner project root:

```bash
firebase deploy --only functions
```

**Expected Output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Function details saved at: .firebase/functions/source_manifest_hash
Functions deployed: generateFlashcards
```

If you see errors about OpenAI key, that's expected for now. The function still deploys, but will use the key from Cloud Functions environment.

### Step 2: Get Your Cloud Function URL

After deployment succeeds, run:

```bash
firebase functions:list
```

**Expected Output:**
```
Functions in project flashlearner-12345:
FUNCTIONS	STATUS		TRIGGER
generateFlashcards	OK	https://us-central1-flashlearner-12345.cloudfunctions.net/generateFlashcards
```

**Copy the URL.** It should look like:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/generateFlashcards
```

### Step 3: Set .env Variable

Open the `.env` file in your project root:

```
.env
├── REACT_APP_FIREBASE_API_KEY=...
├── REACT_APP_FIREBASE_AUTH_DOMAIN=...
├── ...
└── REACT_APP_GENERATE_FLASHCARDS_URL=your_cloud_function_url  ← UPDATE THIS
```

Replace `your_cloud_function_url` with your actual URL from Step 2:

```
# Before:
REACT_APP_GENERATE_FLASHCARDS_URL=your_cloud_function_url

# After (example):
REACT_APP_GENERATE_FLASHCARDS_URL=https://us-central1-flashlearner-12345.cloudfunctions.net/generateFlashcards
```

### Step 4: Restart React

```bash
# Stop the running server: Ctrl+C

# Start it again:
npm start
```

**That's it!** 🎉

---

## 🧪 Test the Feature

### Test AI Generation:

1. Go to Dashboard
2. Click "✨ Generate with AI" button
3. Enter a topic (e.g., "Spanish vocabulary")
4. Select number of cards (5, 10, or 15)
5. Click "Generate Flashcards"
6. Wait a few seconds for cards to be generated
7. Review preview of Q&A pairs
8. Click "💾 Save Deck"
9. You should be taken to your new deck

**Success!** 🎓

---

## ❓ Troubleshooting

### Problem: "AI Generation Setup Required" error
**Solution:**
- Verify `REACT_APP_GENERATE_FLASHCARDS_URL` is set in `.env` file
- Did you restart React after editing `.env`? (Run `npm start` again)
- Check that Cloud Function URL is correct (test by visiting URL in browser, you should see a 403 error if configured correctly)

### Problem: "Error calling OpenAI"
**Solution:**
- Verify your OpenAI API key is set in Cloud Functions:
  ```bash
  firebase functions:config:get
  ```
- If key is missing, set it:
  ```bash
  firebase functions:config:set openai.apikey="sk-..."
  firebase deploy --only functions
  ```
- Restart React after update

### Problem: Generation produces no cards or malformed cards
**Solution:**
- Check Cloud Functions logs:
  ```bash
  firebase functions:log
  ```
- Try again with a simpler topic (e.g., "Numbers 1-10")
- Make sure OpenAI API account has credits

### Problem: "Function not found" or 404 error
**Solution:**
- Did you actually run `firebase deploy --only functions`?
- Verify function deployed:
  ```bash
  firebase functions:list
  ```
- Copy the exact URL from the list

---

## 🔑 Environment Variables Explained

Your `.env` file now contains:

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase authentication | `AIzaSyCIxe...` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `flashlearner.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID | `flashlearner-12345` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase storage | `flashlearner.appspot.com` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging | `123456789` |
| `REACT_APP_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc...` |
| `REACT_APP_GENERATE_FLASHCARDS_URL` | Cloud Function endpoint | `https://us-central1-....cloudfunctions.net/generateFlashcards` |

The last one (GENERATE_FLASHCARDS_URL) is the only one you need to add/modify for AI generation.

---

## 📊 How It Works (Behind the Scenes)

```
User Interface (React)
        ↓
    User clicks "✨ Generate with AI" button
        ↓
  CreateDeckPage.js receives topic
        ↓
  Calls generateAiDeck(topic, cardCount)
        ↓
  aiGeneration.js uses REACT_APP_GENERATE_FLASHCARDS_URL
        ↓
  Sends POST request to Cloud Function
        ↓
  Cloud Function (functions/index.js)
        ↓
  Calls OpenAI GPT-3.5-Turbo API
        ↓
  OpenAI generates flashcards
        ↓
  Response sent back to React
        ↓
  CreateDeckPage.js shows preview
        ↓
  User clicks "💾 Save Deck"
        ↓
  Firestore creates deck + adds cards
        ↓
  Success! User navigates to new deck
```

---

## ✅ Verification Complete

You should now have:

- ✅ Dashboard logo prominently displayed
- ✅ Back button visible in all study session screens
- ✅ AI generation feature fully functional (after these 4 steps)

**Your FlashLearner app is now complete and ready for deployment!**

---

## 📞 Still Having Issues?

1. Check `npm start` console for error messages
2. Check browser developer console (F12 → Console tab)
3. Check Firebase Cloud Functions logs: `firebase functions:log`
4. Verify all 6 Firebase config variables are correct in `.env`
