import { useCardAutocomplete } from '../hooks';
import { getCardImageUrl } from '../scryfall';

interface Props {
  value: string;
  onChange: (name: string) => void;
}

export function CardAutocomplete({ value, onChange }: Props) {
  const { query, setQuery, suggestions } = useCardAutocomplete();

  const handleSelect = (name: string) => {
    onChange(name);
    setQuery('');
  };

  const handleConfirmManual = () => {
    if (query.trim()) {
      onChange(query.trim());
      setQuery('');
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm text-slate-300 mb-1">Card Name</label>
      {value ? (
        <div className="flex items-center gap-3 bg-slate-700 rounded-lg p-3">
          <img
            src={getCardImageUrl(value)}
            alt={value}
            className="w-16 h-auto rounded"
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex-1">
            <p className="font-medium">{value}</p>
            <button
              onClick={() => { onChange(''); setQuery(''); }}
              className="text-sm text-red-400 hover:text-red-300 mt-1"
            >
              Change card
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirmManual(); }}
              placeholder="Search for a card..."
              className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            {query.trim() && (
              <button
                onClick={handleConfirmManual}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors text-sm shrink-0"
              >
                Use
              </button>
            )}
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto border border-slate-600">
              {suggestions.map(name => (
                <li key={name}>
                  <button
                    onClick={() => handleSelect(name)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-600 transition-colors flex items-center gap-3"
                  >
                    <img
                      src={getCardImageUrl(name)}
                      alt=""
                      className="w-8 h-auto rounded"
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span>{name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
