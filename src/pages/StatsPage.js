import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import { ThemeToggle } from "components/ThemeToggle";
import { fetchUserDecks, fetchUserCards } from "lib/firestore";
import { toast } from "sonner";
import '../styles/pages.css';

// ============================================
// STYLING - Using CSS Variables for Theme Support
// ============================================
const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    backgroundColor: "var(--background-color)",
    color: "var(--text-primary)",
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
    backgroundColor: "var(--primary-color)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "white",
    transition: "all 0.2s",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginTop: "8px",
  },

  // LOADING STATE
  loadingContainer: {
    textAlign: "center",
    padding: "60px 20px",
    color: "var(--text-secondary)",
  },

  // EMPTY STATE
  emptyContainer: {
    backgroundColor: "var(--card-color)",
    borderRadius: "12px",
    border: "1px solid var(--border-color)",
    padding: "48px 32px",
    textAlign: "center",
    marginTop: "32px",
  },
  emptyEmoji: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: "12px",
    margin: 0,
  },
  emptyMessage: {
    fontSize: "15px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    marginBottom: "24px",
  },

  // STATS GRID
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
    marginTop: "24px",
  },

  // DECK CARD
  deckCard: {
    backgroundColor: "var(--card-color)",
    borderRadius: "12px",
    border: "1px solid var(--border-color)",
    padding: "24px",
    boxShadow: "0 1px 3px var(--card-item-shadow)",
    transition: "all 0.2s",
  },
  deckCardHover: {
    boxShadow: "0 10px 15px var(--card-item-shadow)",
    borderColor: "var(--primary-color)",
  },
  deckName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-primary)",
    marginBottom: "16px",
    margin: 0,
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "12px",
    marginBottom: "12px",
    borderBottom: "1px solid var(--border-color)",
  },
  statRowLast: {
    borderBottom: "none",
    marginBottom: "0",
    paddingBottom: "0",
  },
  statLabel: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  ratingBadge: (rating) => ({
    fontSize: "16px",
    fontWeight: "700",
    color:
      rating >= 4.5 ? "#10b981" :
      rating >= 3.5 ? "#f59e0b" :
      "#ef4444",
    padding: "4px 8px",
    borderRadius: "4px",
    backgroundColor:
      rating >= 4.5 ? "rgba(16, 185, 129, 0.1)" :
      rating >= 3.5 ? "rgba(245, 158, 11, 0.1)" :
      "rgba(239, 68, 68, 0.1)",
  }),

  // SUMMARY SECTION
  summarySection: {
    backgroundColor: "var(--card-color)",
    borderRadius: "12px",
    border: "1px solid var(--border-color)",
    padding: "24px",
    marginBottom: "32px",
  },
  summaryTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-primary)",
    marginBottom: "16px",
    margin: 0,
  },
  summaryStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  summaryCard: {
    textAlign: "center",
    padding: "12px",
  },
  summaryCardValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "var(--primary-color)",
    marginBottom: "4px",
  },
  summaryCardLabel: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    fontWeight: "500",
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate average rating from card's easeFactor
 * Scale: 1.3 (hardest) -> 0, 2.5 (medium) -> 2.5, 3.0 (easiest) -> 5
 */
function getAverageRating(reviewedCards) {
  if (reviewedCards.length === 0) return 0;

  const avgEaseFactor = 
    reviewedCards.reduce((sum, card) => sum + (card.easeFactor || 2.5), 0) / 
    reviewedCards.length;

  // Scale from [1.3, 3.0] to [0, 5]
  const MIN_EASE = 1.3;
  const MAX_EASE = 3.0;
  const rating = ((avgEaseFactor - MIN_EASE) / (MAX_EASE - MIN_EASE)) * 5;

  return Math.round(rating * 10) / 10; // Round to 1 decimal
}

/**
 * Load stats for all decks
 */
async function loadAllStats(userId) {
  const decks = await fetchUserDecks(userId);
  
  const statsPromises = decks.map(async (deck) => {
    const cards = await fetchUserCards(userId, deck.id);
    
    // Count reviewed cards
    const reviewedCards = cards.filter((card) => (card.repetitions || 0) > 0);
    
    // Calculate average rating
    const avgRating = getAverageRating(reviewedCards);

    return {
      id: deck.id,
      name: deck.name,
      totalCards: cards.length,
      reviewedCards: reviewedCards.length,
      avgRating,
      allCards: cards,
    };
  });

  return Promise.all(statsPromises);
}

// ============================================
// COMPONENT
// ============================================
export function StatsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deckStats, setDeckStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load stats on mount
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        console.log("[StatsPage] Loading statistics for all decks...");
        setLoading(true);

        const stats = await loadAllStats(user.uid);
        setDeckStats(stats);

        console.log("[StatsPage] Statistics loaded:", stats.length, "decks");
      } catch (err) {
        console.error("[StatsPage] Error loading stats:", err);
        toast.error("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // ============================================
  // RENDER: LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <h1 style={styles.title}>Study Statistics</h1>
        </div>
        <div style={styles.loadingContainer}>
          <div style={{ fontSize: "16px", fontWeight: "500", color: "var(--text-primary)" }}>Loading your statistics...</div>
        </div>
      </div>
    );
  }

  // ============================================
  // CALCULATE TOTALS
  // ============================================
  const totalDecks = deckStats.length;
  const totalCards = deckStats.reduce((sum, d) => sum + d.totalCards, 0);
  const totalReviewed = deckStats.reduce((sum, d) => sum + d.reviewedCards, 0);
  const overallAvgRating = deckStats.length > 0
    ? Math.round(
        (deckStats.reduce((sum, d) => sum + d.avgRating, 0) / deckStats.length) * 10
      ) / 10
    : 0;

  // ============================================
  // RENDER: EMPTY STATE
  // ============================================
  if (deckStats.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <h1 style={styles.title}>Study Statistics</h1>
        </div>

        <div style={styles.emptyContainer}>
          <div style={styles.emptyEmoji}></div>
          <h2 style={styles.emptyTitle}>No Decks Yet</h2>
          <p style={styles.emptyMessage}>
            Create your first deck on the Dashboard to start tracking statistics.
          </p>
          <button
            style={{
              padding: "10px 24px",
              backgroundColor: "var(--primary-color)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: STATISTICS PAGE
  // ============================================
  return (
    <div style={styles.container}>
      <ThemeToggle />
      {/* HEADER */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <div>
          <h1 style={styles.title}>Study Statistics</h1>
          <p style={styles.subtitle}>Track your learning progress across all decks</p>
        </div>
      </div>

      {/* SUMMARY SECTION */}
      <div style={styles.summarySection}>
        <h2 style={styles.summaryTitle}>Overall Progress</h2>
        <div style={styles.summaryStats}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryCardValue}>{totalDecks}</div>
            <div style={styles.summaryCardLabel}>Total Decks</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryCardValue}>{totalCards}</div>
            <div style={styles.summaryCardLabel}>Total Cards</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryCardValue}>{totalReviewed}</div>
            <div style={styles.summaryCardLabel}>Cards Reviewed</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryCardValue} style={{ color: "#f59e0b" }}>
              {overallAvgRating}/5
            </div>
            <div style={styles.summaryCardLabel}>Average Rating</div>
          </div>
        </div>
      </div>

      {/* DECK STATS GRID */}
      <div className="deck-stats-section">
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "16px" }}>
          Deck Statistics
        </h2>
        <div style={styles.statsGrid}>
          {deckStats.map((deck) => (
            <div key={deck.id} style={styles.deckCard}>
              <h3 style={styles.deckName}>{deck.name}</h3>

              <div style={styles.statRow}>
                <span style={styles.statLabel}>Total Cards</span>
                <span style={styles.statValue}>{deck.totalCards}</span>
              </div>

              <div style={styles.statRow}>
                <span style={styles.statLabel}>Reviewed</span>
                <span style={styles.statValue}>
                  {deck.reviewedCards} / {deck.totalCards}
                </span>
              </div>

              <div style={styles.statRow}>
                <span style={styles.statLabel}>Review %</span>
                <span style={styles.statValue}>
                  {deck.totalCards > 0
                    ? Math.round((deck.reviewedCards / deck.totalCards) * 100)
                    : 0}
                  %
                </span>
              </div>

              <div style={{ ...styles.statRow, ...styles.statRowLast }}>
                <span style={styles.statLabel}>Avg Rating</span>
                <span style={styles.ratingBadge(deck.avgRating)}>
                  {deck.avgRating.toFixed(1)}/5
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
