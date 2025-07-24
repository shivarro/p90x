// src/components/NavBar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="bg-blue-600 px-6 py-4">
      <div className="flex space-x-6">
        <Link to="/planner" className="text-white font-semibold hover:underline">
          Planner
        </Link>
        <Link to="/workouts" className="text-white font-semibold hover:underline">
          Workouts
        </Link>
      </div>
    </nav>
  );
}
