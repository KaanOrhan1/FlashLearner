import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "lib/firebase";
import { initializeUser } from "lib/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    // Check if Firebase is configured
    if (!auth) {
      setConfigError("Firebase is not configured");
    }
    
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    if (!auth) throw new Error("Firebase is not configured");
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Ensure user document exists
    await initializeUser(result.user.uid, { displayName: result.user.displayName, email: result.user.email });
    return result.user;
  };

  const register = async (email, password, displayName) => {
    if (!auth) throw new Error("Firebase is not configured");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    // Initialize user document in Firestore
    await initializeUser(result.user.uid, { displayName, email });
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(() => ({ user, loading, logout, login, register, configError }), [user, loading, configError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
