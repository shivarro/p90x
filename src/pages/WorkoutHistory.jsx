// src/pages/WorkoutHistory.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { collection, doc, getDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function WorkoutHistory() {
  const { workoutId } = useParams();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workoutName, setWorkoutName] = useState(workoutId);

  // Fetch workout metadata
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const ref = doc(db, 'workouts', workoutId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setWorkoutName(snap.data().name || workoutId);
        }
      } catch (err) {
        console.error('Could not load workout name:', err);
      }
    };
    if (workoutId) fetchWorkout();
  }, [workoutId]);

  useEffect(() => {
    if (!user) {
      setError('Please log in to view history.');
      setLoading(false);
      return;
    }
    if (!workoutId) {
      setError('Invalid workout.');
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const sessionsRef = collection(db, 'workouts', workoutId, 'sessions');
        const q = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('completedAt', '!=', null),
          orderBy('completedAt', 'desc')
        );
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        setError('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, workoutId]);

  if (loading) return <div className="p-4">Loading history…</div>;
  if (error)   return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">History for {workoutName}</h1>
      {sessions.length === 0 ? (
        <div>No completed sessions yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sessions.map(s => (
            <div
              key={s.id}
              className="bg-white shadow rounded-lg p-4 flex flex-col justify-between"
            >
              <div className="text-gray-800 mb-4">
                {new Date(s.completedAt.toMillis()).toLocaleString()}
              </div>
              <Link
                to={`/workouts/${workoutId}/history/${s.id}`}
                className="mt-auto self-end bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
