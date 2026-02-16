import Dexie, { type EntityTable } from 'dexie';

export interface LendingEvent {
  id: string;
  type: 'lend' | 'return';
  cardName: string;
  scryfallId?: string;
  setCode?: string;
  lenderName: string;
  borrowerName: string;
  timestamp: number;
  returnOfEventId?: string;
  note?: string;
}

export interface AppSettings {
  key: string;
  value: string;
}

export interface Friend {
  name: string;
}

export interface CardCache {
  query: string;
  results: string[];
  cachedAt: number;
}

const db = new Dexie('Lendcraft') as Dexie & {
  events: EntityTable<LendingEvent, 'id'>;
  settings: EntityTable<AppSettings, 'key'>;
  friends: EntityTable<Friend, 'name'>;
  cardCache: EntityTable<CardCache, 'query'>;
};

db.version(1).stores({
  events: 'id, type, cardName, lenderName, borrowerName, timestamp, returnOfEventId',
  settings: 'key',
  friends: 'name',
  cardCache: 'query, cachedAt',
});

export { db };

export async function generateEventId(event: Omit<LendingEvent, 'id'>): Promise<string> {
  const core = `${event.lenderName}|${event.borrowerName}|${event.cardName}|${event.timestamp}|${event.type}`;
  const encoded = new TextEncoder().encode(core);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getMyName(): Promise<string | null> {
  const setting = await db.settings.get('myName');
  return setting?.value ?? null;
}

export async function setMyName(name: string): Promise<void> {
  await db.settings.put({ key: 'myName', value: name });
}

export async function getFriends(): Promise<string[]> {
  const friends = await db.friends.toArray();
  return friends.map(f => f.name);
}

export async function addFriend(name: string): Promise<void> {
  await db.friends.put({ name });
}

export async function removeFriend(name: string): Promise<void> {
  await db.friends.delete(name);
}

export async function addEvent(event: LendingEvent): Promise<boolean> {
  const existing = await db.events.get(event.id);
  if (existing) return false;
  await db.events.add(event);
  if (event.lenderName) await db.friends.put({ name: event.lenderName });
  if (event.borrowerName) await db.friends.put({ name: event.borrowerName });
  return true;
}

export interface ActiveLoan {
  event: LendingEvent;
}

export async function getActiveLoans(): Promise<ActiveLoan[]> {
  const allEvents = await db.events.orderBy('timestamp').toArray();
  const returnedIds = new Set(
    allEvents
      .filter(e => e.type === 'return' && e.returnOfEventId)
      .map(e => e.returnOfEventId!)
  );
  return allEvents
    .filter(e => e.type === 'lend' && !returnedIds.has(e.id))
    .map(e => ({ event: e }));
}
