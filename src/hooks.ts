import { useState, useEffect, useCallback, useRef } from 'react';
import { db, getMyName, setMyName, getFriends, getActiveLoans, type ActiveLoan, type LendingEvent } from './db';
import { autocompleteCard } from './scryfall';

export function useMyName() {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyName().then(n => { setName(n); setLoading(false); });
  }, []);

  const updateName = useCallback(async (newName: string) => {
    await setMyName(newName);
    setName(newName);
  }, []);

  return { name, loading, updateName };
}

export function useFriends() {
  const [friends, setFriendsState] = useState<string[]>([]);

  const reload = useCallback(async () => {
    const f = await getFriends();
    setFriendsState(f);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { friends, reload };
}

export function useActiveLoans() {
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const l = await getActiveLoans();
    setLoans(l);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { loans, loading, reload };
}

export function useAllEvents() {
  const [events, setEvents] = useState<LendingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const all = await db.events.orderBy('timestamp').reverse().toArray();
    setEvents(all);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { events, loading, reload };
}

export function useCardAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      autocompleteCard(query).then(results => {
        setSuggestions(results);
        setLoading(false);
      });
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  return { query, setQuery, suggestions, loading };
}
