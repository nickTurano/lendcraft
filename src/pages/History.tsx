import { useState } from 'react';
import { useAllEvents, useFriends } from '../hooks';
import { getCardImageUrl } from '../scryfall';

export function History() {
  const { events } = useAllEvents();
  const { friends } = useFriends();
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? events.filter(e => e.lenderName === filter || e.borrowerName === filter)
    : events;

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">History</h1>

      {friends.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              !filter ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            All
          </button>
          {friends.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-slate-400 text-sm">No events recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(event => (
            <div key={event.id} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
              <img
                src={getCardImageUrl(event.cardName)}
                alt={event.cardName}
                className="w-10 h-auto rounded"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    event.type === 'lend' ? 'bg-indigo-900 text-indigo-300' : 'bg-green-900 text-green-300'
                  }`}>
                    {event.type === 'lend' ? 'LEND' : 'RETURN'}
                  </span>
                  <span className="font-medium truncate">{event.cardName}</span>
                </div>
                <p className="text-sm text-slate-400">
                  {event.lenderName} → {event.borrowerName}
                </p>
                {event.note && <p className="text-xs text-slate-500 italic">{event.note}</p>}
                <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
