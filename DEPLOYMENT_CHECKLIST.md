# Deployment Checklist - AI Deck Generation

Use this checklist to ensure everything is properly deployed and configured.

---

## Pre-Deployment

- [ ] You have an OpenAI API key (https://platform.openai.com/account/api-keys)
- [ ] Firebase CLI is installed: `npm install -g firebase-tools`
- [ ] You're logged into Firebase: `firebase login`
- [ ] React app builds successfully: `npm run build`

---

## Deployment (Follow in Order)

### 1. Configure Cloud Functions

```bash
# Set your OpenAI API key
firebase functions:config:set openai.api_key="sk-paste-your-actual-key-here"

# Verify it's set
firebase functions:config:get
```

**Expected output**:
```json
{
  "openai": {
    "api_key": "sk-..."
  }
}
```

✅ Check: [ ]

---

### 2. Install Cloud Functions Dependencies

```bash
cd functions
npm install
cd ..
```

**Expected**: No errors, `node_modules` folder created in `functions/`

✅ Check: [ ]

---

### 3. Deploy Cloud Functions to Firebase

```bash
firebase deploy --only functions
```

**Expected output**:
```
✓ functions[generateFlashcards] deployed
✓ functions[healthCheck] deployed
Function URL: https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards
```

**Copy your function URL** - you'll need it in Step 4.

✅ Check: [ ]
Function URL: `_____________________________________`

---

### 4. Configure Frontend Environment

Create `.env.local` in your project root directory:

```bash
REACT_APP_GENERATE_FLASHCARDS_URL=https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards
```

**Replace** `REGION-PROJECT_ID` with your actual values from Step 3.

**Example**:
```bash
REACT_APP_GENERATE_FLASHCARDS_URL=https://us-central1-flashlearn-49cc8.cloudfunctions.net/generateFlashcards
```

✅ Check: [ ]

---

### 5. Restart React Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

**Expected**: App starts on `http://localhost:3000`

✅ Check: [ ]

---

## Post-Deployment Testing

### Test 1: Verify Cloud Function is Accessible

```bash
# Replace FUNCTION_URL with your URL from Step 3
curl -X POST https://YOUR_FUNCTION_URL/generateFlashcards \
  -H "Content-Type: application/json" \
  -d '{"topic":"Science","cardCount":5}'
```

**Expected response**:
```json
{
  "success": true,
  "flashcards": [
    {"front": "...", "back": "..."}
  ],
  "count": 5
}
```

✅ Check: [ ]

---

### Test 2: Test in React App (Manual)

1. Open: http://localhost:3000/create-deck
2. Scroll to: "✨ Generate Deck with AI"
3. Enter topic: "Photosynthesis"
4. Select cards: "10 cards"
5. Click: "Generate Flashcards"
6. Wait: ~15 seconds for generation
7. Verify: Preview shows 10 cards with questions and answers
8. Click: "Save Deck"
9. Verify: Page redirects to deck editor with 10 cards

✅ Check: [ ] (All steps completed successfully)

---

### Test 3: Verify Firestore Storage

1. Go to Firebase Console: https://console.firebase.google.com
2. Select project: `flashlearn-49cc8`
3. Go to Firestore Database
4. Navigate to: `users/{your-uid}/decks`
5. Look for the newly created AI deck
6. Expand the deck and check `cards` subcollection
7. Verify 10 cards are present with `front` and `back` fields

✅ Check: [ ]
Number of cards in new deck: ______

---

### Test 4: Test Study Session

1. Go to Dashboard: http://localhost:3000/dashboard
2. Find your newly created AI deck
3. Click: "Study"
4. Verify: All cards appear as "due today"
5. Click: "Show Answer"
6. Rate the card: 3-5 stars
7. Verify: SM-2 algorithm updates the card

✅ Check: [ ]

---

### Test 5: Test Dark Mode

1. Go to Dashboard
2. Click theme toggle (top right)
3. Verify Stats page is dark (not light)
4. Navigate to Stats page
5. Verify no white boxes
6. All text is readable
7. Colors are consistent

✅ Check: [ ]

---

## Troubleshooting Deployment

### Issue: "Functions config not set"

```bash
# Run:
firebase functions:config:get

# If empty, set again:
firebase functions:config:set openai.api_key="sk-..."
firebase deploy --only functions
```

---

### Issue: "Cannot find module 'openai'"

```bash
# Run:
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

### Issue: "REACT_APP_GENERATE_FLASHCARDS_URL is undefined"

**Solution**:
1. Check `.env.local` exists in project root (not in src/)
2. Verify format: `REACT_APP_GENERATE_FLASHCARDS_URL=https://...`
3. Restart dev server: `npm start`
4. In browser: DevTools → Application → Environment Variables

---

### Issue: "401 Unauthorized from OpenAI"

**Solution**:
1. Check API key at https://platform.openai.com/account/api-keys
2. Verify key starts with `sk-`
3. Verify key has available credits
4. Re-set key: `firebase functions:config:set openai.api_key="sk-..."`
5. Redeploy: `firebase deploy --only functions`

---

### Issue: Generation works but cards don't save

**Solution**:
1. Check Firestore security rules allow write to `users/{uid}/decks/{deckId}/cards`
2. Verify user is logged in
3. Check browser console for errors
4. Check Cloud Function logs: `firebase functions:log`

---

## Final Verification

All of the following must be true:

- [ ] `firebase functions:list` shows `generateFlashcards` function
- [ ] `firebase functions:config:get` shows OpenAI API key is set
- [ ] `.env.local` has `REACT_APP_GENERATE_FLASHCARDS_URL`
- [ ] `npm run build` completes without errors
- [ ] Curl test returns flashcards successfully
- [ ] React app generates flashcards at `/create-deck`
- [ ] Generated flashcards save to Firestore
- [ ] Study session works with generated cards
- [ ] Dark mode works on Stats page
- [ ] Dashboard, DeckPage, StudySession all still work

**If all boxes are checked**: ✅ **Deployment is complete and working!**

---

## Monitoring

### Check Function Logs

```bash
firebase functions:log
```

This shows recent function executions and any errors.

### Monitor OpenAI Usage

Visit: https://platform.openai.com/account/usage/overview

This shows your API usage and costs.

### Update Function (if needed)

```bash
# Make changes to functions/index.js
# Then:
firebase deploy --only functions
```

---

## Rollback (if something breaks)

If you need to disable AI generation temporarily:

**Option 1**: Delete from Firestore config
```bash
firebase functions:config:unset openai.api_key
firebase deploy --only functions
```

**Option 2**: Disable the function in Firebase Console
1. Go to Cloud Functions console
2. Select `generateFlashcards`
3. Delete or disable

Users will see error message on `/create-deck` but app won't break.

---

## Maintenance

**Weekly**:
- Check: `firebase functions:log` for errors
- Review: OpenAI usage and costs

**Monthly**:
- Audit: Generated decks in Firestore
- Check: Any usage patterns or issues
- Monitor: User feedback on quality

**As Needed**:
- Update prompts in `functions/index.js` for better cards
- Add new card count options (if needed)
- Implement rate limiting per user

---

## Success Criteria

Your AI deck generation is successfully deployed when:

1. ✅ Cloud Function is deployed and accessible
2. ✅ OpenAI API key is securely configured
3. ✅ Frontend calls function successfully
4. ✅ Generated cards preview correctly
5. ✅ Cards save to Firestore
6. ✅ Cards work in Study session
7. ✅ Dark mode is fully functional
8. ✅ No errors in console or logs
9. ✅ All existing features still work

---

**Estimated Time**: 10-15 minutes for complete deployment

**Support**: See AI_SETUP.md, AI_IMPLEMENTATION.md, or QUICK_START_AI.md

---
