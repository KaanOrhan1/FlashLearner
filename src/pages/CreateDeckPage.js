import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import { ThemeToggle } from "components/ThemeToggle";
import { createUserDeck, addUserCard } from "lib/firestore";
import { generateAiDeck } from "lib/aiGeneration";
import { toast } from "sonner";
import '../styles/pages.css';

export function CreateDeckPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Manual deck creation
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // AI deck generation
  const [aiTopic, setAiTopic] = useState("");
  const [aiCardCount, setAiCardCount] = useState(10);
  const [aiDeckName, setAiDeckName] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCards, setAiCards] = useState([]);
  const [aiSaving, setAiSaving] = useState(false);
  
  // Edit card
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingAnswer, setEditingAnswer] = useState("");

  // ============================================
  // MANUAL DECK CREATION
  // ============================================
  async function handleCreateDeck(e) {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to create a deck");
      return;
    }

    if (!name.trim()) {
      toast.error("Deck name is required");
      return;
    }

    setCreating(true);
    try {
      console.log("[CreateDeck] Creating new deck:", { name, description });
      const newDeckId = await createUserDeck(user.uid, { name, description });

      console.log("[CreateDeck] Deck created successfully:", newDeckId);
      toast.success("Deck created! Let's add some cards", { duration: 2000 });

      // Clear form
      setName("");
      setDescription("");

      // Navigate to deck editor to add cards
      console.log("[CreateDeck] Navigating to deck editor...");
      navigate(`/deck/${newDeckId}`);
    } catch (err) {
      console.error("[CreateDeck] Error creating deck:", err);
      toast.error(err.message || "Failed to create deck");
    } finally {
      setCreating(false);
    }
  }

  // ============================================
  // AI DECK GENERATION
  // ============================================
  async function handleGenerateWithAI(e) {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to generate a deck");
      return;
    }

    if (!aiTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setAiGenerating(true);
    try {
      console.log("[AI] Generating deck for topic:", aiTopic, "Cards:", aiCardCount);
      const cards = await generateAiDeck(aiTopic, aiCardCount);
      
      console.log("[AI] Generated cards:", cards);
      setAiCards(cards);
      toast.success(`Generated ${cards.length} flashcards!`, { duration: 2000 });
    } catch (err) {
      console.error("[AI] Error generating deck:", err);
      toast.error(err.message || "Failed to generate flashcards");
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleSaveAiDeck() {
    if (!user) {
      toast.error("Please log in to save a deck");
      return;
    }

    const finalDeckName = aiDeckName.trim() || aiTopic.trim();
    if (!finalDeckName) {
      toast.error("Please enter a deck name or topic");
      return;
    }

    setAiSaving(true);
    try {
      console.log("💾 [AI] Saving AI deck:", finalDeckName, "with", aiCards.length, "cards");
      
      // Create the deck
      const newDeckId = await createUserDeck(user.uid, { 
        name: finalDeckName, 
        description: `Generated with AI from topic: ${aiTopic}` 
      });

      // Add all cards to the deck
      for (const card of aiCards) {
        await addUserCard(user.uid, newDeckId, {
          front: card.question,
          back: card.answer,
        });
      }

      console.log("[AI] Deck saved successfully:", newDeckId);
      toast.success("Deck saved! Navigating to your cards...", { duration: 2000 });

      // Clear AI form
      setAiTopic("");
      setAiDeckName("");
      setAiCardCount(10);
      setAiCards([]);

      // Navigate to deck page
      navigate(`/deck/${newDeckId}`);
    } catch (err) {
      console.error("[AI] Error saving AI deck:", err);
      toast.error(err.message || "Failed to save deck");
    } finally {
      setAiSaving(false);
    }
  }

  function handleCancelManualForm() {
    setName("");
    setDescription("");
  }

  // ============================================
  // EDIT CARD HANDLERS
  // ============================================
  function handleEditCard(index) {
    setEditingIndex(index);
    setEditingQuestion(aiCards[index].question);
    setEditingAnswer(aiCards[index].answer);
  }

  function handleSaveEditedCard() {
    if (!editingQuestion.trim() || !editingAnswer.trim()) {
      toast.error("Question and answer cannot be empty");
      return;
    }

    const updatedCards = [...aiCards];
    updatedCards[editingIndex] = {
      question: editingQuestion.trim(),
      answer: editingAnswer.trim(),
    };
    setAiCards(updatedCards);
    setEditingIndex(null);
    setEditingQuestion("");
    setEditingAnswer("");
    toast.success("Card updated!", { duration: 1500 });
  }

  function handleCancelEdit() {
    setEditingIndex(null);
    setEditingQuestion("");
    setEditingAnswer("");
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="app-page">
      <ThemeToggle />
      <div className="app-container">
        {/* HEADER */}
        <div className="dashboard-header">
          <button
            className="logout-btn"
            onClick={() => navigate("/dashboard")}
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.5px",
          }}>
            Create Deck
          </h1>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          {/* MANUAL DECK CREATION */}
          <div style={{
            backgroundColor: "var(--card-color)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            padding: "32px",
            marginBottom: "32px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border-color)",
            }}>
              <h2 style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "var(--text-primary)",
                margin: 0,
              }}>
                Create Deck Manually
              </h2>
            </div>

            <form onSubmit={handleCreateDeck}>
              <div className="form-group">
                <label className="form-label">Deck Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Biology Revision, SQL Basics, Country Capitals"
                  required
                  disabled={creating}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description to help you remember what this deck is about..."
                  rows="4"
                  disabled={creating}
                  style={{
                    fontFamily: "inherit",
                    resize: "vertical",
                    minHeight: "100px",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={creating || !name.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: creating ? "var(--text-secondary)" : "var(--primary-color)",
                    cursor: creating ? "not-allowed" : "pointer",
                  }}
                >
                  {creating ? "Creating..." : "Create Deck"}
                </button>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={handleCancelManualForm}
                  disabled={creating}
                  style={{
                    flex: 1,
                    backgroundColor: "var(--gray-light)",
                    color: "var(--text-primary)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--border-color)",
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* AI DECK GENERATION */}
          <div style={{
            backgroundColor: "var(--card-color)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            padding: "32px",
            marginBottom: "24px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border-color)",
            }}>
              <h2 style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "var(--text-primary)",
                margin: 0,
              }}>
                Generate Deck with AI
              </h2>
            </div>

            {aiCards.length === 0 ? (
              // Generation form
              <form onSubmit={handleGenerateWithAI}>
                <div className="form-group">
                  <label className="form-label">Topic *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. French Vocabulary, Photosynthesis, React Hooks"
                    disabled={aiGenerating}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Number of Cards</label>
                    <select
                      className="form-input"
                      value={aiCardCount}
                      onChange={(e) => setAiCardCount(parseInt(e.target.value))}
                      disabled={aiGenerating}
                    >
                      <option value={5}>5 cards</option>
                      <option value={10}>10 cards</option>
                      <option value={15}>15 cards</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deck Name (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={aiDeckName}
                      onChange={(e) => setAiDeckName(e.target.value)}
                      placeholder="Leave empty to use topic"
                      disabled={aiGenerating}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={aiGenerating || !aiTopic.trim()}
                  style={{
                    width: "100%",
                    backgroundColor: aiGenerating ? "var(--text-secondary)" : "var(--primary-color)",
                    cursor: aiGenerating ? "not-allowed" : "pointer",
                  }}
                >
                  {aiGenerating ? "Generating..." : "Generate Flashcards"}
                </button>
              </form>
            ) : (
              // Preview and save
              <div>
                <div style={{
                  marginBottom: "20px",
                  padding: "12px",
                  backgroundColor: "var(--gray-light)",
                  borderRadius: "8px",
                  borderLeft: "4px solid var(--primary-color)",
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                  }}>
                    Generated {aiCards.length} flashcards for "<strong>{aiTopic}</strong>"
                  </p>
                </div>

                <div style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  marginBottom: "20px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                }}>
                  {editingIndex === null ? (
                    // Display cards with Edit buttons
                    aiCards.map((card, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "16px",
                          borderBottom: idx < aiCards.length - 1 ? "1px solid var(--border-color)" : "none",
                          backgroundColor: idx % 2 === 0 ? "var(--card-color)" : "var(--gray-light)",
                        }}
                      >
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "12px",
                        }}>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "var(--text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}>
                            Card {idx + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditCard(idx)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "var(--primary-color)",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "opacity 0.2s",
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = "0.85"}
                            onMouseLeave={(e) => e.target.style.opacity = "1"}
                          >
                            Edit
                          </button>
                        </div>
                        <div style={{
                          marginBottom: "10px",
                          paddingBottom: "10px",
                          borderBottom: "1px solid var(--border-color)",
                        }}>
                          <div style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            marginBottom: "4px",
                          }}>
                            Question:
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "var(--text-primary)",
                            fontWeight: "500",
                          }}>
                            {card.question}
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            marginBottom: "4px",
                          }}>
                            Answer:
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "var(--text-primary)",
                          }}>
                            {card.answer}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Edit form
                    <div style={{
                      padding: "24px",
                      backgroundColor: "var(--card-color)",
                    }}>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        marginBottom: "20px",
                      }}>
                        Editing Card {editingIndex + 1}
                      </div>

                      <div className="form-group" style={{ marginBottom: "16px" }}>
                        <label className="form-label">Question</label>
                        <textarea
                          className="form-input"
                          value={editingQuestion}
                          onChange={(e) => setEditingQuestion(e.target.value)}
                          rows="3"
                          style={{
                            fontFamily: "inherit",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: "16px" }}>
                        <label className="form-label">Answer</label>
                        <textarea
                          className="form-input"
                          value={editingAnswer}
                          onChange={(e) => setEditingAnswer(e.target.value)}
                          rows="3"
                          style={{
                            fontFamily: "inherit",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          type="button"
                          onClick={handleSaveEditedCard}
                          style={{
                            flex: 1,
                            padding: "10px 16px",
                            backgroundColor: "var(--primary-color)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "opacity 0.2s",
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = "0.85"}
                          onMouseLeave={(e) => e.target.style.opacity = "1"}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          style={{
                            flex: 1,
                            padding: "10px 16px",
                            backgroundColor: "var(--gray-light)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "opacity 0.2s",
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = "0.85"}
                          onMouseLeave={(e) => e.target.style.opacity = "1"}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setAiCards([])}
                    disabled={aiSaving || editingIndex !== null}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      backgroundColor: editingIndex !== null ? "var(--text-secondary)" : "var(--gray-light)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: editingIndex !== null || aiSaving ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    Generate Again
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAiDeck}
                    disabled={aiSaving || editingIndex !== null}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      backgroundColor: editingIndex !== null || aiSaving ? "var(--text-secondary)" : "var(--primary-color)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: editingIndex !== null || aiSaving ? "not-allowed" : "pointer",
                    }}
                  >
                    {aiSaving ? "💾 Saving..." : "💾 Save Deck"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TIPS SECTION */}
          <div style={{
            backgroundColor: "var(--success-light)",
            borderRadius: "8px",
            border: "1px solid var(--primary-light)",
            padding: "16px",
          }}>
            <p style={{
              fontSize: "13px",
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: "1.6",
            }}>
              💡 <strong>Tips:</strong> Create a deck with a clear name, then add cards or generate them with AI. Start studying whenever you're ready!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
