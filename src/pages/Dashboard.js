import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import { ThemeToggle } from "components/ThemeToggle";
import logo from "../assets/flashlearn-logo.png";
import { 
  createUserDeck, 
  fetchUserDecks,
  listenToUserDecks,
  fetchPublicDecks, 
  copyPublicDeckToUser,
  getRecentlyStudiedDecks,
  getCardCount,
  getDueCardsCount,
  deleteUserDeck,
} from "lib/firestore";
import { toast } from "sonner";
import '../styles/pages.css';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [recentDecks, setRecentDecks] = useState([]);
  const [allDecks, setAllDecks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [deckCardCounts, setDeckCardCounts] = useState({});
  const [deckDueCounts, setDeckDueCounts] = useState({});

  const [copying, setCopying] = useState(null);
  
  // State for deck deletion
  const [deletingDeckId, setDeletingDeckId] = useState(null);
  const [confirmDeleteDeckId, setConfirmDeleteDeckId] = useState(null);

  // Load all data
  useEffect(() => {
    if (!user) return;
    loadTemplates();
    
    // Set up real-time listener for decks
    console.log("Setting up real-time deck listener...");
    const unsubscribe = listenToUserDecks(user.uid, async (decks) => {
      console.log("Decks updated via real-time listener:", decks.length);
      setAllDecks(decks);
      
      // Load recent decks
      const recent = await getRecentlyStudiedDecks(user.uid);
      setRecentDecks(recent);
      
      // Load card counts for all decks in parallel
      const counts = {};
      const dueCounts = {};
      
      const countPromises = decks.map(async (deck) => {
        counts[deck.id] = await getCardCount(user.uid, deck.id);
        dueCounts[deck.id] = await getDueCardsCount(user.uid, deck.id);
      });
      
      // Wait for all counts to load
      if (countPromises.length > 0) {
        await Promise.all(countPromises);
      }
      
      setDeckCardCounts(counts);
      setDeckDueCounts(dueCounts);
      
      // Mark loading as complete (even if empty)
      setLoadingDecks(false);
      console.log("[Deck loading] Complete - counts loaded for", decks.length, "decks");
    });
    
    // Set loading to false with a timeout if empty initially
    setTimeout(() => {
      setLoadingDecks(false);
    }, 2000);
    
    // Cleanup: unsubscribe from listener
    return () => {
      console.log("Cleaning up deck listener");
      unsubscribe();
    };
  }, [user]);

  async function loadTemplates() {
    setLoadingTemplates(true);
    try {
      const temps = await fetchPublicDecks();
      setTemplates(temps);
    } catch (err) {
      console.error("Error loading public decks:", err);
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function handleCopyTemplate(templateId) {
    if (!user) return;
    setCopying(templateId);
    try {
      toast.loading("Adding deck...", { id: "copy-template" });
      const deckId = await copyPublicDeckToUser(user.uid, templateId);
      toast.dismiss("copy-template");
      toast.success("Deck added! Redirecting...");
      setTimeout(() => navigate(`/deck/${deckId}`), 500);
    } catch (err) {
      console.error("Error copying template:", err);
      toast.dismiss("copy-template");
      const msg = err.message || "Failed to add deck";
      toast.error(msg);
    } finally {
      setCopying(null);
    }
  }

  async function handleRemoveDeck(deckId) {
    if (!user) return;
    
    // Show confirmation prompt
    const confirmed = window.confirm(
      "Are you sure you want to delete this deck? This will remove the deck and all its cards permanently."
    );
    
    if (!confirmed) return;
    
    setDeletingDeckId(deckId);
    try {
      toast.loading("Deleting deck...", { id: "delete-deck" });
      await deleteUserDeck(user.uid, deckId);
      
      // Remove from state
      setAllDecks(prev => prev.filter(d => d.id !== deckId));
      setRecentDecks(prev => prev.filter(d => d.id !== deckId));
      
      // Clean up card counts
      setDeckCardCounts(prev => {
        const updated = { ...prev };
        delete updated[deckId];
        return updated;
      });
      
      setDeckDueCounts(prev => {
        const updated = { ...prev };
        delete updated[deckId];
        return updated;
      });
      
      toast.dismiss("delete-deck");
      toast.success("Deck deleted successfully!");
    } catch (err) {
      console.error("Error deleting deck:", err);
      toast.dismiss("delete-deck");
      toast.error(err.message || "Failed to delete deck");
    } finally {
      setDeletingDeckId(null);
    }
  }

  const DeckCard = ({ deck, isTemplate = false, isRecent = false }) => {
    // For featured decks, use cardCount from public deck document
    // For user decks, use count from state (loaded dynamically)
    const cardCount = isTemplate ? (deck.cardCount || 0) : (deckCardCounts[deck.id] || 0);
    const dueCount = deckDueCounts[deck.id] || 0;
    const progress = cardCount > 0 ? ((cardCount - dueCount) / cardCount) * 100 : 0;

    return (
      <div className="deck-card">
        <div className="deck-card-header">
          <h3 className="deck-card-title">{deck.name}</h3>
        </div>
        
        {deck.description && <div className="deck-card-description">{deck.description}</div>}
        
        <div className="deck-card-meta">
          <span className="meta-item"><span className="meta-number">{cardCount}</span> cards</span>
          {!isTemplate && dueCount > 0 && (
            <span className="due-badge">{dueCount} due</span>
          )}
        </div>

        {!isTemplate && cardCount > 0 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="deck-card-actions">
          {isTemplate ? (
            <button
              className="button-primary"
              onClick={() => handleCopyTemplate(deck.id)}
              disabled={copying === deck.id}
              style={{ opacity: copying === deck.id ? 0.7 : 1, cursor: copying === deck.id ? "wait" : "pointer" }}
            >
              {copying === deck.id ? "Adding..." : "Add to My Decks"}
            </button>
          ) : (
            <>
              <button
                className="button-primary"
                onClick={() => navigate(`/study/${deck.id}`)}
              >
                {isRecent ? "Resume Study" : "Study"}
              </button>
              <button
                className="button-primary"
                onClick={() => navigate(`/study/${deck.id}?mode=repeat`)}
                style={{
                  backgroundColor: "#8b5cf6",
                }}
              >
                Repeat Deck
              </button>
              <button
                className="button-danger"
                onClick={() => handleRemoveDeck(deck.id)}
                disabled={deletingDeckId === deck.id}
                style={{ opacity: deletingDeckId === deck.id ? 0.6 : 1, cursor: deletingDeckId === deck.id ? "wait" : "pointer" }}
                title="Delete this deck"
              >
                {deletingDeckId === deck.id ? "Deleting..." : "Remove"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-page">
      <ThemeToggle />
      <div className="app-container">
        <div className="dashboard-header">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img 
              src={logo} 
              alt="FlashLearn Logo" 
              style={{
                height: "80px",
                width: "80px",
                objectFit: "contain",
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.12))",
              }}
            />
            <h1 className="dashboard-title">FlashLearn</h1>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button 
              className="logout-btn" 
              onClick={() => navigate("/stats")}
              style={{
                backgroundColor: "#8b5cf6",
                padding: "8px 16px",
                fontSize: "14px",
              }}
            >
              View Stats
            </button>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="welcome-text">
          Welcome back, <strong>{user?.displayName || "Learner"}!</strong> Ready to study?
        </div>

        {/* QUICK ACTION BUTTON */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "36px",
        }}>
          <button
            onClick={() => navigate("/create-deck")}
            style={{
              width: "100%",
              backgroundColor: "var(--primary-color)",
              color: "white",
              padding: "14px 24px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.opacity = "0.9"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            ➕ Create Deck
          </button>
        </div>

        {/* CONTINUE STUDYING SECTION */}
        {recentDecks.length > 0 && (
          <div className="section">
            <h2 className="section-title">Continue Studying</h2>
            <div className="cards-grid">
              {recentDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} isRecent={true} />
              ))}
            </div>
          </div>
        )}

        {/* FEATURED DECKS SECTION */}
        <div className="section">
          <h2 className="section-title">Featured Decks</h2>
          {templates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-description">No featured decks available yet.</div>
            </div>
          ) : (
            <div className="cards-grid">
              {templates.map((template) => (
                <DeckCard key={template.id} deck={template} isTemplate={true} />
              ))}
            </div>
          )}
        </div>

        {/* MY DECKS SECTION */}
        <div className="section">
          <h2 className="section-title">My Decks</h2>
          {loadingDecks ? (
            <div className="empty-state">
              <div className="empty-state-description">Loading your decks...</div>
            </div>
          ) : allDecks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No decks yet</div>
              <div className="empty-state-description">Create your first deck or start learning from the Featured Decks above.</div>
              <button
                onClick={() => navigate("/create-deck")}
                style={{
                  marginTop: "16px",
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
                onMouseEnter={(e) => e.target.style.opacity = "0.9"}
                onMouseLeave={(e) => e.target.style.opacity = "1"}
              >
                Create Deck
              </button>
            </div>
          ) : (
            <div className="cards-grid">
              {allDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
