// src/utils/db.js
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db }           from "../firebase";

export async function saveLastLog(workoutId, entries) {
  const uid = auth.currentUser.uid;
  await setDoc(
    doc(db, "users", uid, "workouts", workoutId, "lastLog"),
    { entries, updatedAt: new Date() }
  );
}

export async function loadLastLog(workoutId) {
  const uid  = auth.currentUser.uid;
  const snap = await getDoc(
    doc(db, "users", uid, "workouts", workoutId, "lastLog")
  );
  return snap.exists() ? snap.data().entries : [];
}
