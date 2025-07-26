// src/hooks/useAuth.js
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";  // make sure you export `db` in firebase.js

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Upsert the root user doc so you can see it in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        await setDoc(
          userRef,
          {
            email: firebaseUser.email,
            lastSeen: serverTimestamp(),
            // you can merge in more profile fields here
          },
          { merge: true }
        );
      }
    });
    return unsubscribe;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const logout = () =>
    signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx; // { user, loading, login, signup, logout }
}
