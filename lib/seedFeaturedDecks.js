/**
 * Seed Featured Decks - Admin Utility
 * 
 * This file provides functions to seed sample featured decks into Firestore.
 * Featured decks are publicly available templates that all users can add to their library.
 * 
 * Usage:
 * 1. Import this in your admin panel or Firebase console
 * 2. Call seedFeaturedDeck() for each deck you want to add
 * 3. Verify in Firestore: Collection "publicDecks"
 * 
 * Feature Overview:
 * - Featured decks are stored in the "publicDecks" collection
 * - Each featured deck has its own subcollection "cards"
 * - Users can copy featured decks to their private library
 * - Featured decks remain read-only in the public collection
 */

import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// COLLECTION REFERENCES
// ============================================

const publicDecksCol = collection(db, "publicDecks");
const publicDeckDoc = (deckId) => doc(db, "publicDecks", deckId);
const publicCardsCol = (deckId) => collection(db, "publicDecks", deckId, "cards");

// ============================================
// FEATURED DECKS SEEDING
// ============================================

/**
 * Add or update a featured deck in the public library
 * 
 * @param {string} deckId - Unique identifier for the deck
 * @param {Object} deckData - Deck metadata
 * @param {string} deckData.name - Deck name
 * @param {string} deckData.description - Deck description
 * @param {Array} cards - Array of flashcards
 * @param {string} cards[].front - Question/prompt side of the card
 * @param {string} cards[].back - Answer side of the card
 * @param {boolean} isFeatured - Whether to mark as featured (appears first)
 * 
 * @returns {Promise} Resolves when deck is created
 * 
 * @example
 * await seedFeaturedDeck("spanish-basics", {
 *   name: "Spanish Vocabulary - Basics",
 *   description: "Common Spanish words and phrases for beginners",
 * }, [
 *   { front: "Hello", back: "Hola" },
 *   { front: "Thank you", back: "Gracias" },
 * ], true);
 */
export async function seedFeaturedDeck(deckId, deckData, cards, isFeatured = true) {
  try {
    console.log(`📚 Seeding featured deck: ${deckId}`);

    // Prepare batch operations
    let batch = writeBatch(db);
    let writeCount = 0;
    const batches = [];

    // Create deck document
    const deckRef = publicDeckDoc(deckId);
    batch.set(deckRef, {
      name: deckData.name,
      description: deckData.description || "",
      isFeatured: isFeatured,
      cardCount: cards.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    writeCount++;

    // Add all cards
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      if (writeCount >= 499) {
        // Firestore batch write limit is 500
        batches.push(batch.commit());
        batch = writeBatch(db);
        writeCount = 0;
      }

      const cardRef = doc(publicCardsCol(deckId));
      batch.set(cardRef, {
        front: card.front,
        back: card.back,
        order: i + 1,
        createdAt: serverTimestamp(),
      });
      writeCount++;
    }

    // Commit all batches
    batches.push(batch.commit());
    await Promise.all(batches);

    console.log(`✅ Successfully seeded deck: ${deckId} with ${cards.length} cards`);
  } catch (err) {
    console.error(`❌ Error seeding deck ${deckId}:`, err);
    throw err;
  }
}

/**
 * Sample featured decks ready to use
 * Copy these into your database to get started
 */
export const SAMPLE_FEATURED_DECKS = [
  {
    id: "spanish-101",
    data: {
      name: "Spanish Vocabulary 101",
      description: "Essential Spanish words for beginners - common phrases and greetings",
    },
    cards: [
      { front: "Hello", back: "Hola" },
      { front: "Goodbye", back: "Adiós" },
      { front: "Thank you", back: "Gracias" },
      { front: "Please", back: "Por favor" },
      { front: "Yes", back: "Sí" },
      { front: "No", back: "No" },
      { front: "Water", back: "Agua" },
      { front: "Food", back: "Comida" },
      { front: "Good morning", back: "Buenos días" },
      { front: "Good night", back: "Buenas noches" },
    ],
  },
  {
    id: "capitals-world",
    data: {
      name: "World Capitals",
      description: "Capital cities from around the world - test your geography knowledge",
    },
    cards: [
      { front: "France", back: "Paris" },
      { front: "Japan", back: "Tokyo" },
      { front: "Brazil", back: "Brasília" },
      { front: "Egypt", back: "Cairo" },
      { front: "Australia", back: "Canberra" },
      { front: "Germany", back: "Berlin" },
      { front: "Mexico", back: "Mexico City" },
      { front: "Canada", back: "Ottawa" },
      { front: "India", back: "New Delhi" },
      { front: "South Africa", back: "Pretoria" },
    ],
  },
  {
    id: "biology-basics",
    data: {
      name: "Biology Basics",
      description: "Fundamental biology concepts - cells, genetics, and life processes",
    },
    cards: [
      { front: "What is the basic unit of life?", back: "The cell" },
      { front: "What does DNA stand for?", back: "Deoxyribonucleic acid" },
      { front: "How many chromosomes do humans have?", back: "46 (23 pairs)" },
      { front: "What is photosynthesis?", back: "Process plants use to convert sunlight into energy" },
      { front: "What organelle is responsible for energy production?", back: "Mitochondria" },
      { front: "What is a gene?", back: "A unit of heredity that carries genetic information" },
      { front: "What is the powerhouse of the cell?", back: "Mitochondria" },
      { front: "What process do cells use to divide?", back: "Mitosis" },
    ],
  },
  {
    id: "react-hooks",
    data: {
      name: "React Hooks Essentials",
      description: "Key React Hooks concepts for modern React development",
    },
    cards: [
      { front: "What does useState do?", back: "Manages state in functional components" },
      { front: "What hook runs side effects?", back: "useEffect" },
      { front: "How do you prevent infinite loops with useEffect?", back: "Use a dependency array" },
      { front: "What is useContext used for?", back: "Share data between components without prop drilling" },
      { front: "When should you use useReducer?", back: "For complex state logic with multiple sub-values" },
      { front: "What does useCallback memoize?", back: "Functions, to prevent unnecessary re-renders" },
      { front: "What does useMemo memoize?", back: "Values, to avoid expensive computations" },
      { front: "What is the purpose of useRef?", back: "Access DOM elements directly and store mutable values" },
    ],
  },
  {
    id: "history-ww2",
    data: {
      name: "World War 2 Events Timeline",
      description: "Key events and dates from World War 2 - test your history knowledge",
    },
    cards: [
      { front: "When did WW2 start?", back: "September 1, 1939" },
      { front: "What year did Germany invade Poland?", back: "1939" },
      { front: "When did Japan attack Pearl Harbor?", back: "December 7, 1941" },
      { front: "What year did D-Day occur?", back: "1944" },
      { front: "When did Germany surrender in WW2?", back: "May 7, 1945" },
      { front: "When did Japan surrender?", back: "August 15, 1945" },
      { front: "Which countries were the main Axis powers?", back: "Germany, Italy, Japan" },
      { front: "How many years did WW2 last?", back: "6 years (1939-1945)" },
    ],
  },
];

/**
 * Seed all sample featured decks at once
 * 
 * @example
 * await seedAllSampleDecks();
 */
export async function seedAllSampleDecks() {
  console.log("🌱 Starting to seed all sample featured decks...");
  
  for (const deck of SAMPLE_FEATURED_DECKS) {
    try {
      await seedFeaturedDeck(deck.id, deck.data, deck.cards, true);
    } catch (err) {
      console.error(`Failed to seed ${deck.id}:`, err);
    }
  }
  
  console.log("✅ Completed seeding all sample decks!");
}

// ============================================
// USAGE INSTRUCTIONS
// ============================================

/*
HOW TO USE THIS FILE:

1. IN YOUR BROWSER CONSOLE (Firebase Console):
   - Go to Firebase Console → Your Project → Firestore Database
   - Open the built-in Functions console or use the Firestore emulator
   - Import and run the seeding function

2. IN YOUR REACT APP (FOR DEVELOPMENT):
   Create an admin page or one-time setup component:

   import { seedFeaturedDeck, seedAllSampleDecks } from "lib/seedFeaturedDecks";

   // Option A: Seed all samples at once
   async function setupFeaturedDecks() {
     await seedAllSampleDecks();
     console.log("Featured decks ready!");
   }

   // Option B: Add custom deck
   async function addCustomDeck() {
     await seedFeaturedDeck("my-deck-id", {
       name: "My Custom Deck",
       description: "Custom cards for my users"
     }, [
       { front: "Q1", back: "A1" },
       { front: "Q2", back: "A2" },
     ], true);
   }

3. VERIFY IN FIRESTORE:
   - Go to Firestore Database
   - Look for collection "publicDecks"
   - Each deck should have a subcollection "cards"
   - Users should see these decks in the "Featured Decks" section

4. TO ADD MORE DECKS:
   - Add an object to SAMPLE_FEATURED_DECKS
   - Or call seedFeaturedDeck() with your own data
   - Decks with isFeatured: true appear first on the dashboard
*/
