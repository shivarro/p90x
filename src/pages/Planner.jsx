// src/pages/Planner.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

export default function Planner() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'workouts'), orderBy('order'));
      const snap = await getDocs(q);
      setWorkouts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    load();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8">
        Your 90‑Day Plan
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.map(w => {
          const doneTs = w.doneBy?.[user.uid]?.toDate?.();
          return (
            <Link
              key={w.id}
              to={`/workouts/${w.id}`}
              className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200 p-6"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium text-gray-700">
                  Day {w.order}
                </span>
                {doneTs && (
                  <span className="text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    Completed
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{w.name}</h2>
              {doneTs && (
                <p className="mt-3 text-sm text-gray-600">
                  Completed on {doneTs.toLocaleDateString()}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
