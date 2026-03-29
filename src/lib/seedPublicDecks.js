/**
 * Seed Public Decks - Add curated featured decks to your Firestore database
 * 
 * This file helps you populate the publicDecks collection in Firestore.
 * Use this to create featured decks that appear in the dashboard.
 * 
 * To use manually in browser console:
 * 1. Copy-paste the seedSampleDecks function to browser console
 * 2. Call: seedSampleDecks()
 * 3. Decks will be added to your Firestore publicDecks collection
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Add a public deck with cards
 * @param {Object} deckData - { name, description, isFeatured, cards: [{front, back}, ...] }
 */
export async function addPublicDeck(deckData) {
  try {
    const { name, description, isFeatured = false, cards = [] } = deckData;

    if (!name || !cards.length) {
      throw new Error("Deck name and cards are required");
    }

    // Create deck reference
    const publicDecksCol = collection(db, "publicDecks");
    const deckRef = await addDoc(publicDecksCol, {
      name,
      description,
      isFeatured,
      cardCount: cards.length,
      createdAt: serverTimestamp(),
    });

    // Add cards in batch
    const batch = writeBatch(db);
    const publicCardsCol = collection(db, "publicDecks", deckRef.id, "cards");

    cards.forEach((card) => {
      const cardRef = doc(publicCardsCol);
      batch.set(cardRef, {
        front: card.front,
        back: card.back,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();

    console.log(`[SeedPublicDecks] Added featured deck: "${name}" (${cards.length} cards)`);
    return deckRef.id;
  } catch (err) {
    console.error("[SeedPublicDecks] Error adding public deck:", err);
    throw err;
  }
}

/**
 * Sample featured decks - Use these as templates
 */
export const SAMPLE_DECKS = {
  spanish_basics: {
    name: "Spanish Basics",
    description: "Essential Spanish vocabulary and phrases for beginners",
    isFeatured: true,
    cards: [
      { front: "Hello", back: "Hola" },
      { front: "Good morning", back: "Buenos días" },
      { front: "Thank you", back: "Gracias" },
      { front: "Please", back: "Por favor" },
      { front: "Yes", back: "Sí" },
      { front: "No", back: "No" },
      { front: "I love you", back: "Te quiero" },
      { front: "How are you?", back: "¿Cómo estás?" },
      { front: "My name is...", back: "Mi nombre es..." },
      { front: "Where is the bathroom?", back: "¿Dónde está el baño?" },
    ],
  },

  calculus_derivatives: {
    name: "Calculus - Derivatives",
    description: "Core derivative rules and concepts",
    isFeatured: true,
    cards: [
      {
        front: "What is the Power Rule?",
        back: "If f(x) = x^n, then f'(x) = n*x^(n-1)",
      },
      {
        front: "What is the Product Rule?",
        back: "If f(x) = g(x)h(x), then f'(x) = g'(x)h(x) + g(x)h'(x)",
      },
      {
        front: "What is the Chain Rule?",
        back: "If f(x) = g(h(x)), then f'(x) = g'(h(x)) * h'(x)",
      },
      {
        front: "Find the derivative of sin(x)",
        back: "d/dx[sin(x)] = cos(x)",
      },
      {
        front: "Find the derivative of e^x",
        back: "d/dx[e^x] = e^x",
      },
      {
        front: "What is the Quotient Rule?",
        back: "If f(x) = g(x)/h(x), then f'(x) = [g'(x)h(x) - g(x)h'(x)] / [h(x)]^2",
      },
      {
        front: "What does f'(x) > 0 indicate?",
        back: "The function is increasing on that interval",
      },
      {
        front: "What is a critical point?",
        back: "A point where f'(x) = 0 or f'(x) is undefined",
      },
    ],
  },

  python_basics: {
    name: "Python Fundamentals",
    description: "Introduction to Python programming concepts",
    isFeatured: true,
    cards: [
      {
        front: "How do you print text in Python?",
        back: 'Use print() function: print("Hello, World!")',
      },
      {
        front: "What is a list in Python?",
        back:
          "An ordered collection of items that can be of different types, created with []",
      },
      {
        front: "How do you create a dictionary?",
        back: 'Use curly braces with key-value pairs: {"name": "John", "age": 30}',
      },
      {
        front: "What is a for loop?",
        back: "A loop that repeats code for each item in a sequence",
      },
      {
        front: "What is an if-else statement?",
        back:
          "A conditional statement that executes different code based on whether a condition is true or false",
      },
      {
        front: "How do you define a function?",
        back:
          "Use the def keyword: def function_name(parameters): return result",
      },
      {
        front: "What is a string?",
        back:
          'A sequence of characters enclosed in single or double quotes: "Hello"',
      },
      {
        front: "How do you access list items?",
        back:
          "Using index notation: list_name[0] for the first item (Python uses 0-based indexing)",
      },
    ],
  },

  world_capitals: {
    name: "World Capitals",
    description: "Test your knowledge of world city capitals",
    isFeatured: true,
    cards: [
      { front: "Capital of France", back: "Paris" },
      { front: "Capital of Japan", back: "Tokyo" },
      { front: "Capital of Brazil", back: "Brasília" },
      { front: "Capital of Egypt", back: "Cairo" },
      { front: "Capital of India", back: "New Delhi" },
      { front: "Capital of Australia", back: "Canberra" },
      { front: "Capital of Canada", back: "Ottawa" },
      { front: "Capital of South Korea", back: "Seoul" },
      { front: "Capital of Mexico", back: "Mexico City" },
      { front: "Capital of Russia", back: "Moscow" },
    ],
  },

  biology_cells: {
    name: "Cellular Biology",
    description: "Cell structure and function fundamentals",
    isFeatured: false,
    cards: [
      {
        front: "What are the two main types of cells?",
        back: "Prokaryotic (bacteria) and eukaryotic (animals, plants, fungi)",
      },
      {
        front: "What is the function of the mitochondria?",
        back: "Produces energy (ATP) through cellular respiration",
      },
      {
        front: "What does the cell nucleus contain?",
        back: "Genetic material (DNA) and RNA",
      },
      {
        front: "What is the function of ribosomes?",
        back: "Protein synthesis - converting mRNA into proteins",
      },
      {
        front: "What is photosynthesis?",
        back:
          "Process in plants that converts light energy, water, and CO2 into glucose and oxygen",
      },
      {
        front: "What is the function of the Golgi apparatus?",
        back:
          "Modifies, packages, and ships proteins and lipids to their destinations",
      },
      {
        front: "What protects the cell?",
        back: "The cell membrane (plasma membrane)",
      },
      {
        front: "What is the function of lysosomes?",
        back:
          "Breaks down waste materials and dead cell parts through digestion",
      },
    ],
  },
};

/**
 * Seed all sample decks - adds them to publicDecks collection
 */
export async function seedSampleDecks() {
  console.log("🌱 Starting to seed featured decks...");

  try {
    const createdDecks = [];

    for (const [key, deckData] of Object.entries(SAMPLE_DECKS)) {
      try {
        const deckId = await addPublicDeck(deckData);
        createdDecks.push({ id: deckId, name: deckData.name });
      } catch (err) {
        console.error(`[SeedPublicDecks] Failed to add ${key}:`, err.message);
      }
    }

    console.log(
      `\n[SeedPublicDecks] Seeded ${createdDecks.length} featured decks:\n`,
      createdDecks
    );
    return createdDecks;
  } catch (err) {
    console.error("[SeedPublicDecks] Error seeding decks:", err);
    throw err;
  }
}

/**
 * Add a custom featured deck
 * Usage in console:
 * addCustomDeck({
 *   name: "My Deck",
 *   description: "My description",
 *   isFeatured: true,
 *   cards: [{front: "Q", back: "A"}, ...]
 * })
 */
export async function addCustomDeck(deckData) {
  return await addPublicDeck(deckData);
}
