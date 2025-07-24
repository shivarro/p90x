// src/pages/WorkoutsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function WorkoutsList() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const q = query(
          collection(db, 'workouts'),
          orderBy('order')
        );
        const snap = await getDocs(q);
        setWorkouts(
          snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        console.error('Failed to load workouts:', err);
        setError('Failed to load workouts.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  if (loading) return <div className="p-4">Loading workouts…</div>;
  if (error)   return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Workouts</h1>
      <ul className="space-y-4">
        {workouts.map(w => (
          <li
            key={w.id}
            className="flex justify-between items-center bg-white p-4 rounded shadow"
          >
            <Link
              to={`/workouts/${w.id}`}
              className="text-lg font-medium text-blue-600 hover:underline"
            >
              {w.name}
            </Link>

            <Link
              to={`/workouts/${w.id}/history`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded transition"
            >
              View History
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}