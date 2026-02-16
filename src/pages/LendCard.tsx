import { useState } from 'react';
import { useMyName, useFriends } from '../hooks';
import { generateEventId, addLocalEvent, addFriend, type LendingEvent } from '../db';
import { encodeEvents } from '../sharing';
import { CardAutocomplete } from '../components/CardAutocomplete';
import { ShareModal } from '../components/ShareModal';
import { getCardImageUrl } from '../scryfall';

export function LendCard() {
  const { name: myName } = useMyName();
  const { friends, reload: reloadFriends } = useFriends();
  const [cards, setCards] = useState<string[]>([]);
  const [borrower, setBorrower] = useState('');
  const [customBorrower, setCustomBorrower] = useState('');
  const [note, setNote] = useState('');
  const [shareCode, setShareCode] = useState<string | null>(null);

  const effectiveBorrower = (borrower && borrower !== '__custom__') ? borrower : customBorrower.trim();

  const addCard = (name: string) => {
    if (name && !cards.includes(name)) {
      setCards(prev => [...prev, name]);
    }
  };

  const removeCard = (name: string) => {
    setCards(prev => prev.filter(c => c !== name));
  };

  const handleSubmit = async () => {
    if (cards.length === 0 || !effectiveBorrower || !myName) return;

    const baseTimestamp = Date.now();
    const events: LendingEvent[] = cards.map((cardName, i) => {
      const partial = {
        type: 'lend' as const,
        cardName,
        lenderName: myName,
        borrowerName: effectiveBorrower,
        timestamp: baseTimestamp + i, // offset for unique IDs
        note: note || undefined,
      };
      const id = generateEventId(partial);
      return { ...partial, id };
    });

    for (const event of events) {
      await addLocalEvent(event);
    }

    await addFriend(effectiveBorrower);
    reloadFriends();

    setShareCode(encodeEvents(events));
    setCards([]);
    setBorrower('');
    setCustomBorrower('');
    setNote('');
  };

  return (
    <div className="p-4 pb-4">
      <h1 className="text-2xl font-bold mb-6">Lend a Card</h1>

      <div className="space-y-4">
        <CardAutocomplete value="" onChange={addCard} />

        {cards.length > 0 && (
          <div className="space-y-2">
            {cards.map(name => (
              <div key={name} className="flex items-center gap-3 bg-slate-700 rounded-lg p-2">
                <img
                  src={getCardImageUrl(name)}
                  alt={name}
                  className="w-10 h-auto rounded"
                  loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="flex-1 text-sm">{name}</span>
                <button
                  onClick={() => removeCard(name)}
                  className="text-red-400 hover:text-red-300 px-2 py-1 text-lg leading-none"
                  aria-label={`Remove ${name}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300 mb-1">Lending to</label>
          {friends.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {friends.map(f => (
                <button
                  key={f}
                  onClick={() => { setBorrower(f); setCustomBorrower(''); }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    borrower === f ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={() => setBorrower('__custom__')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  borrower === '__custom__' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                + New
              </button>
            </div>
          )}
          {(!borrower || borrower === '__custom__') && (
            <input
              type="text"
              value={customBorrower}
              onChange={e => { setCustomBorrower(e.target.value); setBorrower('__custom__'); }}
              placeholder="Enter their name"
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. for FNM tournament"
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={cards.length === 0 || !effectiveBorrower}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:text-slate-400 rounded-lg font-semibold transition-colors text-lg"
        >
          {cards.length <= 1 ? 'Lend Card' : `Lend ${cards.length} Cards`}
        </button>
      </div>

      {shareCode && <ShareModal code={shareCode} onClose={() => setShareCode(null)} />}
    </div>
  );
}
