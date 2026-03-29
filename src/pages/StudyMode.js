import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import { fetchUserDeck, fetchUserCards, updateCardAfterReview, updateDeckLastStudied } from "lib/firestore";
import { calculateNextReview, isCardDue, sortByPriority } from "lib/spacedRepetition";
import { toast } from "sonner";

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    backgroundColor: "var(--background-color)",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  addCardBtn: {
    padding: "8px 16px",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "white",
    transition: "background-color 0.2s",
  },
  deckName: {
    fontSize: "20px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
  },
  progress: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginTop: "8px",
  },
  card: {
    backgroundColor: "var(--card-color)",
    borderRadius: "12px",
    border: "1px solid var(--border-color)",
    padding: "40px 24px",
    minHeight: "400px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "24px",
    userSelect: "none",
    transition: "all 0.3s ease",
  },
  cardHovered: {
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
  },
  cardSide: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "16px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  cardContent: {
    fontSize: "24px",
    fontWeight: "500",
    color: "var(--text-primary)",
    textAlign: "center",
    lineHeight: "1.6",
    wordBreak: "break-word",
  },
  cardHint: {
    fontSize: "12px",
    color: "var(--border-color)",
    marginTop: "24px",
    fontStyle: "italic",
  },
  buttons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  qualityBtn: (quality) => ({
    padding: "12px 20px",
    backgroundColor:
      quality === 0
        ? "#ef4444"
        : quality === 3
          ? "#f59e0b"
          : "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    minWidth: "100px",
  }),
  qualityLabel: (quality) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }),
  qualityValue: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  qualityText: {
    fontSize: "12px",
  },
  completion: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "40px 24px",
    textAlign: "center",
    marginBottom: "24px",
  },
  completionEmoji: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  completionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "12px",
  },
  completionStats: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "24px",
    lineHeight: "1.8",
  },
  completionBtn: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
};

export function StudyMode() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studying, setStudying] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Load deck and cards
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        setLoading(true);
        const deckData = await fetchUserDeck(user.uid, deckId);
        setDeck(deckData);

        const cardsData = await fetchUserCards(user.uid, deckId);
        setCards(cardsData);

        // Filter for due cards and sort by priority
        const due = cardsData.filter(isCardDue);
        const sorted = sortByPriority(due);
        setDueCards(sorted);

        if (sorted.length === 0) {
          toast.info("No cards to study right now");
        }
      } catch (err) {
        console.error("Error loading study mode:", err);
        toast.error("Failed to load deck");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, deckId]);

  // Handle quality rating
  async function handleQuality(quality) {
    if (studying || !dueCards.length) return;

    const currentCard = dueCards[currentIndex];
    setStudying(true);

    try {
      // Calculate new SM-2 values
      const updates = calculateNextReview(currentCard, quality);

      // Update card in Firestore
      await updateCardAfterReview(user.uid, deckId, currentCard.id, {
        easeFactor: updates.easeFactor,
        interval: updates.interval,
        repetitions: updates.repetitions,
        dueAt: new Date(updates.nextReviewDate),
        lastReviewedAt: new Date(),
      });

      // Move to next card
      const newIndex = currentIndex + 1;
      setReviewedCount(newIndex);

      if (newIndex < dueCards.length) {
        setCurrentIndex(newIndex);
        setIsFlipped(false);
      } else {
        // Study session complete
        await updateDeckLastStudied(user.uid, deckId);
      }
    } catch (err) {
      console.error("Error updating card:", err);
      toast.error("Failed to save progress");
    } finally {
      setStudying(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <button style={styles.addCardBtn} onClick={() => navigate(`/deck/${deckId}`)}>
            ➕ Add Card
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
          Loading cards...
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--error-color)" }}>
          Deck not found
        </div>
      </div>
    );
  }

  const isStudyComplete = reviewedCount >= dueCards.length && dueCards.length > 0;

  if (isStudyComplete) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
        </div>

        <div style={styles.completion}>
          <div style={styles.completionEmoji}></div>
          <h2 style={styles.completionTitle}>Study Session Complete!</h2>
          <div style={styles.completionStats}>
            <p>You reviewed <strong>{reviewedCount}</strong> card{reviewedCount !== 1 ? "s" : ""}</p>
            <p>Keep up the great work!</p>
          </div>
          <button
            style={styles.completionBtn}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!dueCards.length) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <button style={styles.addCardBtn} onClick={() => navigate(`/deck/${deckId}`)}>
            Add Card
          </button>
        </div>

        <div style={styles.completion}>
          <div style={styles.completionEmoji}></div>
          <h2 style={styles.completionTitle}>All Caught Up!</h2>
          <div style={styles.completionStats}>
            <p>No cards due for review right now.</p>
            <p>Check back later or add more cards to study.</p>
          </div>
          <button
            style={styles.completionBtn}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <h2 style={styles.deckName}>{deck.name}</h2>
          <p style={styles.progress}>
            Card {currentIndex + 1} of {dueCards.length}
          </p>
        </div>
        <button style={styles.addCardBtn} onClick={() => navigate(`/deck/${deckId}`)}>
          Add Card
        </button>
      </div>

      {/* Card */}
      <div
        style={{
          ...styles.card,
          ...(isFlipped ? {} : {}),
        }}
        onClick={() => !studying && setIsFlipped(!isFlipped)}
      >
        <div style={styles.cardSide}>{isFlipped ? "Answer" : "Question"}</div>
        <div style={styles.cardContent}>
          {isFlipped ? currentCard.back : currentCard.front}
        </div>
        {!isFlipped && <div style={styles.cardHint}>Click to reveal answer</div>}
      </div>

      {/* Quality Rating Buttons (only show after flip) */}
      {isFlipped ? (
        <div style={styles.buttons}>
          <button
            style={styles.qualityBtn(0)}
            onClick={() => handleQuality(0)}
            disabled={studying}
          >
            <div style={styles.qualityLabel(0)}>
              <div style={styles.qualityValue}>0</div>
              <div style={styles.qualityText}>Forgot</div>
            </div>
          </button>

          <button
            style={styles.qualityBtn(3)}
            onClick={() => handleQuality(3)}
            disabled={studying}
          >
            <div style={styles.qualityLabel(3)}>
              <div style={styles.qualityValue}>3</div>
              <div style={styles.qualityText}>Hard</div>
            </div>
          </button>

          <button
            style={styles.qualityBtn(5)}
            onClick={() => handleQuality(5)}
            disabled={studying}
          >
            <div style={styles.qualityLabel(5)}>
              <div style={styles.qualityValue}>5</div>
              <div style={styles.qualityText}>Perfect</div>
            </div>
          </button>
        </div>
      ) : null}
    </div>
  );
}
