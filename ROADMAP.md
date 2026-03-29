# FlashLearner - Implementation Roadmap

## ✅ Completed

### Phase 1: Foundation (100%)
- [x] Firebase Authentication (email/password + federated)
- [x] Firestore schema design (users, publicDecks, publishRequests)
- [x] Private deck CRUD operations (create, read, update, delete)
- [x] Card management (add, fetch, delete)
- [x] SM-2 field initialization (dueAt, interval, easeFactor, repetitions)
- [x] Dashboard with 4 sections (Continue Studying, Templates, My Decks, Create)
- [x] Public template library (read-only)
- [x] Template copy logic (batch writes, optimization)
- [x] Study tracking (lastStudied timestamp)
- [x] Security rules documentation
- [x] Architecture documentation

---

## 📋 Next Steps (Priority Order)

### 1. SM-2 Study Mode (CRITICAL - 3-4 days)
This is the core feature that makes FlashLearner a real learning app.

**What to build:**
```
/src/pages/StudyMode.js
- Display card front (question)
- Hide/show back (answer)
- Keyboard shortcuts:
  - Space bar: flip card
  - 1: Again
  - 2: Hard
  - 3: Good
  - 4: Easy
- SM-2 calculation after each review
- Progress bar (N cards left in session)
- Statistics (new, learning, review breakdown)
```

**API functions needed:**
- `updateCardAfterReview(userId, deckId, cardId, sm2Update)`
  - Called after user rates card (0-5)
  - Calculates new dueAt, interval, easeFactor
  - Updates Firestore

**Implementation:**
1. Create SM-2 calculator function:
   ```javascript
   function calculateSM2(
     quality,           // 0-5: user rating
     lastInterval,      // days
     lastEaseFactor,    // multiplier
     lastRepetitions    // count
   ) {
     return {
       interval,       // days until next review
       easeFactor,     // new multiplier
       repetitions,    // new count
       dueAt,          // timestamp
     };
   }
   ```

2. Create StudyMode component
3. Add route `/study/{deckId}`
4. Call this from "Resume Study" and "Study" buttons

**Estimated effort:** 300 lines of code

---

### 2. Data Export / Backup (1 day)
Users need to download their data (GDPR requirement).

**What to build:**
```
/src/components/DataExport.js
- Button: "Download my data"
- Creates JSON file with all decks and cards
- Filename: `flashlearner-backup-${date}.json`
```

**Implementation:**
```javascript
async function exportUserData(userId) {
  const decks = await fetchUserDecks(userId);
  const allCards = {};
  
  for (const deck of decks) {
    allCards[deck.id] = await fetchUserCards(userId, deck.id);
  }
  
  return {
    exportedAt: new Date(),
    decks,
    cards: allCards,
  };
}

// Download as JSON
function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  // trigger browser download
}
```

---

### 3. Admin Dashboard (2-3 days)
Allow admins to:
- Review publishing requests
- Create/edit public templates
- View platform statistics

**What to build:**
```
/src/pages/AdminDashboard.js
- List of pending publish requests
- Approve/reject buttons
- Form to create templates
- Basic analytics (users, decks, cards)
```

**Database structure:**
```javascript
// Admin check
if(request.auth.token.admin == true) {
  // Allow admin functions
}
```

---

### 4. Deck Sharing Links (1 day)
Allow read-only preview of decks.

**What to build:**
```
Share deck without copying:
/preview/{shareToken}
- Display deck and cards
- Cannot edit or study
- No login required (or public viewing)
```

**Implementation:**
```javascript
// Create share token
function generateShareToken(userId, deckId) {
  return btoa(`${userId}:${deckId}:${Date.now()}`);
}

// Validate share token
function decodeShareToken(token) {
  return atob(token);
}
```

---

### 5. Study Statistics (2 days)
Show learning progress.

**What to build:**
```
/src/pages/Statistics.js
Charts for:
- Cards by status (new, learning, mastered)
- Review history (last 30 days)
- Habits (study streak, daily average)
- Deck performance

Data needed:
- Total cards per status
- Study session history
- Time spent per deck
```

---

## 🔄 Ongoing Maintenance

### Monitoring
- Set up Firebase monitoring
- Track errors in production
- Monitor Firestore usage

### Database Optimization
- Ensure composite indexes are created
- Test query performance at scale
- Clean up old publish requests

### User Support
- Contact form
- FAQ page
- Tutorial videos (optional)

---

## 📊 Success Metrics

When can you launch?

✅ **MVP (Minimal Viable Product):**
- [ ] Authentication working
- [ ] Create/edit/delete decks
- [ ] Add cards to decks
- [ ] SM-2 study mode (flip and rate cards)
- [ ] Dashboard showing decks
- [ ] Template library with copy
- [ ] Data persistence

⚠️ **Beta (Feature Complete):**
- [ ] Everything above +
- [ ] Study statistics
- [ ] Data export
- [ ] Admin publishing workflow

🚀 **Production (Ready for Users):**
- [ ] Everything above +
- [ ] Mobile-responsive design
- [ ] Keyboard shortcuts optimized
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance tested (<3s load time)

---

## 💾 Database Seeding

To test with public templates, create sample data:

```javascript
// In Firebase Console, create documents:

publicDecks/spanish-basics
├── name: "Spanish Basics"
├── description: "Essential Spanish vocabulary"
├── isFeatured: true
├── cardCount: 10
└── cards/
    ├── 1: { front: "Hello", back: "Hola" }
    ├── 2: { front: "Thank you", back: "Gracias" }
    └── ...

publicDecks/calculus-derivatives
├── name: "Calculus - Derivatives"
├── description: "Power rule, product rule, chain rule"
├── isFeatured: false
├── cardCount: 8
└── cards/
    ├── ...
```

Or use a script:
```javascript
// scripts/seedPublicDecks.js
async function seedPublicDecks() {
  // Create templates programmatically
}
```

---

## 🛠 Tech Stack

**Current:**
- React 18
- Firebase Auth
- Firestore
- Sonner (toast notifications)
- Lucide React (icons)
- React Router

**Recommended additions:**
- Chart.js or Recharts (statistics)
- date-fns (date handling)
- zustand (state management - optional)

---

## 📞 Questions?

Refer to:
- `/ARCHITECTURE.md` - Complete system design
- `/FIRESTORE_SECURITY_RULES.txt` - Security configuration
- `/src/lib/firestore.js` - API documentation

Good luck building! 🚀
