import { useState, useCallback } from 'react';
import { useActiveLoans } from '../hooks';
import { generateEventId, addLocalEvent, type LendingEvent } from '../db';
import { encodeEvents } from '../sharing';
import { getCardImageUrl } from '../scryfall';
import { ShareModal } from '../components/ShareModal';

export function Dashboard() {
  const { loans, reload } = useActiveLoans();
  const [shareCode, setShareCode] = useState<string | null>(null);

  const lentOut = loans.filter(l => l.isLocal);
  const borrowing = loans.filter(l => !l.isLocal);

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
    await addLocalEvent(event);
    setShareCode(encodeEvents([event]));
    reload();
  }, [reload]);

  const renderCard = (event: LendingEvent, subtitle: string) => (
    <div key={event.id} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
      <img
        src={getCardImageUrl(event.cardName)}
        alt={event.cardName}
        className="w-12 h-auto rounded"
        loading="lazy"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{event.cardName}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
        {event.note && <p className="text-xs text-slate-500 italic">{event.note}</p>}
        <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleDateString()}</p>
      </div>
      <button
        onClick={() => handleReturn(event)}
        className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold transition-colors shrink-0"
      >
        Return
      </button>
    </div>
  );

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Active Loans</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-indigo-400">
          Lent Out ({lentOut.length})
        </h2>
        {lentOut.length === 0 ? (
          <p className="text-slate-400 text-sm">No cards currently lent out.</p>
        ) : (
          <div className="space-y-2">
            {lentOut.map(({ event }) => renderCard(event, `→ ${event.borrowerName}`))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-amber-400">
          Borrowing ({borrowing.length})
        </h2>
        {borrowing.length === 0 ? (
          <p className="text-slate-400 text-sm">Not borrowing any cards.</p>
        ) : (
          <div className="space-y-2">
            {borrowing.map(({ event }) => renderCard(event, `← ${event.lenderName}`))}
          </div>
        )}
      </section>

      {shareCode && <ShareModal code={shareCode} onClose={() => setShareCode(null)} />}
    </div>
  );
}
