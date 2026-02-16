import { useState, useEffect } from 'react';
import { useFriends } from '../hooks';
import { generateEventId, addEvent, addFriend, type LendingEvent, db } from '../db';
import { encodeEvents } from '../sharing';
import { CardAutocomplete } from '../components/CardAutocomplete';
import { ShareModal } from '../components/ShareModal';

export function LendCard() {
  const { friends, reload: reloadFriends } = useFriends();
  const [lender, setLender] = useState('');
  const [borrower, setBorrower] = useState('');
  const [customLender, setCustomLender] = useState('');
  const [customBorrower, setCustomBorrower] = useState('');
  const [cardName, setCardName] = useState('');
  const [note, setNote] = useState('');
  const [shareCode, setShareCode] = useState<string | null>(null);

  // Pre-fill last used lender name
  useEffect(() => {
    db.settings.get('lastLender').then(s => {
      if (s?.value) setLender(s.value);
    });
  }, []);

  const effectiveLender = (lender && lender !== '__custom__') ? lender : customLender.trim();
  const effectiveBorrower = (borrower && borrower !== '__custom__') ? borrower : customBorrower.trim();

  const handleSubmit = async () => {
    if (!cardName || !effectiveLender || !effectiveBorrower) return;

    // Remember lender for next time
    await db.settings.put({ key: 'lastLender', value: effectiveLender });

    // Save both as friends for quick-select
    await addFriend(effectiveLender);
    await addFriend(effectiveBorrower);

    const timestamp = Date.now();
    const partial = {
      type: 'lend' as const,
      cardName,
      lenderName: effectiveLender,
      borrowerName: effectiveBorrower,
      timestamp,
      note: note || undefined,
    };
    const id = generateEventId(partial);
    const event: LendingEvent = { ...partial, id };
    await addEvent(event);

    reloadFriends();
    setShareCode(encodeEvents([event]));
    setCardName('');
    setBorrower('');
    setCustomBorrower('');
    setNote('');
  };

  const renderNamePicker = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    customValue: string,
    setCustomValue: (v: string) => void,
    excludeName: string,
    placeholder: string,
  ) => {
    const options = friends.filter(f => f.toLowerCase() !== excludeName.toLowerCase());
    return (
      <div>
        <label className="block text-sm text-slate-300 mb-1">{label}</label>
        {options.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {options.map(f => (
              <button
                key={f}
                onClick={() => { setValue(f); setCustomValue(''); }}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  value === f ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={() => setValue('__custom__')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                value === '__custom__' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              + New
            </button>
          </div>
        )}
        {(!value || value === '__custom__') && (
          <input
            type="text"
            value={customValue}
            onChange={e => { setCustomValue(e.target.value); setValue('__custom__'); }}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Record a Loan</h1>

      <div className="space-y-4">
        {renderNamePicker(
          'Lender (who owns the card)',
          lender, setLender,
          customLender, setCustomLender,
          effectiveBorrower,
          'Enter lender name',
        )}

        <CardAutocomplete value={cardName} onChange={setCardName} />

        {renderNamePicker(
          'Borrower (who is receiving the card)',
          borrower, setBorrower,
          customBorrower, setCustomBorrower,
          effectiveLender,
          'Enter borrower name',
        )}

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
          disabled={!cardName || !effectiveLender || !effectiveBorrower}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:text-slate-400 rounded-lg font-semibold transition-colors text-lg"
        >
          Record Loan
        </button>
      </div>

      {shareCode && <ShareModal code={shareCode} onClose={() => setShareCode(null)} />}
    </div>
  );
}
