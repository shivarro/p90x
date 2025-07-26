// src/pages/Planner.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { PLAN_DEFINITIONS } from '../data/planDefinitions';

export default function Planner() {
  const { user } = useAuth();
  const [workoutMap, setWorkoutMap] = useState({});
  const [planDays, setPlanDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!user) return;
    let unsubscribe;
    const init = async () => {
      const def = PLAN_DEFINITIONS['classic'];
      const allDays = [...def.phase1, ...def.phase2, ...def.phase3];
      const daysWithCompletion = [];
      allDays.forEach((dayWorkouts, dayIdx) => {
        dayWorkouts.forEach(wid => {
          daysWithCompletion.push({
            day: dayIdx,
            workoutId: wid,
            completed: false,
          });
        });
      });
      // 1) Seed Firestore ONLY if plan doesn't exist:
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentPlan = userSnap.data()?.currentPlan;
      
      if (!currentPlan) {
        await setDoc(
          userRef,
          {
            lastSeen: serverTimestamp(),
            currentPlan: {
              planId: 'classic',
              days: daysWithCompletion,
              startedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }
          },
          { merge: true }
        );
      } else {
        // Just update lastSeen!
        await updateDoc(userRef, {
          lastSeen: serverTimestamp()
        });
      }

      
      // 2) Subscribe for plan changes (live updates on complete)
      unsubscribe = onSnapshot(userRef, snap => {
        const plan = snap.data()?.currentPlan;
        if (plan) {
          setPlan(plan);
        }
      });
      
      // 3) For compatibility (optional): store just the list of workout IDs per day
      setPlanDays(allDays);
      
      // 4) fetch workout metadata once
      const q = query(collection(db, 'workouts'), orderBy('order'));
      const snap2 = await getDocs(q);
      const map = {};
      snap2.docs.forEach(d => {
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

  // --- GROUPING/LOGIC FOR FLAT DAYS ARRAY ---

  // Group workouts by day: returns [[workoutObj, ...], [workoutObj, ...], ...]
  function groupByDay(daysArr) {
    if (!Array.isArray(daysArr)) return [];
    const map = {};
    daysArr.forEach(w => {
      if (!map[w.day]) map[w.day] = [];
      map[w.day].push(w);
    });
    // Return as an array of arrays, sorted by day
    return Object.values(map).sort((a, b) => a[0].day - b[0].day);
  }

  // Find the index of the first day with any incomplete workout
  function getTodayIndex(grouped) {
    for (let i = 0; i < grouped.length; i++) {
      if (grouped[i].some(w => !w.completed)) return i;
    }
    return grouped.length; // All done!
  }

  // Handle toggling completion status
  async function handleToggleCompleted(dayIdx, workoutIdx, newCompleted) {
    if (!plan) return;
    // Find flat array index for this workout (needed since we're grouped)
    const grouped = groupByDay(plan.days);
    const workout = grouped[dayIdx][workoutIdx];
    const flatIdx = plan.days.findIndex(
      w => w.day === workout.day && w.workoutId === workout.workoutId
    );
    if (flatIdx === -1) return;
    const daysCopy = plan.days.map(w => ({ ...w }));
    daysCopy[flatIdx].completed = newCompleted;
    await updateDoc(doc(db, 'users', user.uid), {
      'currentPlan.days': daysCopy,
      'currentPlan.updatedAt': serverTimestamp()
    });
  }

  if (loading || !plan) {
    return <div className="p-6 text-center">Loading your plan…</div>;
  }

  // --- MAIN LOGIC ---
  const groupedDays = groupByDay(plan.days);
  const todayIndex = getTodayIndex(groupedDays);
  const past = groupedDays.slice(0, todayIndex);
  const today = groupedDays[todayIndex] || [];
  const upcoming = groupedDays.slice(todayIndex + 1);

  // Render cards for each day
  const renderDayCards = (daysArray, offset = 0) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {daysArray.map((workouts, dayOffset) =>
      workouts.map((workout, idx) => {
        const dayNumber = offset + dayOffset + 1;
        const w = workoutMap[workout.workoutId] || { name: workout.workoutId };
        const workoutLink = `/workouts/${workout.workoutId}?day=${workout.day}`;
        return (
          <div
          key={`${dayNumber}-${workout.workoutId}-${idx}`}
          className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6"
          >
          <Link
          to={workoutLink}
          className="block focus:outline-none"
          tabIndex={-1}
          >
          {workout.completed && (
            <span className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-1 text-xs rounded-full z-10">
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
          {/* Checkbox for marking complete/incomplete */}
          <label className="flex items-center mt-4 gap-2">
          <input
          type="checkbox"
          checked={workout.completed}
          onChange={() => handleToggleCompleted(offset + dayOffset, idx, !workout.completed)}
          className="form-checkbox h-5 w-5 text-green-600"
          onClick={e => e.stopPropagation()}
          onFocus={e => e.stopPropagation()}
          />
          <span className="text-sm text-gray-700">
          Mark as {workout.completed ? "Incomplete" : "Completed"}
          </span>
          </label>
          </div>
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
          renderDayCards([today], todayIndex)
        ) : (
          <p className="text-gray-600">Nothing scheduled for today.</p>
        )}
      </section>

      {/* Upcoming Workouts */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Workouts</h2>
        {upcoming.length > 0 ? (
          renderDayCards(upcoming, todayIndex + 1)
        ) : (
          <p className="text-gray-600">No upcoming workouts.</p>
        )}
      </section>

      {/* Past Workouts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Past Workouts</h2>
        {past.length > 0 ? (
          renderDayCards(past, 0)
        ) : (
          <p className="text-gray-600">No workouts completed yet.</p>
        )}
      </section>
    </div>
  );
}
  