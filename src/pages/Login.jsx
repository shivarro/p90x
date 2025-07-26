// src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth }           from '../hooks/useAuth';
import { useNavigate }       from 'react-router-dom';

export default function Login() {
  const { login, signup } = useAuth();
  const nav = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleSignIn = async e => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      nav('/planner');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignUp = async e => {
    e.preventDefault();
    setError('');
    try {
      await signup(email, password);
      // Firebase will auto-sign you in after createUserWithEmailAndPassword
      nav('/planner');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-3xl font-extrabold text-center text-gray-800">
          { /* You can swap this heading based on mode */ }
          Sign In or Sign Up
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleSignIn}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
