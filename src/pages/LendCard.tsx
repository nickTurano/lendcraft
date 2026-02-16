import { useState } from 'react';
import { useMyName, useFriends } from '../hooks';
import { generateEventId, addEvent, addFriend, type LendingEvent } from '../db';
import { encodeEvents } from '../sharing';
import { CardAutocomplete } from '../components/CardAutocomplete';
import { ShareModal } from '../components/ShareModal';

export function LendCard() {
  const { name: myName, updateName } = useMyName();
  const { friends, reload: reloadFriends } = useFriends();
  const [yourName, setYourName] = useState(myName ?? '');
  const [cardName, setCardName] = useState('');
  const [otherPerson, setOtherPerson] = useState('');
  const [customOther, setCustomOther] = useState('');
  const [note, setNote] = useState('');
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [direction, setDirection] = useState<'lend' | 'borrow'>('lend');

  const otherFriends = friends.filter(f => f.toLowerCase() !== yourName.toLowerCase());
  const effectiveOther = (otherPerson && otherPerson !== '__custom__') ? otherPerson : customOther.trim();

  const handleSubmit = async () => {
    if (!cardName || !effectiveOther || !yourName.trim()) return;

    const you = yourName.trim();

    // Remember name for next time
    if (!myName || myName.toLowerCase() !== you.toLowerCase()) {
      await updateName(you);
    }

    const lenderName = direction === 'lend' ? you : effectiveOther;
    const borrowerName = direction === 'lend' ? effectiveOther : you;

    const timestamp = Date.now();
    const partial = {
      type: 'lend' as const,
      cardName,
      lenderName,
      borrowerName,
      timestamp,
      note: note || undefined,
    };
    const id = generateEventId(partial);
    const event: LendingEvent = { ...partial, id };
    await addEvent(event);

    // Save the other person as a friend
    await addFriend(effectiveOther);
    reloadFriends();

    setShareCode(encodeEvents([event]));
    setCardName('');
    setOtherPerson('');
    setCustomOther('');
    setNote('');
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Record a Loan</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setDirection('lend')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            direction === 'lend' ? 'bg-indigo-600' : 'bg-slate-700 text-slate-400'
          }`}
        >
          I'm Lending
        </button>
        <button
          onClick={() => setDirection('borrow')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            direction === 'borrow' ? 'bg-amber-600' : 'bg-slate-700 text-slate-400'
          }`}
        >
          I'm Borrowing
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Your name</label>
          <input
            type="text"
            value={yourName}
            onChange={e => setYourName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <CardAutocomplete value={cardName} onChange={setCardName} />

        <div>
          <label className="block text-sm text-slate-300 mb-1">
            {direction === 'lend' ? 'Lending to' : 'Borrowing from'}
          </label>
          {otherFriends.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {otherFriends.map(f => (
                <button
                  key={f}
                  onClick={() => { setOtherPerson(f); setCustomOther(''); }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    otherPerson === f ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={() => setOtherPerson('__custom__')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  otherPerson === '__custom__' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                + New
              </button>
            </div>
          )}
          {(!otherPerson || otherPerson === '__custom__') && (
            <input
              type="text"
              value={customOther}
              onChange={e => { setCustomOther(e.target.value); setOtherPerson('__custom__'); }}
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
          disabled={!cardName || !effectiveOther || !yourName.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:text-slate-400 rounded-lg font-semibold transition-colors text-lg"
        >
          Record Loan
        </button>
      </div>

      {shareCode && <ShareModal code={shareCode} onClose={() => setShareCode(null)} />}
    </div>
  );
}
