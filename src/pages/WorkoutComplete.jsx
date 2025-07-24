// src/pages/WorkoutComplete.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function WorkoutComplete() {
  const { state } = useLocation();
  const session = state?.session;

  if (!session) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Nothing to show</h1>
        <p>No workout data was passed.</p>
        <Link to="/planner" className="text-blue-600 hover:underline">
          Back to Planner
        </Link>
      </div>
    );
  }

  const { columns, rows } = session;
  const totalExercises = rows.length;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">🎉 Congratulations! 🎉</h1>
      <p className="mb-6">You’ve completed your workout. Here are your stats:</p>

      <div className="mb-6">
        <ul className="list-disc ml-6">
          <li><strong>Total exercises:</strong> {totalExercises}</li>
          <li><strong>Total columns tracked:</strong> {columns.length}</li>
        </ul>
      </div>

      <div className="overflow-auto border rounded mb-6">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              {columns.map(col => (
                <th key={col} className="px-4 py-2 border">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col} className="p-2 border text-center">
                    {row.values[col] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        to="/planner"
        className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Back to Planner
      </Link>
    </div>
  );
}
