// src/components/NavBar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log("logging out…");
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className="bg-blue-600 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex space-x-6">
          <Link to="/planner" className="text-white font-semibold hover:underline">
            Planner
          </Link>
          <Link to="/workouts" className="text-white font-semibold hover:underline">
            Workouts
          </Link>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-white">
              Logged in: {user.displayName || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-white font-semibold hover:underline"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
