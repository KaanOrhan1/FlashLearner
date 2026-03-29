/**
 * Simplified SM-2 Spaced Repetition Algorithm
 * Suitable for undergraduate FYP - No AI/ML, just mathematical scheduling
 * 
 * Each card has:
 * - easeFactor: How easy the card is (starts at 2.5)
 * - interval: Days until next review
 * - repetitions: Number of successful reviews
 * - nextReviewDate: When to review next
 */

// Default values for new cards
export const DEFAULT_CARD_DATA = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReviewDate: new Date().toISOString()
};

// Response quality mapping
export const RESPONSE_QUALITY = {
  FORGOT: 0,        // Complete blackout
  PARTIAL: 3,       // Remembered with difficulty
  CORRECT: 5        // Perfect recall
};

/**
 * Calculate the next review date based on user response
 * Maps 0-5 quality scale to SM-2 algorithm
 * @param {Object} card - Current card data with spaced repetition fields
 * @param {number} quality - Response quality (0-5, where 0=blackout, 5=perfect)
 * @returns {Object} Updated card data with SM-2 values
 */
export const calculateNextReview = (card, quality) => {
  let { easeFactor = 2.5, interval = 0, repetitions = 0 } = card;
  
  // Minimum ease factor to prevent cards becoming too difficult
  const MIN_EASE_FACTOR = 1.3;
  const MAX_EASE_FACTOR = 3.0;
  
  // Map 0-5 scale to SM-2 algorithm behavior
  // 0-1: Complete failure - reset progress
  // 2: Hard recall - minimal progress
  // 3: Medium - partial progress
  // 4-5: Good/Perfect - standard progression
  
  if (quality <= 1) {
    // Forgot or very hard - reset progress
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.3);
  } else if (quality === 2) {
    // Hard - minimal progress
    repetitions += 1;
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * 1.1);
    }
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
  } else if (quality === 3) {
    // Okay - partial progress
    repetitions += 1;
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * 1.2);
    }
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.1);
  } else if (quality >= 4) {
    // Good/Perfect - standard SM-2 progression
    repetitions += 1;
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    // Increase ease factor for perfect recalls
    if (quality === 5) {
      easeFactor = Math.min(MAX_EASE_FACTOR, easeFactor + 0.2);
    } else {
      easeFactor = Math.min(MAX_EASE_FACTOR, easeFactor + 0.1);
    }
  }
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  return {
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    interval,
    repetitions,
    dueAt: nextReviewDate, // Use Firestore Timestamp format
    lastReviewedAt: new Date(),
  };
};

/**
 * Check if a card is due for review
 * @param {Object} card - Card with nextReviewDate
 * @returns {boolean} True if card is due
 */
export const isCardDue = (card) => {
  if (!card.nextReviewDate) return true;
  return new Date(card.nextReviewDate) <= new Date();
};

/**
 * Sort cards by review priority (most overdue first)
 * @param {Array} cards - Array of cards
 * @returns {Array} Sorted cards
 */
export const sortByPriority = (cards) => {
  return [...cards].sort((a, b) => {
    const dateA = new Date(a.nextReviewDate || 0);
    const dateB = new Date(b.nextReviewDate || 0);
    return dateA - dateB;
  });
};

/**
 * Get statistics for a deck
 * @param {Array} cards - Array of cards in the deck
 * @returns {Object} Deck statistics
 */
export const getDeckStats = (cards) => {
  const now = new Date();
  const dueCards = cards.filter(card => isCardDue(card));
  const masteredCards = cards.filter(card => card.repetitions >= 5 && card.interval >= 21);
  const learningCards = cards.filter(card => card.repetitions > 0 && card.repetitions < 5);
  const newCards = cards.filter(card => card.repetitions === 0);
  
  return {
    total: cards.length,
    due: dueCards.length,
    mastered: masteredCards.length,
    learning: learningCards.length,
    new: newCards.length
      };
};