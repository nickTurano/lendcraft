import { useState, useCallback } from 'react';
import { useActiveLoans, useMyName } from '../hooks';
import { generateEventId, addEvent, type LendingEvent } from '../db';
import { encodeEvents } from '../sharing';
import { getCardImageUrl } from '../scryfall';
import { ShareModal } from '../components/ShareModal';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { name } = useMyName();
  const { loans, reload } = useActiveLoans();
  const [shareCode, setShareCode] = useState<string | null>(null);
  const navigate = useNavigate();

  const nameLC = name?.toLowerCase();
  const lentOut = nameLC ? loans.filter(l => l.event.lenderName.toLowerCase() === nameLC) : [];
  const borrowing = nameLC ? loans.filter(l => l.event.borrowerName.toLowerCase() === nameLC) : [];

  const handleReturn = useCallback(async (lendEvent: LendingEvent) => {
    const timestamp = Date.now();
    const partial = {
      type: 'return' as const,
      cardName: lendEvent.cardName,
      scryfallId: lendEvent.scryfallId,
      setCode: lendEvent.setCode,
      lenderName: lendEvent.lenderName,
      borrowerName: lendEvent.borrowerName,
      timestamp,
      returnOfEventId: lendEvent.id,
    };
    const id = generateEventId(partial);
    const event: LendingEvent = { ...partial, id };
    await addEvent(event);
    setShareCode(encodeEvents([event]));
    reload();
  }, [reload]);

  if (!name) {
    return (
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold mb-4">Lendcraft</h1>
        <p className="text-slate-400 mb-6">Track MTG card loans between friends. No accounts needed.</p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/lend')}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors text-lg"
          >
            Record a Loan
          </button>
          <button
            onClick={() => navigate('/import')}
            className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors text-lg"
          >
            Import a Share Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-indigo-400">
          Cards I've Lent Out ({lentOut.length})
        </h2>
        {lentOut.length === 0 ? (
          <p className="text-slate-400 text-sm">No cards currently lent out.</p>
        ) : (
          <div className="space-y-2">
            {lentOut.map(({ event }) => (
              <div key={event.id} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                <img
                  src={getCardImageUrl(event.cardName)}
                  alt={event.cardName}
                  className="w-12 h-auto rounded"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.cardName}</p>
                  <p className="text-sm text-slate-400">&rarr; {event.borrowerName}</p>
                  <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-amber-400">
          Cards I'm Borrowing ({borrowing.length})
        </h2>
        {borrowing.length === 0 ? (
          <p className="text-slate-400 text-sm">Not borrowing any cards.</p>
        ) : (
          <div className="space-y-2">
            {borrowing.map(({ event }) => (
              <div key={event.id} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                <img
                  src={getCardImageUrl(event.cardName)}
                  alt={event.cardName}
                  className="w-12 h-auto rounded"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.cardName}</p>
                  <p className="text-sm text-slate-400">&larr; {event.lenderName}</p>
                  <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleReturn(event)}
                  className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold transition-colors shrink-0"
                >
                  Return
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {shareCode && <ShareModal code={shareCode} onClose={() => setShareCode(null)} />}
    </div>
  );
}
