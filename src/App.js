import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "context/AuthContext";
import { ThemeProvider } from "context/ThemeContext";

import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { Dashboard } from "./pages/Dashboard";
import { CreateDeckPage } from "./pages/CreateDeckPage";
import { DeckPage } from "./pages/DeckPage";
import { StudySession } from "./pages/StudySession";
import { StatsPage } from "./pages/StatsPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/deck/:deckId"
            element={
              <PrivateRoute>
                <DeckPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/study/:deckId"
            element={
              <PrivateRoute>
                <StudySession />
              </PrivateRoute>
            }
          />

          <Route
            path="/create-deck"
            element={
              <PrivateRoute>
                <CreateDeckPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/stats"
            element={
              <PrivateRoute>
                <StatsPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}
