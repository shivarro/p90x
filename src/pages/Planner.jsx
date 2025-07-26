// src/pages/Planner.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { PLAN_DEFINITIONS } from '../data/planDefinitions';

export default function Planner() {
  const { user } = useAuth();
  const [workoutMap, setWorkoutMap] = useState({});
  const [planDays, setPlanDays] = useState([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let unsubscribe;
    const init = async () => {
      // 1) ensure user doc + currentPlan fields
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          lastSeen: serverTimestamp(),
          currentPlan: {
            planId: 'classic',
            dayIndex: 0,
            startedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        },
        { merge: true }
      );

      // 2) subscribe for plan changes (live updates on complete)
      unsubscribe = onSnapshot(userRef, snap => {
        const plan = snap.data()?.currentPlan;
        if (plan && typeof plan.dayIndex === 'number') {
          setDayIndex(plan.dayIndex);
        }
      });

      // 3) flatten all 3 phases into one 90-day array
      const def = PLAN_DEFINITIONS['classic'];
      setPlanDays([
        ...def.phase1,
        ...def.phase2,
        ...def.phase3,
      ]);

      // 4) fetch workout metadata once
      const q = query(collection(db, 'workouts'), orderBy('order'));
      const snap = await getDocs(q);
      const map = {};
      snap.docs.forEach(d => {
        map[d.id] = { id: d.id, ...d.data() };
      });
      setWorkoutMap(map);

      setLoading(false);
    };

    init().catch(err => {
      console.error(err);
      setLoading(false);
    });

    // cleanup
    return () => unsubscribe && unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="p-6 text-center">Loading your plan…</div>;
  }

  // split into past, today, upcoming
  const past = planDays.slice(0, dayIndex);
  const today = planDays[dayIndex] || [];
  const upcoming = planDays.slice(dayIndex + 1);

  // render each workout-ID in each day as its own card
  const renderDayCards = (daysArray, offset = 0, isPast = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {daysArray.map((workoutIds, dayOffset) =>
        workoutIds.map((wid, idx) => {
          const dayNumber = offset + dayOffset + 1;
          const w = workoutMap[wid] || { name: wid };
          return (
            <Link
              key={`${dayNumber}-${wid}-${idx}`}
              to={`/workouts/${wid}`}
              className="relative block bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6"
            >
              {isPast && (
                <span className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-1 text-xs rounded-full">
                  Completed
                </span>
              )}
              <div className="mb-2">
                <span className="text-lg font-medium text-gray-700">
                  Day {dayNumber}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {w.name}
              </h2>
            </Link>
          );
        })
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8">
        Your 90-Day Plan
      </h1>

      {/* Today's Workout */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Todays Workout</h2>
        {today.length > 0 ? (
          renderDayCards([today], dayIndex)
        ) : (
          <p className="text-gray-600">Nothing scheduled for today.</p>
        )}
      </section>

      {/* Upcoming Workouts */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Workouts</h2>
        {upcoming.length > 0 ? (
          renderDayCards(upcoming, dayIndex + 1)
        ) : (
          <p className="text-gray-600">No upcoming workouts.</p>
        )}
      </section>

      {/* Past Workouts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Past Workouts</h2>
        {past.length > 0 ? (
          renderDayCards(past, 0, true)
        ) : (
          <p className="text-gray-600">No workouts completed yet.</p>
        )}
      </section>
    </div>
  );
}
