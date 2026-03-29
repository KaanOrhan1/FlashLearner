# FlashLearner - System Architecture Documentation

## Overview

FlashLearner is a privacy-first, personal learning platform built on React and Firebase. It implements the SM-2 spaced repetition algorithm and maintains a clear separation between private user data and curated public content.

---

## Data Architecture

### 1. Private User Data (`users/{uid}/decks/*`)

**User Document** (`users/{uid}`)
```json
{
  "displayName": "string",
  "email": "string",
  "createdAt": "serverTimestamp"
}
```

**Deck Document** (`users/{uid}/decks/{deckId}`)
```json
{
  "name": "string (required)",
  "description": "string",
  "ownerId": "string (uid)",
  "visibility": "private|public (default: private)",
  "cardCount": "number",
  "sourceTemplateId": "string (if copied from template)",
  "lastStudied": "serverTimestamp|null",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

**Card Document** (`users/{uid}/decks/{deckId}/cards/{cardId}`)
```json
{
  "front": "string (required)",
  "back": "string (required)",
  "dueAt": "Date (SM-2 next review time)",
  "interval": "number (SM-2 algorithm)",
  "easeFactor": "number (SM-2 algorithm, default: 2.5)",
  "repetitions": "number (SM-2 algorithm)",
  "createdAt": "serverTimestamp"
}
```

**Why this structure:**
- Hierarchical organization enables efficient querying
- `dueAt` is sortable for review scheduling
- SM-2 fields are per-user (not shared globally)
- `sourceTemplateId` tracks which public template was copied

---

### 2. Public Template Library (`publicDecks/*`)

**Template Deck** (`publicDecks/{deckId}`)
```json
{
  "name": "string",
  "description": "string",
  "isFeatured": "boolean",
  "cardCount": "number",
  "createdAt": "serverTimestamp"
}
```

**Template Card** (`publicDecks/{deckId}/cards/{cardId}`)
```json
{
  "front": "string",
  "back": "string",
  "createdAt": "serverTimestamp"
}
```

**Why this design:**
- Read-only (enforced by security rules)
- No user progress data (kept private)
- Minimal fields ensure fast loading
- `cardCount` denormalized for dashboard display

---

### 3. Publishing Workflow (`publishRequests/*`)

**Publish Request** (`publishRequests/{requestId}`)
```json
{
  "ownerId": "string (uid)",
  "sourceDeckPath": "string (users/{uid}/decks/{deckId})",
  "status": "pending|approved|rejected",
  "createdAt": "serverTimestamp"
}
```

**Process:**
1. User submits deck for review
2. Admin reviews in Firebase Console or admin dashboard
3. Admin updates status to "approved"
4. Cloud Function copies approved deck to `/publicDecks/`
5. User notified of approval/rejection

---

## API Functions (lib/firestore.js)

### User Deck Operations

```javascript
createUserDeck(userId, { name, description })
  → Creates a private deck for user
  → Returns: deckId

fetchUserDecks(userId)
  → Gets all user's decks (sorted by updatedAt)
  → Returns: Array<{ id, name, description, ... }>

fetchUserDeck(userId, deckId)
  → Gets single deck details
  → Returns: { id, name, description, cardCount, ... }

updateUserDeck(userId, deckId, { name, description, visibility })
  → Updates deck metadata
  → Returns: void

deleteUserDeck(userId, deckId)
  → Deletes entire deck and all cards
  → Returns: void
```

### User Card Operations (Spaced Repetition)

```javascript
addUserCard(userId, deckId, { front, back })
  → Adds new card with initialized SM-2 fields
  → Increments cardCount automatically
  → Returns: cardId

fetchUserCards(userId, deckId)
  → Gets all cards (sorted by dueAt - due first)
  → Returns: Array<{ id, front, back, dueAt, interval, ... }>

getDueCardsCount(userId, deckId)
  → Returns number of cards due for review
  → Returns: number

updateCardAfterReview(userId, deckId, cardId, sm2DataUpdate)
  → Updates SM-2 fields after user reviews card
  → Input: { interval, easeFactor, repetitions, dueAt }
  → Returns: void

deleteUserCard(userId, deckId, cardId)
  → Removes single card
  → Decrements cardCount automatically
  → Returns: void
```

### Public Template Operations

```javascript
fetchPublicDecks()
  → Gets all public templates (sorted by featured, then date)
  → Returns: Array<{ id, name, description, cardCount, isFeatured }>

fetchPublicDeck(deckId)
  → Gets single template details
  → Returns: { id, name, description, cardCount, ... }

fetchPublicCards(deckId)
  → Gets all cards in a template
  → Returns: Array<{ id, front, back }>
```

### Template Copy Logic

```javascript
copyPublicDeckToUser(userId, templateDeckId)
  → Core business logic
  → 1. Checks if user already has this deck
  → 2. Fetches template metadata and cards
  → 3. Creates new deck under users/{uid}/decks/
  → 4. Batch-copies all cards with initialized SM-2 fields
  → 5. Sets dueAt = now (cards due immediately)
  → Returns: newDeckId
  
  Note: Uses batch writes (499 ops per write to stay under Firestore's 500 write limit)
  Note: Skips copy if user already has this template
```

### Study Tracking

```javascript
updateDeckLastStudied(userId, deckId)
  → Updates lastStudied timestamp
  → Called when user opens a deck
  → Used for "Continue Studying" section

getRecentlyStudiedDecks(userId, count = 3)
  → Returns user's most recently accessed decks
  → Returns: Array<{ id, name, lastStudied, ... }>
```

### Publishing Workflow

```javascript
requestPublishDeck(userId, deckId)
  → Creates document in publishRequests/ collection
  → Status = "pending" (awaits admin review)
  → Returns: requestId

getUserPublishRequests(userId)
  → Gets user's publish requests
  → Returns: Array<{ id, status, createdAt, ... }>
```

---

## UI Architecture

### Dashboard Sections (in order)

1. **Continue Studying**
   - Shows recently accessed decks
   - Displays due card count
   - Primary action: "Resume Study"
   - Goal: Quick access to active learning sessions

2. **Template Library** (Main Focus)
   - Shows all public decks
   - Sorted by featured, then recency
   - Each card displays: name, description, card count
   - Action: "Add to My Decks"
   - Goal: Encourage quality learning resources

3. **My Decks**
   - User-created + copied decks
   - Shows card count and due count
   - Progress bar (cards studied / total)
   - Actions: Study, Edit, Delete
   - Goal: Personal learning workspace

4. **Create Deck** (Secondary)
   - Collapsible form
   - Creates private deck by default
   - Goal: Support personal deck creation

### Study View

During study session:
- Display card front (question)
- User reveals back (answer) by clicking or space bar
- SM-2 buttons: "Again" | "Hard" | "Good" | "Easy"
- Updates card's dueAt, interval, easeFactor based on SM-2 algorithm

---

## Security & Privacy

### User Data Privacy
- Each user can only read/write their own data
- Spaced repetition progress is never shared
- No access logs or analytics on user behavior
- Export/backup functionality ensures data portability

### Public Content Integrity
- Templates are read-only (no user writes)
- Only admins can create/modify templates
- Prevents low-quality content pollution
- Maintains content quality

### Authentication
- Firebase Authentication (email/password or federated)
- Auth context provides async user state
- User ID from Firebase auth.currentUser.uid
- No hardcoded user IDs

---

## Firestore Security Rules

```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth.uid == userId;
}

match /publicDecks/{deckId} {
  allow read: if request.auth != null;
  allow write: if false;
  
  match /cards/{cardId} {
    allow read: if request.auth != null;
    allow write: if false;
  }
}

match /publishRequests/{requestId} {
  allow create: if request.auth != null;
  allow read: if request.auth.uid == resource.data.ownerId;
  allow update, delete: if request.auth.token.admin == true;
}
```

---

## Performance Optimizations

1. **Batch Writes**
   - Template copying uses batch writes
   - Handles up to 500 writes per batch
   - Multiple batches for large decks

2. **Parallel Queries**
   - Card counts loaded in parallel
   - Recently studied decks fetched simultaneously

3. **Indexing**
   - Composite index: `/users/{uid}/decks` ordered by `updatedAt`
   - Composite index: `/users/{uid}/decks/{deckId}/cards` ordered by `dueAt`
   - Composite index: `/publicDecks` ordered by `isFeatured` then `createdAt`

---

## SM-2 Spaced Repetition Algorithm

Implementation in study mode (TODO):

```
Input: quality (0-5)
  0 = Complete blackout, wrong answer
  1 = Incorrect, significant effort needed
  2 = Incorrect, easy to recall with effort
  3 = Correct, but required serious effort
  4 = Correct, some hesitation
  5 = Correct, immediate knowledge

Algorithm:
if(quality < 3)
  repetitions = 0
  interval = 0
else
  if(repetitions == 0)
    interval = 1 day
  else if(repetitions == 1)
    interval = 3 days
  else
    interval = interval * easeFactor
  
  repetitions += 1

easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
if(easeFactor < 1.3) easeFactor = 1.3

dueAt = now + (interval * 1 day)
```

---

## Development Roadmap

### Phase 1 (Current) ✅
- [x] User authentication
- [x] Private deck CRUD
- [x] Card addition
- [x] Dashboard structure
- [x] Public template reading
- [x] Template copying
- [x] Study tracking

### Phase 2 (Next)
- [ ] SM-2 study mode UI
- [ ] Card review interface with SM-2 calculations
- [ ] Study statistics & progress charts
- [ ] Keyboard shortcuts for speed

### Phase 3
- [ ] Publishing workflow UI
- [ ] Admin dashboard for approvals
- [ ] Analytics for template performance

### Phase 4
- [ ] Data export (JSON backup)
- [ ] Deck sharing links (read-only preview)
- [ ] Mobile app (React Native)
- [ ] Dark mode

---

## Compliance & Ethics

✅ **Privacy-First**
- No user tracking
- No third-party analytics
- No ads or engagement dark patterns
- Data export available

✅ **User Ownership**
- Users own their decks
- Can export data anytime
- Not locked into platform

✅ **Anti-Social**
- No user feeds or sharing
- No competitive leaderboards
- No viral features
- Curated-only public content

✅ **Accessibility**
- WCAG 2.1 AA compliant (in progress)
- Keyboard shortcuts
- Screen reader support
- Mobile-responsive design

---

## Support & Questions

For architecture questions or clarifications, refer to:
- `/src/lib/firestore.js` - Function documentation
- `FIRESTORE_SECURITY_RULES.txt` - Security configuration
- React components in `/src/pages/` - UI implementation
