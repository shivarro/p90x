// src/pages/WorkoutPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  doc, getDoc, updateDoc, collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp
} from 'firebase/firestore';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';

const DEFAULT_COLUMNS = ['name', 'sets', 'reps', 'weight'];

const WORKOUT_NAMES = {
  cb: 'Chest & Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  // add any other IDs here
};

// Called after complete workout button is clicked
async function markWorkoutCompleted(userId, workoutId, day) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const plan = userSnap.data()?.currentPlan;
  if (!plan || !Array.isArray(plan.days)) return;

  // See what your plan.days look like:
  console.log('Plan days:', plan.days, 'looking for:', workoutId, 'on day', day);

  // Find correct workout
  const idx = plan.days.findIndex(
    w => w.day === day && w.workoutId === workoutId
  );
  console.log('Match idx:', idx);

  if (idx !== -1) {
    const daysCopy = plan.days.map(w => ({ ...w }));
    daysCopy[idx].completed = true;
    await updateDoc(userRef, {
      'currentPlan.days': daysCopy,
      'currentPlan.updatedAt': serverTimestamp()
    });
  } else {
    alert('Could not find workout to mark as completed.');
  }
}

export default function WorkoutPage() {
  const { workoutId } = useParams();
  const displayName = WORKOUT_NAMES[workoutId] || workoutId;
  const navigate = useNavigate();
  const { user } = useAuth();

  // 🟢 Get `day` from URL query param
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const day = Number(searchParams.get('day'));

  const [videoUrl, setVideoUrl] = useState('');
  const [session, setSession] = useState(null);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // — INIT OR RESUME SESSION —
  useEffect(() => {
    if (!user) {
      setError('Please log in to continue.');
      setLoading(false);
      return;
    }
    if (!workoutId) {
      setError('Invalid workout selected.');
      setLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        const sessionsRef = collection(db, 'workouts', workoutId, 'sessions');

        // 1) active session
        let q = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('completedAt', '==', null),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        let snap = await getDocs(q);

        let data;
        if (snap.empty) {
          // no active → grab most recent
          const lastQ = query(
            sessionsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const lastSnap = await getDocs(lastQ);

          const seedCols = lastSnap.empty
            ? DEFAULT_COLUMNS
            : lastSnap.docs[0].data().columns || DEFAULT_COLUMNS;
          const seedRows = lastSnap.empty
            ? []
            : lastSnap.docs[0].data().rows || [];

          const newRef = await addDoc(sessionsRef, {
            userId:      user.uid,
            createdAt:   serverTimestamp(),
            completedAt: null,
            columns:     seedCols,
            rows:        seedRows
          });
          const fresh = await getDoc(newRef);
          data = { id: newRef.id, ...fresh.data() };
        } else {
          const docSnap = snap.docs[0];
          data = { id: docSnap.id, ...docSnap.data() };
        }

        setSession(data);
        setColumns(data.columns || []);
        setRows(data.rows || []);
      } catch (err) {
        console.error('Init session error:', err);
        setError('Unable to load workout session.');
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [user, workoutId]);

  // — fetch workout metadata for videoUrl —
  useEffect(() => {
    if (!workoutId) return;
    const fetchAndProxy = async () => {
      try {
        const wDoc = await getDoc(doc(db, 'workouts', workoutId));
        if (!wDoc.exists()) return;
        const rawUrl = wDoc.data().videoUrl;
        const proxied = `https://seedr-proxy.vinoda.workers.dev/?videoUrl=${encodeURIComponent(rawUrl)}`;
        setVideoUrl(proxied);
      } catch (err) {
        console.error('Couldn’t load & proxy video URL:', err);
      }
    };

    fetchAndProxy();
  }, [workoutId]);

  // — AUTO-SAVE ON CHANGE —
  useEffect(() => {
    if (!session) return;
    const save = async () => {
      try {
        const ref = doc(db, 'workouts', workoutId, 'sessions', session.id);
        await updateDoc(ref, { columns, rows });
      } catch (err) {
        console.error('Save session error:', err);
      }
    };
    save();
  }, [columns, rows, session, workoutId]);

  // — Restore the LAST session’s layout on demand —
  const restoreLastLayout = useCallback(async () => {
    if (!user || !workoutId) return;
    try {
      const sessionsRef = collection(db, 'workouts', workoutId, 'sessions');
      const lastQ = query(
        sessionsRef,
        where('userId', '==', user.uid),
        where('completedAt', '>', new Date(0)),
        orderBy('completedAt', 'desc'),
        limit(1)
      );
      const lastSnap = await getDocs(lastQ);
      if (lastSnap.empty) {
        alert('No previous session to restore.');
        return;
      }
      const lastData = lastSnap.docs[0].data();
      setColumns(lastData.columns || DEFAULT_COLUMNS);
      setRows(lastData.rows || []);
      alert('Layout restored from last session.');
    } catch (err) {
      console.error('Restore layout error:', err);
      alert('Could not restore layout.');
    }
  }, [user, workoutId]);

  // — add/remove & edit helpers —
  const addColumn = () => {
    const name = prompt('New column name:');
    if (name && !columns.includes(name.trim())) {
      setColumns(cols => [...cols, name.trim()]);
    }
  };
  const addRow = () => {
    const id = `row_${Date.now()}`;
    setRows(r => [...r, { id, values: {} }]);
  };
  const updateCell = (rowId, col, value) => {
    setRows(r =>
      r.map(rw =>
        rw.id === rowId
          ? { ...rw, values: { ...rw.values, [col]: value } }
          : rw
      )
    );
  };
  const deleteColumn = colToDelete => {
    setColumns(cols => cols.filter(c => c !== colToDelete));
    setRows(r =>
      r.map(rw => {
        const { [colToDelete]: _, ...rest } = rw.values;
        return { ...rw, values: rest };
      })
    );
  };
  const deleteRow = rowId => {
    setRows(r => r.filter(rw => rw.id !== rowId));
  };

  // — Complete Workout + mark as complete in Firestore plan —
  const completeWorkout = async () => {
    if (!session) return;
    try {
      // mark this session complete
      const sessionRef = doc(db, 'workouts', workoutId, 'sessions', session.id);
      await updateDoc(sessionRef, { completedAt: serverTimestamp() });

      // 🟢 Mark this workout as completed in the user's plan!
      if (user && workoutId && typeof day === 'number' && !isNaN(day)) {
        await markWorkoutCompleted(user.uid, workoutId, day);
      }

      // navigate to completion screen
      navigate(
        `/workouts/${workoutId}/complete`,
        { state: { session: { ...session, columns, rows } } }
      );
    } catch (err) {
      console.error('Complete error:', err);
      alert('Failed to complete workout.');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <span className="text-gray-500">Loading session…</span>
    </div>
  );
  if (error) return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-red-100 text-red-700 rounded">
      {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {videoUrl && (
        <div className="p-6 bg-gray-50">
          <video
            src={videoUrl}
            controls
            className="w-full rounded shadow-md"
          />
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold mb-4">Workout: {displayName}</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={addColumn}
              className="bg-white text-blue-600 hover:bg-gray-100 font-medium px-4 py-2 rounded transition"
            >
              + Column
            </button>
            <button
              onClick={addRow}
              className="bg-white text-blue-600 hover:bg-gray-100 font-medium px-4 py-2 rounded transition"
            >
              + Row
            </button>
            <button
              onClick={restoreLastLayout}
              className="bg-yellow-500 text-white hover:bg-yellow-600 font-medium px-4 py-2 rounded transition"
            >
              Restore Last
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="p-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={col}
                    className={
                      "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal break-words " +
                      (index === 0 ? "w-2/5" : "")
                    }
                  >
                    <div className="flex items-center">
                      {col}
                      <button
                        onClick={() => deleteColumn(col)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        aria-label={`Delete ${col}`}
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-100">
                  {columns.map((col, index) => (
                    <td
                      key={col}
                      className={
                        "px-6 py-4 " +
                        (index === 0
                          ? "whitespace-normal break-words"
                          : "whitespace-nowrap")
                      }
                    >
                      {index === 0 ? (
                        <textarea
                          rows={2}
                          value={row.values[col] || ''}
                          onChange={e => updateCell(row.id, col, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={row.values[col] || ''}
                          onChange={e => updateCell(row.id, col, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Complete + History controls */}
        <div className="p-6 border-t border-gray-100 text-right">
          <Link
            to={`/workouts/${workoutId}/history`}
            className="inline-block mr-4 text-blue-600 hover:underline"
          >
            View History
          </Link>
          <button
            onClick={completeWorkout}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded transition"
          >
            Complete Workout
          </button>
        </div>
      </div>
    </div>
  );
}
