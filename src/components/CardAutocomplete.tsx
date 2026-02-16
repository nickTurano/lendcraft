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
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for a card..."
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
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
