import { useState } from 'react';

export function NameSetup({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Lendcraft</h1>
        <p className="text-slate-400 mb-6">Track card loans between friends. No accounts needed.</p>
        <label className="block text-sm text-slate-300 mb-2">What's your name?</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your display name"
          className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 mb-4"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()); }}
        />
        <button
          onClick={() => name.trim() && onSave(name.trim())}
          disabled={!name.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:text-slate-400 rounded-lg font-semibold transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
