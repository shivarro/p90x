// src/pages/WorkoutPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  doc, getDoc, updateDoc, collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp
} from 'firebase/firestore';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import MobileCard from '../components/MobileCard.jsx';


const DEFAULT_COLUMNS = ['name', 'sets', 'reps', 'weight'];

// Mark the workout completed and save the sessionId to the user's plan
async function markWorkoutCompleted(userId, workoutId, day, sessionId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const plan = userSnap.data()?.currentPlan;
  if (!plan || !Array.isArray(plan.days)) return;
  const idx = plan.days.findIndex(
    w => w.day === day && w.workoutId === workoutId
  );
  if (idx !== -1) {
    const daysCopy = plan.days.map(w => ({ ...w }));
    daysCopy[idx].completed = true;
    daysCopy[idx].workoutSessionId = sessionId;
    await updateDoc(userRef, {
      'currentPlan.days': daysCopy,
      'currentPlan.updatedAt': serverTimestamp()
    });
  }
}

export default function WorkoutPage() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const day = Number(searchParams.get('day'));

  const [videoUrl, setVideoUrl] = useState('');
  const [session, setSession] = useState(null);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workoutName, setWorkoutName] = useState(workoutId);

  // Session initialization (resume or seed)
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
          // No active session: seed from last or defaults
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

  // Fetch Firestore workout name and video URL
  useEffect(() => {
    if (!workoutId) return;
    const fetchData = async () => {
      try {
        const wDoc = await getDoc(doc(db, 'workouts', workoutId));
        if (wDoc.exists()) {
          if (wDoc.data().name) setWorkoutName(wDoc.data().name);
          if (wDoc.data().videoUrl) {
            setVideoUrl(
              `https://seedr-proxy.vinoda.workers.dev/?videoUrl=${encodeURIComponent(wDoc.data().videoUrl)}`
            );
          }
        }
      } catch {
        setWorkoutName(workoutId);
      }
    };
    fetchData();
  }, [workoutId]);

  // Auto-save on table change
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

  // Restore last session’s layout
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
      alert('Could not restore layout.');
    }
  }, [user, workoutId]);

  // Table edit helpers
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

  // Complete Workout
  const completeWorkout = async () => {
    if (!session) return;
    try {
      const sessionRef = doc(db, 'workouts', workoutId, 'sessions', session.id);
      await updateDoc(sessionRef, { completedAt: serverTimestamp() });
      if (user && workoutId && typeof day === 'number' && !isNaN(day)) {
        await markWorkoutCompleted(user.uid, workoutId, day, session.id);
      }
      navigate(
        `/workouts/${workoutId}/complete`,
        { state: { session: { ...session, columns, rows } } }
      );
    } catch (err) {
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
          <h1 className="text-2xl font-bold mb-4">Workout: {workoutName}</h1>
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
    <div className="p-6">

    
    {/* MOBILE: tap-to-show delete with two-step confirmation */}
    <div className="sm:hidden space-y-6 p-4">
    {rows.map(row => (
      <MobileCard
      key={row.id}
      columns={columns}
      row={row}
      updateCell={updateCell}
      deleteRow={deleteRow}
      />
    ))}
    </div>



    
    {/* TABLE: desktop & larger */}
    <div className="hidden sm:block overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 table-auto">
    <thead className="bg-gray-50 sticky top-0">
    <tr>
    {columns.map((col, idx) => (
      <th
      key={col}
      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                ${idx === 0 ? 'w-2/5 sticky left-0 bg-gray-50 z-10' : ''}
                `}
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
    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
    Actions
    </th>
    </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
    {rows.map(row => (
      <tr key={row.id} className="hover:bg-gray-100">
      {columns.map((col, idx) => (
        <td
        key={col}
        className={`px-4 py-2 align-top
                  ${idx === 0 ? 'whitespace-normal break-words sticky left-0 bg-white z-0' : 'whitespace-nowrap'}
                  text-sm`}
        >
        {idx === 0 ? (
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
      <td className="px-4 py-2 whitespace-nowrap text-center text-sm">
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
  