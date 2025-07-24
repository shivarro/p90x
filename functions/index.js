/* eslint-disable */
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize the Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * HTTPS-Callable function to deep-clone a workout document and its 'sessions' subcollection.
 *
 * Expects data: { srcWorkoutId: string, newWorkoutName?: string }
 * Returns: { newWorkoutId: string }
 */
exports.cloneWorkout = functions.https.onCall(async (data, context) => {
  // 1) Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to use this function.'
    );
  }

  const { srcWorkoutId, newWorkoutName = 'default' } = data;
  if (!srcWorkoutId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing source workout ID.'
    );
  }

  // 2) Read the source workout
  const srcRef = db.collection('workouts').doc(srcWorkoutId);
  const srcSnap = await srcRef.get();
  if (!srcSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      `Workout '${srcWorkoutId}' does not exist.`
    );
  }
  const srcData = srcSnap.data();

  // 3) Create the cloned workout with a new ID
  const dstRef = db.collection('workouts').doc();
  await dstRef.set({
    ...srcData,
    name: newWorkoutName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 4) Copy 'sessions' subcollection
  const sessionsSnap = await srcRef.collection('sessions').get();
  const batch = db.batch();
  sessionsSnap.forEach(docSnap => {
    const dstSessionRef = dstRef.collection('sessions').doc();
    batch.set(dstSessionRef, docSnap.data());
  });
  await batch.commit();

  // 5) Return new doc ID
  return { newWorkoutId: dstRef.id };
});
