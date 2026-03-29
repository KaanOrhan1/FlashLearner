import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import { ThemeToggle } from "components/ThemeToggle";
import { addUserCard, fetchUserCards, fetchUserDeck, updateUserDeck, deleteUserCard, listenToUserCards, updateCardAfterReview, updateUserCard, shareDeckToCommunity, checkIfDeckIsShared } from "lib/firestore";
import { calculateNextReview } from "lib/spacedRepetition";
import { toast } from "sonner";
import '../styles/pages.css';

const styles = {
  container: {
    maxWidth: "800px",
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
    alignItems: "flex-start",
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
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: "28px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: "0 0 8px 0",
  },
  deckDescription: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: 0,
  },
  progressInfo: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    marginTop: "12px",
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  progressStat: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  progressValue: {
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  section: {
    backgroundColor: "var(--card-color)",
    borderRadius: "12px",
    border: "1px solid var(--border-color)",
    padding: "24px",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-primary)",
    marginBottom: "20px",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-primary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    padding: "12px 14px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--input-bg)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "12px 14px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--input-bg)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    minHeight: "100px",
    resize: "vertical",
  },
  primaryBtn: {
    padding: "12px 20px",
    backgroundColor: "var(--primary-color)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "background-color 0.2s",
  },
  secondaryBtn: {
    padding: "8px 12px",
    backgroundColor: "var(--button-danger-bg)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    marginRight: "8px",
  },
  dangerBtn: {
    padding: "8px 12px",
    backgroundColor: "var(--button-danger-bg)",
    color: "var(--button-danger-color)",
    border: "1px solid var(--button-danger-border-color)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
    cursor: "not-allowed",
    opacity: 0.6,
  },
  cardsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardItem: {
    backgroundColor: "var(--gray-light)",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    padding: "16px",
    transition: "all 0.2s",
  },
  cardItemHover: {
    boxShadow: "0 4px 12px var(--card-item-shadow)",
    borderColor: "var(--border-color)",
  },
  cardContent: {
    marginBottom: "12px",
  },
  cardFront: {
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--text-primary)",
    marginBottom: "8px",
    wordBreak: "break-word",
  },
  cardBack: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
    paddingTop: "12px",
    borderTop: "1px solid var(--border-color)",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "var(--text-secondary)",
    fontSize: "14px",
  },
  ratingContainer: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-color)",
  },
  ratingLabel: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    fontWeight: "500",
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  ratingButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  ratingBtn: (quality) => ({
    padding: "10px 14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "70px",
    backgroundColor:
      quality === 0
        ? "#fee2e2"
        : quality === 1
          ? "#fecaca"
          : quality === 2
            ? "#fca5a5"
            : quality === 3
              ? "#f59e0b"
              : quality === 4
                ? "#34d399"
                : "#10b981",
    color:
      quality === 0
        ? "#991b1b"
        : quality === 1
          ? "#b91c1c"
          : quality === 2
            ? "#dc2626"
            : quality === 3
              ? "#92400e"
              : quality === 4
                ? "#047857"
                : "#065f46",
  }),
  ratingValue: {
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "2px",
  },
  ratingText: {
    fontSize: "11px",
    opacity: 0.8,
  },
};

export function DeckPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [editingCardId, setEditingCardId] = useState(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editingSaving, setEditingSaving] = useState(false);
  
  // Share to community
  const [sharing, setSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);
  
  // Refs for input focus management
  const frontInputRef = React.useRef(null);
  const backInputRef = React.useRef(null);

  // Monitor saving state changes for debugging
  useEffect(() => {
    console.log("⚡ saving state changed:", saving);
  }, [saving]);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const d = await fetchUserDeck(user.uid, deckId);
      setDeck(d);
      const list = await fetchUserCards(user.uid, deckId);
      setCards(list);
    } catch (err) {
      console.error("Error loading deck:", err);
      toast.error(err.message || "Failed to load deck");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;

    console.log("DeckPage useEffect: Setting up listeners", { userId: user.uid, deckId });

    // Load deck once
    (async () => {
      setLoading(true);
      try {
        const d = await fetchUserDeck(user.uid, deckId);
        setDeck(d);
        
        // Check if this deck was already shared to community
        const shared = await checkIfDeckIsShared(user.uid, deckId);
        setIsShared(shared);
        
        console.log("Deck loaded:", d.name, "- Shared:", shared);
      } catch (err) {
        console.error("Error loading deck:", err);
        toast.error(err.message || "Failed to load deck");
      } finally {
        setLoading(false);
      }
    })();

    // Set up real-time listener for cards
    console.log("Setting up real-time listener for cards...");
    const unsubscribe = listenToUserCards(user.uid, deckId, (updatedCards) => {
      console.log("Real-time update received. Cards count:", updatedCards.length);
      setCards(updatedCards);
    });

    // Cleanup: unsubscribe when component unmounts
    return () => {
      console.log("Cleaning up real-time listener");
      unsubscribe();
    };
  }, [user, deckId]);
  async function handleAddCard(e) {
    e.preventDefault();
    
    // Validate user
    if (!user) {
      console.error("No user authenticated");
      toast.error("Please log in to add cards");
      return;
    }

    // Validate inputs
    const frontTrimmed = front.trim();
    const backTrimmed = back.trim();
    
    if (!frontTrimmed) {
      console.warn("Empty front input");
      toast.error("Question is required");
      frontInputRef.current?.focus();
      return;
    }
    
    if (!backTrimmed) {
      console.warn("Empty back input");
      toast.error("Answer is required");
      backInputRef.current?.focus();
      return;
    }

    // Prevent duplicate submissions
    if (saving) {
      console.warn("Card save already in progress");
      return;
    }

    // ============================================
    // PHASE 1: INITIATE SAVE
    // ============================================
    setSaving(true);
    console.log("[Phase 1] Save initiated - Button now shows 'Saving...'");
    
    // FAILSAFE: Force reset after 10 seconds if something hangs
    const failsafeTimer = setTimeout(() => {
      console.warn("[FAILSAFE] 10-second timeout triggered - forcing reset");
      setSaving(false);
    }, 10000);
    
    try {
      // ============================================
      // PHASE 2: PREPARE DATA
      // ============================================
      const cardData = {
        front: frontTrimmed,
        back: backTrimmed,
        // SM-2 Algorithm defaults
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        dueAt: new Date(),
        createdAt: new Date(),
      };
      
      console.log("[Phase 2] Data prepared - uploading to Firestore...");
      
      // ============================================
      // PHASE 3: FIRESTORE SAVE (CRITICAL POINT)
      // ============================================
      await addUserCard(user.uid, deckId, cardData);
      console.log("[Phase 3] Firestore save SUCCESSFUL");
      
      // ============================================
      // PHASE 4: IMMEDIATE UI RESET (SYNCHRONOUS)
      // ============================================
      console.log("[Phase 4] Clearing inputs IMMEDIATELY...");
      
      // CRITICAL: Clear inputs FIRST - before anything else
      setFront("");
      setBack("");
      console.log("[Phase 4.1] Question and Answer inputs cleared");
      
      // Unlock the button IMMEDIATELY
      setSaving(false);
      console.log("[Phase 4.2] Button unlocked - shows 'Save Card'");
      
      // ============================================
      // PHASE 5: USER FEEDBACK
      // ============================================
      console.log("[Phase 5] Showing success confirmation...");
      toast.success("Card Saved!", {
        duration: 2000,
        description: "Ready to add the next card"
      });
      
      // ============================================
      // PHASE 6: AUTO-FOCUS FOR NEXT ENTRY
      // ============================================
      console.log("[Phase 6] Setting focus to Question input...");
      // Use immediate microtask to ensure DOM is updated
      queueMicrotask(() => {
        frontInputRef.current?.focus();
        console.log("[Phase 6] Cursor positioned on Question input - ready to type!");
      });
      
    } catch (err) {
      // ============================================
      // ERROR HANDLING
      // ============================================
      console.error("[SaveCard] Firestore Error:", {
        message: err.message,
        code: err.code,
        timestamp: new Date().toISOString()
      });
      
      // User-friendly error messages
      if (err.code === "permission-denied") {
        toast.error("Permission Denied", {
          description: "Check your access to this deck"
        });
      } else if (err.code === "unavailable") {
        toast.error("Network Error", {
          description: "Check your connection and try again"
        });
      } else if (err.message?.includes("quota")) {
        toast.error("Storage Quota Exceeded", {
          description: "Please try again later"
        });
      } else {
        toast.error("Failed to Save", {
          description: err.message || "Something went wrong"
        });
      }
    } finally {
      // ============================================
      // FINAL SAFETY NET
      // ============================================
      console.log("[Finally Block] Executing safety reset...");
      clearTimeout(failsafeTimer);
      setSaving(false);
      console.log("[Finally Block] Button safety reset complete");
    }
  }

  function toggleCardFlip(cardId) {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  }

  function isCardDue(card) {
    if (!card.dueAt) return true; // If no due date, it's due
    const dueDate = card.dueAt.toDate ? card.dueAt.toDate() : new Date(card.dueAt);
    return dueDate <= new Date();
  }

  function getDaysSinceDue(card) {
    if (!card.dueAt) return 0;
    const dueDate = card.dueAt.toDate ? card.dueAt.toDate() : new Date(card.dueAt);
    const today = new Date();
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  async function handleDeleteCard(cardId) {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this card?")) return;

    setDeleting(cardId);
    try {
      await deleteUserCard(user.uid, deckId, cardId);
      toast.success("Card deleted!");
      await load();
    } catch (err) {
      console.error("Error deleting card:", err);
      toast.error(err.message || "Failed to delete card");
    } finally {
      setDeleting(null);
    }
  }

  function startEditCard(card) {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  }

  function cancelEditCard() {
    setEditingCardId(null);
    setEditFront("");
    setEditBack("");
  }

  async function handleSaveEditCard() {
    if (!user || !editingCardId) return;

    const frontTrimmed = editFront.trim();
    const backTrimmed = editBack.trim();

    if (!frontTrimmed || !backTrimmed) {
      toast.error("Question and answer cannot be empty");
      return;
    }

    setEditingSaving(true);
    try {
      await updateUserCard(user.uid, deckId, editingCardId, {
        front: frontTrimmed,
        back: backTrimmed,
      });
      toast.success("Card updated!");
      cancelEditCard();
    } catch (err) {
      console.error("Error updating card:", err);
      toast.error(err.message || "Failed to update card");
    } finally {
      setEditingSaving(false);
    }
  }

  async function handleShareWithCommunity() {
    if (!user) {
      toast.error("Please log in to share a deck");
      return;
    }

    if (cards.length === 0) {
      toast.error("Cannot share an empty deck. Add some cards first!");
      return;
    }

    setSharing(true);
    try {
      console.log("[Share] Sharing deck to community:", deckId);
      const result = await shareDeckToCommunity(user.uid, deckId);
      
      setIsShared(true);
      
      if (result.isUpdate) {
        toast.success("Deck updated in community library!", {
          description: "Your changes are now visible to everyone",
          duration: 2000,
        });
      } else {
        toast.success("Deck shared with community!", {
          description: "It's now visible in Featured Decks",
          duration: 2000,
        });
      }
    } catch (err) {
      console.error("[Share] Error sharing deck:", err);
      toast.error(err.message || "Failed to share deck");
    } finally {
      setSharing(false);
    }
  }

  async function handleCardRating(cardId, quality) {
    if (!user) return;

    // Find the card
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    try {
      // Calculate SM-2 values
      const sm2Updates = calculateNextReview(card, quality);
      
      // Update in Firestore
      await updateCardAfterReview(user.uid, deckId, cardId, {
        easeFactor: sm2Updates.easeFactor,
        interval: sm2Updates.interval,
        repetitions: sm2Updates.repetitions,
        dueAt: sm2Updates.dueAt,
        lastReviewedAt: sm2Updates.lastReviewedAt,
      });

      // Hide the flip
      setFlippedCards(prev => ({
        ...prev,
        [cardId]: false
      }));

      // Show success toast based on quality
      const qualityLabels = {
        0: "Total Blackout",
        1: "Very Hard",
        2: "Hard",
        3: "Okay",
        4: "Easy",
        5: "Perfect Recall"
      };
      
      toast.success(`Rated: ${qualityLabels[quality]}`);
    } catch (err) {
      console.error("Error updating card rating:", err);
      toast.error(err.message || "Failed to save rating");
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
          Loading deck...
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
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#ef4444" }}>
          Deck not found
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ThemeToggle />
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <div style={styles.deckInfo}>
          <h1 style={styles.deckName}>{deck.name}</h1>
          {deck.description && <p style={styles.deckDescription}>{deck.description}</p>}
          <div style={styles.progressInfo}>
            <div style={styles.progressStat}>
              <span style={styles.progressValue}>{cards.length}</span>
              <span>cards total</span>
            </div>
            <div style={styles.progressStat}>
              <span style={styles.progressValue}>{cards.filter(c => isCardDue(c)).length}</span>
              <span>due for review</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleShareWithCommunity}
          disabled={sharing || cards.length === 0}
          style={{
            padding: "8px 16px",
            backgroundColor: isShared ? "#10b981" : "var(--primary-color)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: sharing || cards.length === 0 ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: "600",
            whiteSpace: "nowrap",
            opacity: sharing || cards.length === 0 ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          title={cards.length === 0 ? "Add cards before sharing" : "Share this deck to Featured Decks"}
        >
          {sharing ? "Sharing..." : isShared ? "Shared" : "Share with Community"}
        </button>
      </div>

      {/* Add Card Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Add New Card</h2>
        <form onSubmit={handleAddCard} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Question</label>
            <input
              ref={frontInputRef}
              style={styles.input}
              type="text"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="What should the student learn?"
              disabled={saving}
              autoComplete="off"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Answer</label>
            <textarea
              ref={backInputRef}
              style={styles.textarea}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="What is the correct answer?"
              disabled={saving}
              autoComplete="off"
            />
          </div>
          <button
            key={saving ? 'saving' : 'ready'}
            type="submit"
            style={{
              ...styles.primaryBtn,
              ...(saving ? styles.buttonDisabled : {}),
            }}
            disabled={saving || !front.trim() || !back.trim()}
            title={saving ? "Uploading card to Firestore..." : "Save this card to your deck"}
          >
            {saving ? "💾 Saving..." : "💾 Save Card"}
          </button>
        </form>
      </div>

      {/* Cards Display Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Cards ({cards.length})</h2>
        {cards.length === 0 ? (
          <div style={styles.emptyState}>
            No cards yet. Add your first card above to get started!
          </div>
        ) : (
          <div style={styles.cardsList}>
            {cards.map((card) => {
              const isFlipped = flippedCards[card.id];
              const ratingLabels = {
                0: "Total Blackout",
                1: "Very Hard",
                2: "Hard",
                3: "Okay",
                4: "Easy",
                5: "Perfect Recall"
              };
              
              return (
                <div 
                  key={card.id} 
                  onClick={() => toggleCardFlip(card.id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && toggleCardFlip(card.id)}
                  style={{
                    ...styles.cardItem,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: isCardDue(card) ? '4px solid #ef4444' : '4px solid #d1d5db',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}>
                    <div style={styles.cardContent}>
                      {isFlipped ? (
                        <>
                          <div style={{...styles.cardFront, fontSize: "12px", color: "#9ca3af", marginBottom: "12px"}}>Answer (click to hide)</div>
                          <div style={{...styles.cardBack, fontSize: "16px", color: "#1f2937", fontWeight: "500"}}>{card.back}</div>
                        </>
                      ) : (
                        <>
                          <div style={{...styles.cardFront, fontSize: "12px", color: "#9ca3af", marginBottom: "12px"}}>Question (click to reveal)</div>
                          <div style={{...styles.cardFront}}>{card.front}</div>
                        </>
                      )}
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      marginLeft: '12px',
                      backgroundColor: isCardDue(card) ? '#fee2e2' : '#f0fdf4',
                      color: isCardDue(card) ? '#991b1b' : '#166534',
                    }}>
                      {isCardDue(card) ? `Due now (${getDaysSinceDue(card)}d)` : 'Future review'}
                    </div>
                  </div>
                  
                  {/* SM-2 Rating Buttons (shown when card is flipped) */}
                  {isFlipped && (
                    <div style={styles.ratingContainer}>
                      <div style={styles.ratingLabel}>How would you rate your recall?</div>
                      <div style={styles.ratingButtons}>
                        {[0, 1, 2, 3, 4, 5].map((quality) => (
                          <button
                            key={quality}
                            style={styles.ratingBtn(quality)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardRating(card.id, quality);
                            }}
                          >
                            <div style={styles.ratingValue}>{quality}</div>
                            <div style={styles.ratingText}>{ratingLabels[quality]}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* EDIT MODE */}
                  {editingCardId === card.id ? (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Question</label>
                        <input
                          style={styles.input}
                          type="text"
                          value={editFront}
                          onChange={(e) => setEditFront(e.target.value)}
                          disabled={editingSaving}
                          autoFocus
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Answer</label>
                        <textarea
                          style={styles.textarea}
                          value={editBack}
                          onChange={(e) => setEditBack(e.target.value)}
                          disabled={editingSaving}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          style={{
                            ...styles.primaryBtn,
                            ...(editingSaving ? styles.buttonDisabled : {}),
                          }}
                          onClick={handleSaveEditCard}
                          disabled={editingSaving || !editFront.trim() || !editBack.trim()}
                        >
                          {editingSaving ? "💾 Saving..." : "💾 Save Edit"}
                        </button>
                        <button
                          style={{
                            ...styles.secondaryBtn,
                            marginRight: 0,
                          }}
                          onClick={cancelEditCard}
                          disabled={editingSaving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CARD ACTIONS */
                    <div style={styles.cardActions}>
                      <button
                        style={{
                          ...styles.primaryBtn,
                          flex: 1,
                          backgroundColor: "var(--primary-color)",
                          padding: "8px 12px",
                          fontSize: "13px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditCard(card);
                        }}
                        disabled={deleting === card.id}
                      >
                        Edit
                      </button>
                      <button
                        style={styles.dangerBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id);
                        }}
                        disabled={deleting === card.id}
                      >
                        {deleting === card.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
