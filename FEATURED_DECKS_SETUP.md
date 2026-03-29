# 📚 Featured Decks - Complete Setup Guide

> **What are Featured Decks?**  
> Featured Decks are curated, public templates that all your users can see on the dashboard and add to their personal library. They're a great way to provide starter decks for common subjects.

---

## 🚀 Quick Start (5 minutes)

### Step 1: Seed Sample Decks

The easiest way to get started is to seed 5 sample featured decks. Open your browser's developer console and run:

```javascript
// In browser console (F12 → Console tab)
import { seedAllSampleDecks } from "./lib/seedFeaturedDecks.js";
await seedAllSampleDecks();
```

**Expected output:**
```
🌱 Starting to seed all sample featured decks...
📚 Seeding featured deck: spanish-101
✅ Successfully seeded deck: spanish-101 with 10 cards
📚 Seeding featured deck: capitals-world
✅ Successfully seeded deck: capitals-world with 10 cards
... [more decks]
✅ Completed seeding all sample decks!
```

### Step 2: View in Dashboard

Refresh your app and go to Dashboard. You should now see under "Featured Decks":
- ✅ Spanish Vocabulary 101
- ✅ World Capitals
- ✅ Biology Basics
- ✅ React Hooks Essentials
- ✅ World War 2 Events Timeline

### Step 3: Test Copy Feature

Click "Add to My Decks" on any featured deck. It should:
1. Copy the deck to your private collection
2. Initialize all cards with spaced repetition (ready to study)
3. Appear in "My Decks" section
4. Be fully functional for studying

---

## ➕ Adding Your Own Featured Decks

### Method A: Using Code (Easiest)

```javascript
import { seedFeaturedDeck } from "lib/seedFeaturedDecks";

await seedFeaturedDeck(
  "french-greetings",           // Unique deck ID
  {
    name: "French Greetings",
    description: "Common French greetings and polite expressions"
  },
  [
    { front: "Hello", back: "Bonjour" },
    { front: "Good evening", back: "Bonsoir" },
    { front: "Goodbye", back: "Au revoir" },
    { front: "Thank you", back: "Merci" },
    { front: "Please", back: "S'il vous plaît" },
  ],
  true  // Mark as featured (appears first)
);
```

### Method B: Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Open **Firestore Database**
4. Create collection `publicDecks` (if it doesn't exist)
5. Add document with this structure:

**Document Data:**
```json
{
  "name": "Your Deck Name",
  "description": "What this deck teaches",
  "isFeatured": true,
  "cardCount": 10,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

6. Create subcollection `cards` in that document
7. Add documents for each card:

**Card Data:**
```json
{
  "front": "Question here",
  "back": "Answer here",
  "order": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## 🏗️ Featured Decks Structure in Firestore

```
Firestore Database
└── publicDecks/                      [Collection]
    ├── spanish-101/                  [Document]
    │   ├── name: "Spanish Vocabulary 101"
    │   ├── description: "Essential Spanish..."
    │   ├── isFeatured: true
    │   ├── cardCount: 10
    │   ├── createdAt: timestamp
    │   └── cards/                    [Subcollection]
    │       ├── {auto-id}/
    │       │   ├── front: "Hello"
    │       │   ├── back: "Hola"
    │       │   └── order: 1
    │       └── {auto-id}/
    │           ├── front: "Goodbye"
    │           ├── back: "Adiós"
    │           └── order: 2
    │
    └── world-capitals/               [More decks...]
```

---

## 🔄 How Featured Decks Work in the App

### User Journey:

1. **User opens Dashboard**
   - App loads and calls `fetchPublicDecks()` from firestore.js
   - Featured decks display in "✨ Featured Decks" section

2. **User clicks "Add to My Decks"**
   - App calls `copyPublicDeckToUser(userId, templateId)`
   - Function creates a private copy in `users/{userId}/decks/`

3. **Cards are copied with SM-2 initialized**
   ```javascript
   {
     front: "Hello",
     back: "Hola",
     dueAt: new Date(),     // Due now
     interval: 1,
     easeFactor: 2.5,
     repetitions: 0
   }
   ```

4. **Deck appears in "My Decks"**
   - User can immediately start studying
   - Progress tracking begins with spaced repetition

---

## ✅ Best Practices

### Design:
- ✅ Keep names clear and descriptive
- ✅ Use 5-15 cards per deck (good sweet spot)
- ✅ Write accurate, well-vetted content
- ✅ Include helpful descriptions
- ✅ Group related topics

### Naming:
- Use lowercase with hyphens: `spanish-101`, `biology-basics`
- Make titles end-user friendly
- Avoid internal jargon

### Content:
- ❌ Don't use very long card text (keep under 200 chars)
- ❌ Don't create duplicate decks
- ❌ Don't include inappropriate content
- ❌ Don't create decks with less than 5 cards

---

## 📝 Example: Add a Chemistry Deck

```javascript
import { seedFeaturedDeck } from "lib/seedFeaturedDecks";

async function addChemistryDeck() {
  await seedFeaturedDeck(
    "chemistry-101",
    {
      name: "Chemistry Fundamentals",
      description: "Basic chemistry concepts - atoms, bonds, and the periodic table"
    },
    [
      { front: "What is an atom?", back: "Smallest unit of matter that retains properties of an element" },
      { front: "What is a molecule?", back: "Two or more atoms chemically bonded together" },
      { front: "What is the pH scale?", back: "Scale from 0-14 measuring acidity (0-7) to basicity (7-14)" },
      { front: "What is oxidation?", back: "Process of losing electrons or gaining oxygen" },
      { front: "What is the periodic table?", back: "Table of all known chemical elements organized by atomic number" },
      { front: "What are electrons?", back: "Negatively charged particles that orbit the nucleus" },
      { front: "What is chemical bonding?", back: "Force holding atoms together in compounds" },
      { front: "What is a compound?", back: "Substance made of two or more elements chemically combined" },
    ],
    true  // Featured
  );
  console.log("✅ Chemistry deck added!");
}

// Call it:
// await addChemistryDeck();
```

---

## 🔍 Verify Featured Decks Work

1. Seed the sample decks (see Quick Start)
2. Go to Dashboard and refresh
3. Scroll to "✨ Featured Decks"
4. You should see 5 decks
5. Click "Add to My Decks" on any deck
6. Verify it appears in "My Decks" within a few seconds
7. Click on the deck and verify cards are there
8. Try a study session to verify spaced repetition works

---

## ❓ Troubleshooting

**"No featured decks available yet" even after seeding?**
- ✓ Check Firestore: go to publicDecks collection
- ✓ Verify documents exist with data
- ✓ Refresh browser (Ctrl+R)
- ✓ Check browser console for errors (F12)

**Seeding fails with error?**
- ✓ Make sure you're logged into your app
- ✓ Check you have Firestore write permissions for publicDecks collection
- ✓ Check the error message in console
- ✓ Verify .env has correct Firebase config

**Copy deck fails?**
- ✓ Check Firestore security rules allow copying
- ✓ Verify user is logged in
- ✓ Check browser console for detailed error

**Copied deck doesn't show cards?**
- ✓ Original deck must have cards subcollection
- ✓ Cards must have both "front" and "back" fields
- ✓ Wait a few seconds for real-time listener to update
- ✓ Try refreshing the page

---

## 📋 File Reference

**Seeding Utility:** `lib/seedFeaturedDecks.js`
- `seedFeaturedDeck(deckId, deckData, cards, isFeatured)` - Add one deck
- `seedAllSampleDecks()` - Add all 5 sample decks
- `SAMPLE_FEATURED_DECKS` - Array of sample deck objects

**Firestore Functions:** `src/lib/firestore.js`
- `fetchPublicDecks()` - Get all featured decks
- `fetchPublicCards(deckId)` - Get cards from a featured deck
- `copyPublicDeckToUser(userId, deckId)` - Copy to user's collection

**Dashboard UI:** `src/pages/Dashboard.js`
- "Featured Decks" section displays public decks
- "Add to My Decks" button calls copy function

---

## 🎯 Next Steps

1. ✅ Run `seedAllSampleDecks()` to populate initial decks
2. ✅ Test copying a featured deck
3. ✅ Study one to verify spaced repetition works
4. ➕ Add custom featured decks for your domain
5. 📊 Monitor which decks are popular
6. 🔄 Update decks based on user feedback
