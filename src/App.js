// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import Login from "./pages/Login";    // your styled Login form
// import Signup from "./pages/Signup";

import Planner         from "./pages/Planner";
import WorkoutsList    from "./pages/WorkoutsList";
import WorkoutPage     from "./pages/WorkoutPage";
import WorkoutComplete from "./pages/WorkoutComplete";
import WorkoutHistory  from "./pages/WorkoutHistory";
import HistoryDetail   from "./pages/HistoryDetail";

export default function App() {
  return (
    <>
      <NavBar />

      <Routes>
        {/* public auth pages */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/signup" element={<Signup />} /> */}

        {/* redirect root */}
        <Route path="/" element={<Navigate to="/planner" replace />} />

        {/* protected */}
        <Route path="/planner"                      element={<Planner />} />
        <Route path="/workouts"                     element={<WorkoutsList />} />
        <Route path="/workouts/:workoutId"          element={<WorkoutPage />} />
        <Route path="/workouts/:workoutId/complete" element={<WorkoutComplete />} />
        <Route path="/workouts/:workoutId/history"  element={<WorkoutHistory />} />
        <Route path="/workouts/:workoutId/history/:sessionId" element={<HistoryDetail />} />

        {/* 404 */}
        <Route path="*" element={<h2 className="p-6">Page not found</h2>} />
      </Routes>
    </>
  );
}
