/**
 * AI Deck Generation - Frontend
 * 
 * Calls Firebase Cloud Function (secure backend) to generate flashcards.
 * The OpenAI API key is stored securely in Cloud Functions, never in frontend.
 * 
 * Cloud Function: generateFlashcards
 * Location: functions/index.js
 * Endpoint: https://[REGION]-[PROJECT_ID].cloudfunctions.net/generateFlashcards
 */

/**
 * Get the Firebase Cloud Function URL for generating flashcards
 * 
 * For local development, update this to your emulator URL
 * For production, update to your deployed function URL
 */
function getGenerateFlashcardsURL() {
  // Development: Firebase emulator
  const isDev = process.env.NODE_ENV === "development";
  
  if (isDev && process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR) {
    return process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR + "/generateFlashcards";
  }

  // Production: Deployed Cloud Function
  // Update this URL after deploying your Cloud Functions
  const functionUrl = process.env.REACT_APP_GENERATE_FLASHCARDS_URL;
  
  if (!functionUrl) {
    throw new Error(
      "\n❌ AI Generation Setup Required\n\n" +
      "The Cloud Function URL is not configured.\n\n" +
      "To setup AI deck generation:\n\n" +
      "1. Deploy Cloud Functions:\n" +
      "   firebase deploy --only functions\n\n" +
      "2. Get your function URL from:\n" +
      "   firebase functions:list\n\n" +
      "3. Add to your .env file:\n" +
      "   REACT_APP_GENERATE_FLASHCARDS_URL=https://REGION-PROJECT_ID.cloudfunctions.net/generateFlashcards\n\n" +
      "4. Restart React dev server:\n" +
      "   npm start\n\n" +
      "For detailed setup instructions, see AI_SETUP.md"
    );
  }

  return functionUrl;
}

/**
 * Generates flashcards for a given topic using Firebase Cloud Function + OpenAI
 * 
 * @param {string} topic - The topic to generate flashcards for
 * @param {number} cardCount - Number of flashcards to generate (5, 10, or 15)
 * @returns {Promise<Array>} Array of objects with {front, back}
 */
export async function generateAiDeck(topic, cardCount = 10) {
  console.log("🤖 [AI] Generating deck for topic:", topic, "Cards:", cardCount);

  if (!topic || !topic.trim()) {
    throw new Error("Topic is required for AI generation");
  }

  const validCardCounts = [5, 10, 15];
  if (!validCardCounts.includes(cardCount)) {
    cardCount = 10;
  }

  try {
    const url = getGenerateFlashcardsURL();

    console.log("📡 [AI] Calling Cloud Function:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topic.trim(),
        cardCount,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Cloud Function error: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Response is not JSON
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.flashcards || !Array.isArray(data.flashcards)) {
      throw new Error("Invalid response format from Cloud Function");
    }

    if (data.flashcards.length === 0) {
      throw new Error("Cloud Function generated no flashcards");
    }

    console.log("[AI] Generated", data.flashcards.length, "flashcards");

    // Transform response format to match our card structure (front/back)
    return data.flashcards.map((card) => ({
      question: card.front || card.question || "",
      answer: card.back || card.answer || "",
    }));
  } catch (error) {
    console.error("[AI] Error generating deck:", error.message);
    throw new Error(
      error.message || "Failed to generate flashcards. Please try again."
    );
  }
}
