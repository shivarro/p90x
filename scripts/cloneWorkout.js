// scripts/cloneWorkout.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // download from Firebase console

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

/**
 * Clone a workout and its sessions subcollection, using a custom ID
 * @param {string} srcWorkoutId   - ID of the workout to clone
 * @param {string} newWorkoutId   - ID to assign to the cloned workout
 */
async function cloneWorkout(srcWorkoutId, newWorkoutId = "default") {
  // 1. Read source doc
  const srcRef = db.collection("workouts").doc(srcWorkoutId);
  const srcSnap = await srcRef.get();
  if (!srcSnap.exists) throw new Error(`Source workout '${srcWorkoutId}' not found`);
  const srcData = srcSnap.data();

  // 2. Create new doc with provided ID
  const dstRef = db.collection("workouts").doc(newWorkoutId);
  await dstRef.set({
    ...srcData,
    // Preserve original name or override: here we keep the same name
    name: srcData.name,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 3. Copy 'sessions' subcollection
  const sessionsSnap = await srcRef.collection("sessions").get();
  const batch = db.batch();
  sessionsSnap.forEach(docSnap => {
    const dstSessionRef = dstRef.collection("sessions").doc();
    batch.set(dstSessionRef, docSnap.data());
  });
  await batch.commit();

  console.log(`Cloned to new workout ID: ${newWorkoutId}`);
}

// CLI entry: node cloneWorkout.js <sourceId> <newId>
const [ , , srcId, newId ] = process.argv;
if (!srcId || !newId) {
  console.error("Usage: node cloneWorkout.js <sourceId> <newWorkoutId>");
  process.exit(1);
}
cloneWorkout(srcId, newId).catch(err => {
  console.error(err);
  process.exit(1);
});
