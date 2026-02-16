import { useState } from 'react';
import { useMyName, useFriends } from '../hooks';
import { generateEventId, addLocalEvent, addFriend, type LendingEvent } from '../db';
import { encodeEvents } from '../sharing';
import { CardAutocomplete } from '../components/CardAutocomplete';
import { ShareModal } from '../components/ShareModal';

export function LendCard() {
  const { name: myName } = useMyName();
  const { friends, reload: reloadFriends } = useFriends();
  const [cardName, setCardName] = useState('');
  const [borrower, setBorrower] = useState('');
  const [customBorrower, setCustomBorrower] = useState('');
  const [note, setNote] = useState('');
  const [shareCode, setShareCode] = useState<string | null>(null);

  const effectiveBorrower = (borrower && borrower !== '__custom__') ? borrower : customBorrower.trim();

  const handleSubmit = async () => {
    if (!cardName || !effectiveBorrower || !myName) return;

    const timestamp = Date.now();
    const partial = {
      type: 'lend' as const,
      cardName,
      lenderName: myName,
      borrowerName: effectiveBorrower,
      timestamp,
      note: note || undefined,
    };
    const id = generateEventId(partial);
    const event: LendingEvent = { ...partial, id };
    await addLocalEvent(event);

    await addFriend(effectiveBorrower);
    reloadFriends();

    setShareCode(encodeEvents([event]));
    setCardName('');
    setBorrower('');
    setCustomBorrower('');
    setNote('');
  };

  return (
    <div className="p-4 pb-4">
      <h1 className="text-2xl font-bold mb-6">Lend a Card</h1>

      <div className="space-y-4">
        <CardAutocomplete value={cardName} onChange={setCardName} />

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
          disabled={!cardName || !effectiveBorrower}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:text-slate-400 rounded-lg font-semibold transition-colors text-lg"
        >
          Lend Card
        </button>
      </div>

      {shareCode && <ShareModal code={shareCode} onClose={() => setShareCode(null)} />}
    </div>
  );
}
