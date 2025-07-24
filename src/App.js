// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';

import Planner           from './pages/Planner';
import WorkoutsList      from './pages/WorkoutsList';
import WorkoutPage       from './pages/WorkoutPage';
import WorkoutComplete   from './pages/WorkoutComplete';
import WorkoutHistory    from './pages/WorkoutHistory';
import HistoryDetail     from './pages/HistoryDetail';

export default function App() {
  return (
    <>
      <NavBar />

      <Routes>
        {/* home → planner */}
        <Route path="/" element={<Navigate to="/planner" replace />} />

        {/* your main views */}
        <Route path="/planner"                         element={<Planner />} />
        <Route path="/workouts"                        element={<WorkoutsList />} />
        <Route path="/workouts/:workoutId"             element={<WorkoutPage />} />
        <Route path="/workouts/:workoutId/complete"    element={<WorkoutComplete />} />

        {/* history list */}
        <Route
          path="/workouts/:workoutId/history"
          element={<WorkoutHistory />}
        />

        {/* single-session detail */}
        <Route
          path="/workouts/:workoutId/history/:sessionId"
          element={<HistoryDetail />}
        />

        {/* catch-all 404 */}
        <Route path="*" element={<h2 className="p-6">Page not found</h2>} />
      </Routes>
    </>
  );
}
