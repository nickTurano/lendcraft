import { useState, useRef, useEffect } from 'react';
import { decodeEvents } from '../sharing';
import { addEvent, getMyName, setMyName } from '../db';
import type { LendingEvent } from '../db';

export function Import() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [identityPrompt, setIdentityPrompt] = useState<{ names: string[]; events: LendingEvent[] } | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);

  const importEvents = async (events: LendingEvent[]) => {
    let added = 0;
    for (const event of events) {
      const wasAdded = await addEvent(event);
      if (wasAdded) added++;
    }
    const dupes = events.length - added;
    let message = `Imported ${added} event${added !== 1 ? 's' : ''}`;
    if (dupes > 0) message += ` (${dupes} duplicate${dupes !== 1 ? 's' : ''} skipped)`;
    setStatus({ type: 'success', message });
  };

  const handleImport = async (input: string) => {
    try {
      const events = decodeEvents(input.trim());
      const myName = await getMyName();

      // Get unique names from events
      const names = [...new Set(events.flatMap(e => [e.lenderName, e.borrowerName]))];

      // If user has no name set and there are names to pick from, ask who they are
      if (!myName && names.length > 0) {
        // Check if there are exactly 2 people — common case
        const nameMatch = myName ? names.some(n => n.toLowerCase() === myName.toLowerCase()) : false;
        if (!nameMatch) {
          setIdentityPrompt({ names, events });
          setCode('');
          return;
        }
      }

      await importEvents(events);
      setCode('');
    } catch {
      setStatus({ type: 'error', message: 'Invalid share code. Check the code and try again.' });
    }
  };

  const handleIdentityChoice = async (chosenName: string) => {
    if (!identityPrompt) return;
    await setMyName(chosenName);
    await importEvents(identityPrompt.events);
    setIdentityPrompt(null);
  };

  const startScanner = async () => {
    if (!videoRef.current) return;
    setScanning(true);
    setStatus(null);

    const { Html5Qrcode } = await import('html5-qrcode');
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          scanner.stop().then(() => {
            setScanning(false);
            handleImport(decodedText);
          });
        },
        () => {},
      );
    } catch {
      setStatus({ type: 'error', message: 'Could not access camera. Try pasting the code instead.' });
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Import</h1>

      {status && (
        <div className={`p-3 rounded-lg mb-4 ${
          status.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'
        }`}>
          {status.message}
        </div>
      )}

      {identityPrompt && (
        <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-600">
          <p className="font-semibold mb-1">Which one are you?</p>
          <p className="text-sm text-slate-400 mb-4">We need to know so your dashboard shows the right cards.</p>
          <div className="space-y-2">
            {identityPrompt.names.map(n => (
              <button
                key={n}
                onClick={() => handleIdentityChoice(n)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors"
              >
                I'm {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Scan QR Code</h2>
        <div id="qr-reader" ref={videoRef} className="rounded-xl overflow-hidden mb-3" />
        {scanning ? (
          <button
            onClick={stopScanner}
            className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
          >
            Stop Scanner
          </button>
        ) : (
          <button
            onClick={startScanner}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors"
          >
            Open Camera
          </button>
        )}
      </section>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-slate-500 text-sm">or</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Paste Code</h2>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Paste share code here (starts with MTG1:)"
          className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono text-sm h-32 resize-none"
        />
        <button
          onClick={() => handleImport(code)}
          disabled={!code.trim()}
          className="w-full mt-3 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:text-slate-400 rounded-lg font-semibold transition-colors"
        >
          Import
        </button>
      </section>
    </div>
  );
}
