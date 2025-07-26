// src/components/AuthGate.jsx
import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

export default function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  // while we’re checking Firebase…
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  // always allow the login (and signup) page to render
  if (pathname === "/login" /* || pathname === "/signup" */) {
    return children;
  }

  // if we're not logged in, kick to /login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: pathname }} />;
  }

  // authorized! show the app
  return children;
}
