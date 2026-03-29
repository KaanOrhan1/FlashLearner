import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import { ThemeToggle } from "components/ThemeToggle";
import { fetchUserDeck, fetchUserCards, updateCardAfterReview, updateDeckLastStudied } from "lib/firestore";
import { calculateNextReview } from "lib/spacedRepetition";
import { toast } from "sonner";
import '../styles/pages.css';

// ============================================
// STYLING
// ============================================
const styles = {
  container: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    backgroundColor: "var(--background-color)",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "16px",
  },
  backBtn: {
    padding: "8px 12px",
    backgroundColor: "var(--gray-light)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--text-primary)",
    transition: "background-color 0.2s",
  },
  deckInfo: {
    flex: 1,
    marginLeft: "20px",
  },
  deckName: {
    fontSize: "22px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
    marginBottom: "4px",
  },
  progress: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    margin: 0,
  },
  modeLabel: {
    fontSize: "11px",
    color: "var(--primary-color)",
    fontWeight: "600",
    marginTop: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  addCardBtn: {
    padding: "8px 16px",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "white",
    transition: "background-color 0.2s",
  },

  // LOADING STATE
  loadingContainer: {
    textAlign: "center",
    padding: "60px 20px",
    color: "var(--text-secondary)",
  },
  loadingText: {
    fontSize: "16px",
    fontWeight: "500",
  },

  // CARD DISPLAY
  cardContainer: {
    backgroundColor: "var(--card-color)",
    borderRadius: "12px",
    border: "2px solid var(--border-color)",
    padding: "48px 32px",
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "24px",
  },
  cardLabel: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "16px",
    fontWeight: "600",
  },
  cardContent: {
    fontSize: "28px",
    fontWeight: "600",
    color: "var(--text-primary)",
    textAlign: "center",
    lineHeight: "1.6",
    wordBreak: "break-word",
    minHeight: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // BUTTONS
  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  showAnswerBtn: {
    padding: "14px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    transition: "background-color 0.2s",
  },
  ratingBtn: (quality, isSelected) => ({
    padding: "16px 12px",
    backgroundColor:
      quality === 0 ? "#ef4444" :
      quality === 1 ? "#f87171" :
      quality === 2 ? "#fb923c" :
      quality === 3 ? "#f59e0b" :
      quality === 4 ? "#84cc16" :
      "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    minWidth: "80px",
    opacity: isSelected ? 1 : 0.9,
    transform: isSelected ? "scale(1.05)" : "scale(1)",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  }),
  ratingValue: {
    fontSize: "20px",
    fontWeight: "700",
  },
  ratingLabel: {
    fontSize: "10px",
    opacity: 0.9,
  },

  // COMPLETION SCREEN
  completionContainer: {
    backgroundColor: "var(--card-color)",
    borderRadius: "12px",
    border: "2px solid var(--border-color)",
    padding: "48px 32px",
    textAlign: "center",
  },
  completionEmoji: {
    fontSize: "56px",
    marginBottom: "24px",
  },
  completionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
    marginBottom: "12px",
  },
  completionMessage: {
    fontSize: "16px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    marginBottom: "24px",
  },
  dashboardBtn: {
    padding: "12px 32px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    transition: "background-color 0.2s",
  },

  // EMPTY STATE
  emptyContainer: {
    backgroundColor: "var(--card-color)",
    borderRadius: "12px",
    border: "2px solid var(--border-color)",
    padding: "48px 32px",
    textAlign: "center",
  },
};

// ============================================
// RATING LABELS FOR SM-2
// ============================================
const RATINGS = [
  { quality: 0, label: "Blackout", description: "Complete blank" },
  { quality: 1, label: "Very Hard", description: "Wrong answer" },
  { quality: 2, label: "Hard", description: "Difficult" },
  { quality: 3, label: "Okay", description: "Difficult but correct" },
  { quality: 4, label: "Easy", description: "Quick response" },
  { quality: 5, label: "Perfect", description: "Instant recall" },
];

// ============================================
// COMPONENT
// ============================================
export function StudySession() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Determine study mode from query parameter
  const mode = searchParams.get("mode") === "repeat" ? "repeat" : "resume";
  const isRepeatMode = mode === "repeat";

  // State
  const [deck, setDeck] = useState(null);
  const [dueCards, setDueCards] = useState([]); // Cards to study (due or all depending on mode)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [ratingSum, setRatingSum] = useState(0);

  // Load deck and filter cards based on mode
  useEffect(() => {
    if (!user) return;

    async function loadStudySession() {
      try {
        console.log(`[StudySession] Loading deck and cards in ${mode} mode...`);
        setLoading(true);

        // Fetch deck
        const deckData = await fetchUserDeck(user.uid, deckId);
        setDeck(deckData);
        console.log("[StudySession] Deck loaded:", deckData.name);

        // Fetch all cards
        const allCards = await fetchUserCards(user.uid, deckId);
        console.log("[StudySession] Total cards in deck:", allCards.length);

        let cardsToStudy;

        if (isRepeatMode) {
          // Repeat mode: study all cards
          console.log("🔄 [StudySession] Repeat mode - loading all cards");
          cardsToStudy = allCards;
        } else {
          // Resume mode: filter for due cards only
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const due = allCards.filter((card) => {
            const cardDueDate = card.dueAt?.toDate?.() || new Date(card.dueAt);
            const cardDate = new Date(cardDueDate);
            cardDate.setHours(0, 0, 0, 0);
            return cardDate <= today;
          });

          // Sort by due date (earliest first)
          due.sort((a, b) => {
            const aDate = a.dueAt?.toDate?.() || new Date(a.dueAt);
            const bDate = b.dueAt?.toDate?.() || new Date(b.dueAt);
            return new Date(aDate) - new Date(bDate);
          });

          cardsToStudy = due;
          console.log("[StudySession] Resume mode - due cards for today:", due.length);
        }

        setDueCards(cardsToStudy);

        if (cardsToStudy.length === 0) {
          if (isRepeatMode) {
            console.log("[StudySession] No cards in deck");
          } else {
            console.log("[StudySession] No cards due today");
            toast.info("All caught up! No cards due for review today.", {
              duration: 3000,
            });
          }
        }
      } catch (err) {
        console.error("[StudySession] Error loading:", err);
        toast.error("Failed to load study session");
      } finally {
        setLoading(false);
      }
    }

    loadStudySession();
  }, [user, deckId, isRepeatMode]);

  // Handle rating button click
  async function handleRating(quality) {
    if (submittingRating || !dueCards.length) return;

    const currentCard = dueCards[currentIndex];
    console.log("[StudySession] Rating submitted:", { quality, cardId: currentCard.id, mode });

    setSubmittingRating(true);

    try {
      // Only update Firestore in resume mode
      if (!isRepeatMode) {
        // Calculate next review using SM-2
        const updates = calculateNextReview(currentCard, quality);
        console.log("🧮 [StudySession] SM-2 calculated:", {
          easeFactor: updates.easeFactor,
          interval: updates.interval,
          nextReviewDate: updates.dueAt,
        });

        // Update card in Firestore
        await updateCardAfterReview(user.uid, deckId, currentCard.id, {
          easeFactor: updates.easeFactor,
          interval: updates.interval,
          repetitions: updates.repetitions,
          dueAt: updates.dueAt,
          lastReviewedAt: new Date(),
        });
        console.log("[StudySession] Card updated in Firestore");
      } else {
        // In repeat mode, just record the feedback without updating spaced repetition
        console.log("[StudySession] Repeat mode - feedback recorded but not persisted");
      }

      // Move to next card
      const newIndex = currentIndex + 1;
      const newReviewedCount = reviewedCount + 1;
      const newRatingSum = ratingSum + quality;
      setReviewedCount(newReviewedCount);
      setRatingSum(newRatingSum);

      if (newIndex < dueCards.length) {
        // More cards to review
        console.log(`[StudySession] Moving to next card (${newIndex + 1}/${dueCards.length})`);
        setCurrentIndex(newIndex);
        setAnswerRevealed(false);
        toast.success("Next card", { duration: 1000 });
      } else {
        // Study session complete
        console.log("[StudySession] Study session complete!");
        if (!isRepeatMode) {
          await updateDeckLastStudied(user.uid, deckId);
        }
        toast.success("Session complete! Great work!");
      }
    } catch (err) {
      console.error("[StudySession] Error submitting rating:", err);
      toast.error("Failed to save progress. Please try again.");
    } finally {
      setSubmittingRating(false);
    }
  }

  // ============================================
  // RENDER: LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
          <ThemeToggle />
        </div>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingText}>Loading study session...</div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: DECK NOT FOUND
  // ============================================
  if (!deck) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <ThemeToggle />
        </div>
        <div style={styles.emptyContainer}>
          <div style={styles.completionEmoji}></div>
          <h2 style={styles.completionTitle}>Deck Not Found</h2>
          <p style={styles.completionMessage}>The deck you're trying to study doesn't exist.</p>
          <button style={styles.dashboardBtn} onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: SESSION COMPLETE
  // ============================================
  const sessionComplete = reviewedCount > 0 && reviewedCount >= dueCards.length && dueCards.length > 0;

  if (sessionComplete) {
    const completionTitle = isRepeatMode ? "Practice Complete!" : "Congratulations!";
    const averageRating = reviewedCount > 0 ? (ratingSum / reviewedCount).toFixed(1) : 0;
    const completionMessage = isRepeatMode
      ? `You practiced <strong>${reviewedCount}</strong> card${reviewedCount !== 1 ? "s" : ""}.<br />Great job revisiting this material!`
      : `You have finished this study session.<br />You reviewed <strong>${reviewedCount}</strong> card${reviewedCount !== 1 ? "s" : ""} today.<br />Average rating: <strong>${averageRating}/5</strong><br />Keep up the great work!`;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
        </div>
        <div style={styles.completionContainer}>
          <div style={styles.completionEmoji}></div>
          <h2 style={styles.completionTitle}>{completionTitle}</h2>
          <p style={styles.completionMessage} dangerouslySetInnerHTML={{ __html: completionMessage }} />
          <button style={styles.dashboardBtn} onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: NO CARDS DUE (Resume) OR NO CARDS (Repeat)
  // ============================================
  if (dueCards.length === 0) {
    const noCardsTitle = isRepeatMode ? "No Cards in Deck" : "All Caught Up!";
    const noCardsMessage = isRepeatMode
      ? "Add cards to this deck to start practicing."
      : "No cards are due for review right now.<br />Check back later or add more cards to your deck";

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button style={styles.addCardBtn} onClick={() => navigate(`/deck/${deckId}`)}>
              Add Cards
            </button>
            <ThemeToggle />
          </div>
        </div>
        <div style={styles.emptyContainer}>
          <div style={styles.completionEmoji}></div>
          <h2 style={styles.completionTitle}>{noCardsTitle}</h2>
          <p style={styles.completionMessage} dangerouslySetInnerHTML={{ __html: noCardsMessage }} />
          <button
            style={styles.dashboardBtn}
            onClick={() => navigate(`/deck/${deckId}`)}
          >
            {isRepeatMode ? "Add Cards" : "Add More Cards"}
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: STUDY SESSION IN PROGRESS
  // ============================================
  const currentCard = dueCards[currentIndex];
  const questionProgress = `${currentIndex + 1} / ${dueCards.length}`;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.deckInfo}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <h1 style={styles.deckName}>{deck.name}</h1>
          <p style={styles.progress}>Card {questionProgress}</p>
          {isRepeatMode && <p style={styles.modeLabel}>Practice Mode</p>}
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button style={styles.addCardBtn} onClick={() => navigate(`/deck/${deckId}`)}>
            Add Card
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* CARD DISPLAY */}
      <div style={styles.cardContainer}>
        <div style={styles.cardLabel}>
          {answerRevealed ? "Answer" : "Question"}
        </div>
        <div style={styles.cardContent}>
          {answerRevealed ? currentCard.back : currentCard.front}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={styles.buttonGroup}>
        {!answerRevealed ? (
          // Show Answer Button
          <button
            style={styles.showAnswerBtn}
            onClick={() => setAnswerRevealed(true)}
            disabled={submittingRating}
          >
            Show Answer
          </button>
        ) : (
          // SM-2 Rating Buttons (0-5)
          <>
            {RATINGS.map(({ quality, label }) => (
              <button
                key={quality}
                style={styles.ratingBtn(quality)}
                onClick={() => handleRating(quality)}
                disabled={submittingRating}
                title={RATINGS.find((r) => r.quality === quality)?.description}
              >
                <div style={styles.ratingValue}>{quality}</div>
                <div style={styles.ratingLabel}>{label}</div>
              </button>
            ))}
          </>
        )}
      </div>

      {/* LOADING INDICATOR */}
      {submittingRating && (
        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
          ⏳ Saving progress...
        </div>
      )}
    </div>
  );
}
