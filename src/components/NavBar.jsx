// src/components/NavBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import {
  doc, updateDoc, serverTimestamp, collection, getDocs, deleteDoc
} from 'firebase/firestore';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const menuRef = useRef();

  // Click-away to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowDelete(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // DELETE ALL USER DATA
  async function deleteUserSessionsForWorkout(wDoc, userId) {
    const sessionsRef = collection(db, "workouts", wDoc.id, "sessions");
    const sessionsSnap = await getDocs(sessionsRef);
    let deleted = 0;
    const deletes = [];
    sessionsSnap.forEach(sDoc => {
      if (sDoc.data().userId === userId) {
        deletes.push(deleteDoc(sDoc.ref));
        deleted++;
      }
    });
    await Promise.all(deletes);
    return deleted;
  }
  
  async function handleDeleteAllData() {
    if (!user) return;
    if (!window.confirm("Erase ALL your data? This cannot be undone.")) return;
    
    const workoutColl = collection(db, "workouts");
    const workoutSnap = await getDocs(workoutColl);
    
    let sessionDeleteCount = 0;
    for (const wDoc of workoutSnap.docs) {
      sessionDeleteCount += await deleteUserSessionsForWorkout(wDoc, user.uid);
    }
    
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      currentPlan: null,
      lastSeen: serverTimestamp(),
    });
    
    setShowDelete(false);
    alert(`Your data has been erased.\nSessions deleted: ${sessionDeleteCount}`);
    window.location.reload();
  }

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
          <div className="flex items-center space-x-4 relative" ref={menuRef}>
            <button
              className="text-white focus:outline-none font-medium"
              onClick={() => setShowDelete(v => !v)}
            >
              Logged in: {user.displayName || user.email}
            </button>
            <button
              onClick={handleLogout}
              className="text-white font-semibold hover:underline"
            >
              Log out
            </button>
            {showDelete && (
              <div className="absolute right-0 top-10 w-44 z-50 bg-white border rounded-lg shadow-lg animate-fade-in">
                <button
                  onClick={handleDeleteAllData}
                  className="block w-full text-left px-4 py-3 text-red-700 hover:bg-red-50 hover:text-red-900 font-semibold rounded-b-lg transition"
                >
                  Delete Data
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
