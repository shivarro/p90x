import React, { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../firebase";

export default function AuthGate({ children }) {
  const [user, setUser]       = useState(null);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  if (user) return children;

  const signIn = () =>
    signInWithEmailAndPassword(auth, email, password).catch(console.error);
  const signUp = () =>
    createUserWithEmailAndPassword(auth, email, password).catch(console.error);

  return (
    <div style={{ padding: 20 }}>
      <h2>Login / Sign Up</h2>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />
      <br />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
      />
      <br />
    {/* in AuthGate.jsx */}
    <button
    onClick={() => {
      console.log("attempting signIn with", email, password);
      signIn();
    }}
    >
    Sign In
    </button>
    <button
    onClick={() => {
      console.log("attempting signUp with", email, password);
      signUp();
    }}
    >
    Sign Up
    </button>

    </div>
  );
}
