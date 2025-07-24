// src/pages/HistoryDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function HistoryDetail() {
  const { workoutId, sessionId } = useParams();
  const { user } = useAuth();
  const [workoutName, setWorkoutName] = useState(workoutId);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch workout name
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const wRef = doc(db, 'workouts', workoutId);
        const wSnap = await getDoc(wRef);
        if (wSnap.exists()) {
          setWorkoutName(wSnap.data().name || workoutId);
        }
      } catch (err) {
        console.error('Could not load workout name:', err);
      }
    };
    if (workoutId) fetchWorkout();
  }, [workoutId]);

  useEffect(() => {
    if (!user) {
      setError('Please log in to view details.');
      setLoading(false);
      return;
    }
    if (!workoutId || !sessionId) {
      setError('Invalid session.');
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const ref = doc(db, 'workouts', workoutId, 'sessions', sessionId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError('Session not found.');
        } else {
          setSession({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load session.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [user, workoutId, sessionId]);

  if (loading) return <div className="p-4">Loading details…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        {workoutName} — {new Date(session.completedAt.toMillis()).toLocaleString()}
      </h1>
      <Link
        to={`/workouts/${workoutId}/history`}
        className="text-blue-600 underline mb-4 inline-block"
      >
        ← Back to History
      </Link>

      <div className="overflow-auto border rounded">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              {session.columns.map(col => (
                <th key={col} className="px-4 py-2 border">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {session.rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                {session.columns.map(col => (
                  <td key={col} className="p-2 border">
                    {r.values[col] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}