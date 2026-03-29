import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  where,
  limit,
  updateDoc,
  writeBatch,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// COLLECTION REFERENCES
// ============================================

// Private user collections
const usersCol = collection(db, "users");
const userDoc = (userId) => doc(db, "users", userId);
const userDecksCol = (userId) => collection(db, "users", userId, "decks");
const userDeckDoc = (userId, deckId) => doc(db, "users", userId, "decks", deckId);
const userCardsCol = (userId, deckId) => collection(db, "users", userId, "decks", deckId, "cards");
const userCardDoc = (userId, deckId, cardId) => doc(db, "users", userId, "decks", deckId, "cards", cardId);

// Public curated templates
const publicDecksCol = collection(db, "publicDecks");
const publicDeckDoc = (deckId) => doc(db, "publicDecks", deckId);
const publicCardsCol = (deckId) => collection(db, "publicDecks", deckId, "cards");

// Publishing workflow
const publishRequestsCol = collection(db, "publishRequests");

// ============================================
// USER INITIALIZATION
// ============================================

export async function initializeUser(userId, { displayName, email }) {
  const userDocRef = userDoc(userId);
  try {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(userDocRef, {
        displayName,
        email,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Error initializing user:", err);
  }
}

// ============================================
// USER DECK OPERATIONS (PRIVATE)
// ============================================

/**
 * Create a new private deck
 * @param {string} userId - User ID from Firebase Auth
 * @param {Object} deckData - { name, description }
 * @returns {string} deckId
 */
export async function createUserDeck(userId, { name, description }) {
  const n = (name || "").trim();
  if (!n) throw new Error("Deck name is required");

  const deckRef = await addDoc(userDecksCol(userId), {
    name: n,
    description: (description || "").trim(),
    ownerId: userId,
    visibility: "private", // Default: private
    cardCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return deckRef.id;
}

/**
 * Fetch all decks for a user
 * @param {string} userId
 * @returns {Array} decks with id, sorted by most recent
 */
export async function fetchUserDecks(userId) {
  try {
    const snap = await getDocs(userDecksCol(userId));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        // Sort by updatedAt descending (most recent first)
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
  } catch (err) {
    console.error("Error fetching user decks:", err);
    return [];
  }
}

/**
 * Listen to user's decks in real-time
 * @param {string} userId
 * @param {Function} callback - Called with [decks] whenever data changes
 * @returns {Function} unsubscribe function to stop listening
 */
export function listenToUserDecks(userId, callback) {
  try {
    const q = query(userDecksCol(userId), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const decks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("📡 Real-time decks update:", decks.length, "decks");
      callback(decks);
    });
    return unsubscribe;
  } catch (err) {
    console.error("Error setting up deck listener:", err);
    return () => {};
  }
}

/**
 * Fetch a single deck
 * @param {string} userId
 * @param {string} deckId
 * @returns {Object} deck document
 */
export async function fetchUserDeck(userId, deckId) {
  try {
    const snap = await getDoc(userDeckDoc(userId, deckId));
    if (!snap.exists()) throw new Error("Deck not found");
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("Error fetching deck:", err);
    throw err;
  }
}

/**
 * Update deck metadata
 * @param {string} userId
 * @param {string} deckId
 * @param {Object} updates - { name, description, visibility }
 */
export async function updateUserDeck(userId, deckId, updates) {
  try {
    const deckRef = userDeckDoc(userId, deckId);
    await updateDoc(deckRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error updating deck:", err);
    throw err;
  }
}

/**
 * Delete a deck and all its cards
 * @param {string} userId
 * @param {string} deckId
 */
export async function deleteUserDeck(userId, deckId) {
  try {
    // Delete all cards first
    const cards = await fetchUserCards(userId, deckId);
    const batch = writeBatch(db);

    cards.forEach((card) => {
      batch.delete(userCardDoc(userId, deckId, card.id));
    });

    // Delete the deck
    batch.delete(userDeckDoc(userId, deckId));
    await batch.commit();
  } catch (err) {
    console.error("Error deleting deck:", err);
    throw err;
  }
}

// ============================================
// USER CARD OPERATIONS (SPACED REPETITION)
// ============================================

/**
 * Add a new card to a deck
 * @param {string} userId
 * @param {string} deckId
 * @param {Object} cardData - { front, back }
 * @returns {string} cardId
 */
export async function addUserCard(userId, deckId, cardData) {
  const { front, back, easeFactor = 2.5, interval = 0, repetitions = 0, dueAt, createdAt } = cardData;
  
  const f = (front || "").trim();
  const b = (back || "").trim();
  if (!f || !b) throw new Error("Card front and back are required");

  try {
    const cardRef = await addDoc(userCardsCol(userId, deckId), {
      front: f,
      back: b,
      // Spaced repetition (SM-2 algorithm)
      dueAt: dueAt || new Date(),
      interval,
      easeFactor,
      repetitions,
      createdAt: createdAt ? createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("Card added successfully:", cardRef.id);

    // Update deck cardCount
    const deck = await fetchUserDeck(userId, deckId);
    await updateUserDeck(userId, deckId, {
      cardCount: (deck.cardCount || 0) + 1,
    });

    return cardRef.id;
  } catch (err) {
    console.error("Error adding card:", {
      errorMessage: err.message,
      errorCode: err.code,
      userId,
      deckId,
    });
    throw err;
  }
}

/**
 * Fetch all cards in a deck
 * @param {string} userId
 * @param {string} deckId
 * @returns {Array} cards sorted by dueAt (due cards first)
 */
export async function fetchUserCards(userId, deckId) {
  try {
    const q = query(userCardsCol(userId, deckId), orderBy("dueAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching cards:", err);
    return [];
  }
}

/**
 * Real-time listener for user cards
 * @param {string} userId
 * @param {string} deckId
 * @param {function} callback - Function called with updated cards array
 * @returns {function} Unsubscribe function to stop listening
 */
export function listenToUserCards(userId, deckId, callback) {
  try {
    const q = query(userCardsCol(userId, deckId), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(cards);
    });
    return unsubscribe;
  } catch (err) {
    console.error("Error setting up real-time listener:", err);
    return () => {};
  }
}

/**
 * Get count of due cards (cards ready for review)
 * @param {string} userId
 * @param {string} deckId
 * @returns {number} count of due cards
 */
export async function getDueCardsCount(userId, deckId) {
  try {
    const now = new Date();
    const q = query(
      userCardsCol(userId, deckId),
      where("dueAt", "<=", now)
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (err) {
    console.error("Error getting due cards count:", err);
    return 0;
  }
}

/**
 * Update card text (front/back)
 * @param {string} userId
 * @param {string} deckId
 * @param {string} cardId
 * @param {Object} updates - { front, back }
 */
export async function updateUserCard(userId, deckId, cardId, { front, back }) {
  try {
    const updates = {};
    if (front !== undefined) updates.front = front;
    if (back !== undefined) updates.back = back;
    
    await updateDoc(userCardDoc(userId, deckId, cardId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error updating card:", err);
    throw err;
  }
}

/**
 * Update card with spaced repetition data after review
 * @param {string} userId
 * @param {string} deckId
 * @param {string} cardId
 * @param {Object} updates - { quality, interval, easeFactor, repetitions, dueAt }
 */
export async function updateCardAfterReview(userId, deckId, cardId, updates) {
  try {
    await updateDoc(userCardDoc(userId, deckId, cardId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error updating card:", err);
    throw err;
  }
}

/**
 * Delete a single card
 * @param {string} userId
 * @param {string} deckId
 * @param {string} cardId
 */
export async function deleteUserCard(userId, deckId, cardId) {
  try {
    await deleteDoc(userCardDoc(userId, deckId, cardId));

    // Update deck cardCount
    const deck = await fetchUserDeck(userId, deckId);
    await updateUserDeck(userId, deckId, {
      cardCount: Math.max(0, (deck.cardCount || 1) - 1),
    });
  } catch (err) {
    console.error("Error deleting card:", err);
    throw err;
  }
}

// ============================================
// PUBLIC TEMPLATE LIBRARY (READ-ONLY)
// ============================================

/**
 * Fetch all public template decks
 * @returns {Array} public decks sorted by featured and created date
 */
export async function fetchPublicDecks() {
  try {
    const q = query(
      publicDecksCol,
      orderBy("isFeatured", "desc"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching public decks:", err);
    return [];
  }
}

/**
 * Fetch a single public template deck
 * @param {string} deckId
 * @returns {Object} template deck
 */
export async function fetchPublicDeck(deckId) {
  try {
    const snap = await getDoc(publicDeckDoc(deckId));
    if (!snap.exists()) throw new Error("Template not found");
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("Error fetching public deck:", err);
    throw err;
  }
}

/**
 * Fetch all cards from a public template deck
 * @param {string} deckId
 * @returns {Array} template cards
 */
export async function fetchPublicCards(deckId) {
  try {
    const q = query(publicCardsCol(deckId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching public cards:", err);
    return [];
  }
}

// ============================================
// TEMPLATE COPY LOGIC
// ============================================

/**
 * Copy a public template to user's private collection
 * Creates a new deck with copied cards and initialized spaced repetition
 *
 * @param {string} userId
 * @param {string} templateDeckId
 * @returns {string} newDeckId
 */
export async function copyPublicDeckToUser(userId, templateDeckId) {
  try {
    // Check if user already has this deck
    const existingRef = await getDocs(
      query(
        userDecksCol(userId),
        where("sourceTemplateId", "==", templateDeckId),
        limit(1)
      )
    );

    if (existingRef.docs.length > 0) {
      return existingRef.docs[0].id; // Already copied
    }

    // Fetch template data
    const template = await fetchPublicDeck(templateDeckId);
    const templateCards = await fetchPublicCards(templateDeckId);

    // Create new deck reference
    const newDeckRef = doc(userDecksCol(userId));

    // Batch write all operations
    let batch = writeBatch(db);
    let writeCount = 0;
    const batches = [];

    // Create user's copy of the deck
    batch.set(newDeckRef, {
      name: template.name,
      description: template.description,
      ownerId: userId,
      visibility: "private",
      sourceTemplateId: templateDeckId, // Track where it came from
      cardCount: templateCards.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    writeCount++;

    // Copy all cards with initialized spaced repetition
    for (const card of templateCards) {
      if (writeCount >= 499) {
        // Stay under Firestore's 500 write limit
        batches.push(batch.commit());
        batch = writeBatch(db);
        writeCount = 0;
      }

      const cardRef = doc(userCardsCol(userId, newDeckRef.id));
      batch.set(cardRef, {
        front: card.front,
        back: card.back,
        // Initialize spaced repetition per user
        dueAt: new Date(), // Due immediately
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        createdAt: serverTimestamp(),
      });
      writeCount++;
    }

    // Commit all batches
    batches.push(batch.commit());
    await Promise.all(batches);

    return newDeckRef.id;
  } catch (err) {
    console.error("Error copying template:", err);
    throw err;
  }
}

// ============================================
// STUDY TRACKING
// ============================================

/**
 * Update when user last studied a deck
 * @param {string} userId
 * @param {string} deckId
 */
export async function updateDeckLastStudied(userId, deckId) {
  try {
    await updateDoc(userDeckDoc(userId, deckId), {
      lastStudied: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error updating study time:", err);
  }
}

/**
 * Get recently studied decks
 * @param {string} userId
 * @param {number} count - number of decks to fetch (default 3)
 * @returns {Array} recently studied decks
 */
export async function getRecentlyStudiedDecks(userId, count = 3) {
  try {
    const q = query(
      userDecksCol(userId),
      where("lastStudied", "!=", null),
      orderBy("lastStudied", "desc"),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching recently studied decks:", err);
    return [];
  }
}

/**
 * Get total card count for a deck
 * @param {string} userId
 * @param {string} deckId
 * @returns {number}
 */
export async function getCardCount(userId, deckId) {
  try {
    const snap = await getDocs(userCardsCol(userId, deckId));
    return snap.size;
  } catch (err) {
    console.error("Error getting card count:", err);
    return 0;
  }
}

// ============================================
// COMMUNITY SHARING (USER TO PUBLIC)
// ============================================

/**
 * Check if a user's deck has already been shared to the community
 * @param {string} userId
 * @param {string} deckId
 * @returns {boolean} true if deck is shared
 */
export async function checkIfDeckIsShared(userId, deckId) {
  try {
    const alreadyShared = await getDocs(
      query(
        publicDecksCol,
        where("originalOwnerId", "==", userId),
        where("originalDeckId", "==", deckId),
        limit(1)
      )
    );
    return alreadyShared.docs.length > 0;
  } catch (err) {
    console.error("Error checking if deck is shared:", err);
    return false;
  }
}

/**
 * Share a user's private deck to the public Featured Decks library
 * Creates a public copy that appears in Featured Decks
 * Prevents duplicate sharing of the same deck
 * 
 * @param {string} userId - Owner of the private deck
 * @param {string} deckId - Private deck ID to share
 * @returns {Object} { publicDeckId, isUpdate }
 */
export async function shareDeckToCommunity(userId, deckId) {
  try {
    // 1. Fetch private deck and all its cards
    const privateDecks = await fetchUserDecks(userId);
    const privateDeck = privateDecks.find(d => d.id === deckId);
    
    if (!privateDeck) {
      throw new Error("Deck not found");
    }

    const privateCards = await fetchUserCards(userId, deckId);

    // 2. Check if this deck was already shared by this user (prevent duplicates)
    const existingShare = await getDocs(
      query(
        publicDecksCol,
        where("originalOwnerId", "==", userId),
        where("originalDeckId", "==", deckId),
        limit(1)
      )
    );

    let publicDeckId;
    let isUpdate = false;

    if (existingShare.docs.length > 0) {
      // Already shared - update the existing public deck instead
      publicDeckId = existingShare.docs[0].id;
      isUpdate = true;

      // Update metadata
      await updateDoc(publicDeckDoc(publicDeckId), {
        name: privateDeck.name,
        description: privateDeck.description,
        cardCount: privateCards.length,
        updatedAt: serverTimestamp(),
      });

      // Delete old cards
      const existingCards = await fetchPublicCards(publicDeckId);
      const batch = writeBatch(db);
      existingCards.forEach(card => {
        batch.delete(doc(publicCardsCol(publicDeckId), card.id));
      });
      await batch.commit();
    } else {
      // New share - create public deck
      const publicDeckRef = await addDoc(publicDecksCol, {
        name: privateDeck.name,
        description: privateDeck.description,
        cardCount: privateCards.length,
        isFeatured: true,
        sourceType: "community",
        originalOwnerId: userId,
        originalDeckId: deckId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      publicDeckId = publicDeckRef.id;
    }

    // 3. Copy all cards to public deck
    const batch = writeBatch(db);
    let writeCount = 0;
    const batches = [];

    for (const card of privateCards) {
      if (writeCount >= 499) {
        // Stay under Firestore's 500 write limit
        batches.push(batch.commit());
        batch = writeBatch(db);
        writeCount = 0;
      }

      const cardRef = doc(publicCardsCol(publicDeckId));
      batch.set(cardRef, {
        front: card.front,
        back: card.back,
        createdAt: serverTimestamp(),
      });
      writeCount++;
    }

    // Commit remaining batch
    batches.push(batch.commit());
    await Promise.all(batches);

    console.log(`[Community] Deck shared: "${privateDeck.name}" (${privateCards.length} cards)`);
    
    return { publicDeckId, isUpdate };
  } catch (err) {
    console.error("[Community] Error sharing deck:", err);
    throw err;
  }
}

// ============================================
// PUBLISHING WORKFLOW
// ============================================

/**
 * Request to publish a deck (admin review required)
 * @param {string} userId
 * @param {string} deckId
 * @returns {string} requestId
 */
export async function requestPublishDeck(userId, deckId) {
  try {
    const requestRef = await addDoc(publishRequestsCol, {
      ownerId: userId,
      sourceDeckPath: `users/${userId}/decks/${deckId}`,
      status: "pending", // pending | approved | rejected
      createdAt: serverTimestamp(),
    });

    return requestRef.id;
  } catch (err) {
    console.error("Error requesting publish:", err);
    throw err;
  }
}

/**
 * Get publishing requests for a user
 * @param {string} userId
 * @returns {Array} publish requests
 */
export async function getUserPublishRequests(userId) {
  try {
    const q = query(
      publishRequestsCol,
      where("ownerId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching publish requests:", err);
    return [];
  }
}