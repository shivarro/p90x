// src/data/planDefinitions.js

// Classic P90X Plan Definitions

// Week templates for each phase
const heavyWeekPhase1 = [
  ['cb','ab'],          // Mon: Chest & Back + Ab Ripper X
  ['plyo'],             // Tue: Plyometrics
  ['shoulderarms','ab'],// Wed: Shoulder & Arms + Ab Ripper X
  ['yoga'],             // Thu: Yoga X
  ['legsback','ab'],    // Fri: Legs & Back + Ab Ripper X
  ['kenpo'],            // Sat: Kenpo X
  ['stretch']           // Sun: X-Stretch (or rest)
];

const heavyWeekPhase2 = [
  ['cst','ab'],          // Mon: Chest, Shoulders & Triceps + Ab Ripper X
  ['plyo'],              // Tue: Plyometrics
  ['backbiceps','ab'],   // Wed: Back & Biceps + Ab Ripper X  (add this workout doc)
  ['yoga'],              // Thu: Yoga X
  ['legsback','ab'],     // Fri: Legs & Back + Ab Ripper X
  ['kenpo'],             // Sat: Kenpo X
  ['stretch']            // Sun: X-Stretch (or rest)
];

const heavyWeekPhase3 = [
  ['cb','ab'],           // Mon: Chest & Back + Ab Ripper X
  ['plyo'],              // Tue: Plyometrics
  ['shoulderarms','ab'], // Wed: Shoulder & Arms + Ab Ripper X
  ['yoga'],              // Thu: Yoga X
  ['legsback','ab'],     // Fri: Legs & Back + Ab Ripper X
  ['kenpo'],             // Sat: Kenpo X
  ['stretch']            // Sun: X-Stretch (or rest)
];

// Recovery week is the same across all phases
const recoveryWeek = [
  ['yoga'],   // Mon: Yoga X
  ['synerg'], // Tue: Core Synergistics
  ['kenpo'],  // Wed: Kenpo X
  ['stretch'],// Thu: X-Stretch
  ['synerg'], // Fri: Core Synergistics
  ['yoga'],   // Sat: Yoga X
  ['stretch'] // Sun: X-Stretch (or rest)
];

// Build each 4-week phase (3 heavy weeks + 1 recovery week)
export const PLAN_DEFINITIONS = {
  classic: {
    phase1: [
      ...heavyWeekPhase1,
      ...heavyWeekPhase1,
      ...heavyWeekPhase1,
      ...recoveryWeek
    ],
    phase2: [
      ...heavyWeekPhase2,
      ...heavyWeekPhase2,
      ...heavyWeekPhase2,
      ...recoveryWeek
    ],
    phase3: [
      ...heavyWeekPhase3,
      ...heavyWeekPhase3,
      ...heavyWeekPhase3,
      ...recoveryWeek
    ]
  }
};
