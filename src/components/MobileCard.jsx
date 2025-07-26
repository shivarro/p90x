// src/components/MobileCard.jsx
import React, { useState } from 'react';

export default function MobileCard({ columns, row, updateCell, deleteRow }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md p-5">
      {/* Editable header toggles delete */}
      <input
        type="text"
        value={row.values[columns[0]] || ''}
        placeholder="Exercise"
        onChange={e => updateCell(row.id, columns[0], e.target.value)}
        onClick={() => setShowConfirm(prev => !prev)}
        className="text-xl font-semibold mb-4 w-full bg-transparent border-b border-gray-300 focus:outline-none"
      />

      {columns.slice(1).map(col => (
        <div key={col} className="mb-3">
          <label className="block text-gray-600 font-medium mb-1">
            {col.charAt(0).toUpperCase() + col.slice(1)}
          </label>
          <input
            type="text"
            value={row.values[col] || ''}
            onChange={e => updateCell(row.id, col, e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      ))}

      {showConfirm ? (
        <button
          onClick={() => deleteRow(row.id)}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-md shadow-sm"
        >
          Confirm Delete
        </button>
      ) : (
        <div className="mt-2 text-center text-sm text-gray-500">
          Tap exercise header to reveal delete
        </div>
      )}
    </div>
  );
}
