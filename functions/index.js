/**
 * Firebase Cloud Functions for FlashLearn
 * 
 * This file contains backend functions that handle:
 * - AI-powered flashcard generation using OpenAI API
 * - Secure API key management (never exposed to frontend)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");
const cors = require("cors");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize CORS
const corsHandler = cors({ origin: true });

/**
 * Initialize OpenAI client with API key from environment
 * 
 * To set the OpenAI API key, use:
 * firebase functions:config:set openai.api_key="your_api_key_here"
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Set it with: " +
      'firebase functions:config:set openai.api_key="your_key_here"'
    );
  }

  return new OpenAI({ apiKey });
}

/**
 * Cloud Function: Generate flashcards using AI
 * 
 * POST /generateFlashcards
 * 
 * Request body:
 * {
 *   "topic": string,
 *   "cardCount": number (5, 10, or 15),
 *   "deckName": string (optional)
 * }
 * 
 * Response:
 * {
 *   "flashcards": [
 *     { "front": string, "back": string },
 *     ...
 *   ]
 * }
 */
exports.generateFlashcards = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
      }

      // Validate input
      const { topic, cardCount, deckName } = req.body;

      if (!topic || !topic.trim()) {
        return res.status(400).json({ error: "Topic is required" });
      }

      const validCounts = [5, 10, 15];
      const count = parseInt(cardCount) || 10;
      if (!validCounts.includes(count)) {
        return res.status(400).json({
          error: "Card count must be 5, 10, or 15",
        });
      }

      console.log("🤖 [CloudFunction] Generating flashcards:", { topic, count });

      // Initialize OpenAI client
      const openai = getOpenAIClient();

      // Create the prompt for flashcard generation
      const systemPrompt = `You are an expert educator creating concise flashcards for studying. 
Generate exactly ${count} educational flashcard pairs as valid JSON.

Each flashcard format:
- "front": Clear question (1-2 sentences max)
- "back": MUST be 1-2 sentences max. Definition or key concept only. No elaboration.

Requirements:
- ONLY valid JSON array output
- No markdown, code blocks, or extra text
- Accurate and educationally sound
- Front and back both must be concise
- Varied difficulty across cards
- Self-contained cards
- Format:
[
  {"front": "Q?", "back": "Brief answer."},
  {"front": "Q?", "back": "Brief answer."}
]`;

      const userPrompt = `Create ${count} concise flashcards about: "${topic}"
Return ONLY the JSON array.`;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      console.log("✅ [CloudFunction] Received OpenAI response");

      // Parse the JSON response
      let flashcards = [];
      try {
        // Try direct parsing first
        flashcards = JSON.parse(content);
      } catch (parseError) {
        // Try extracting from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (jsonMatch) {
          flashcards = JSON.parse(jsonMatch[1]);
        } else {
          // Try extracting raw JSON array
          const arrayMatch = content.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            flashcards = JSON.parse(arrayMatch[0]);
          } else {
            throw new Error("Could not parse AI response as JSON");
          }
        }
      }

      // Validate flashcards format
      if (!Array.isArray(flashcards)) {
        throw new Error("Response is not an array");
      }

      if (flashcards.length === 0) {
        throw new Error("AI generated no flashcards");
      }

      // Validate each flashcard has front and back
      flashcards = flashcards
        .filter((card) => card && card.front && card.back)
        .slice(0, count)
        .map((card) => ({
          front: String(card.front || "").trim(),
          back: String(card.back || "").trim(),
        }));

      if (flashcards.length === 0) {
        throw new Error("No valid flashcards after processing");
      }

      console.log(
        "✅ [CloudFunction] Generated",
        flashcards.length,
        "flashcards"
      );

      return res.status(200).json({
        success: true,
        flashcards: flashcards,
        count: flashcards.length,
      });
    } catch (error) {
      console.error("❌ [CloudFunction] Error:", error.message);

      const statusCode = error.status || 500;
      const message = error.message || "Failed to generate flashcards";

      return res.status(statusCode).json({
        error: message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  });
});

/**
 * Cloud Function: Health check
 * GET /healthCheck
 */
exports.healthCheck = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });
});
