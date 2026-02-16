import pako from 'pako';
import type { LendingEvent } from './db';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeEvents(events: LendingEvent[]): string {
  const json = JSON.stringify(events);
  const compressed = pako.deflate(new TextEncoder().encode(json));
  return 'MTG1:' + toBase64Url(compressed);
}

export function decodeEvents(code: string): LendingEvent[] {
  const prefix = 'MTG1:';
  if (!code.startsWith(prefix)) {
    throw new Error('Invalid share code format');
  }
  const data = code.slice(prefix.length);
  const compressed = fromBase64Url(data);
  const json = new TextDecoder().decode(pako.inflate(compressed));
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid share code data');
  }
  return parsed as LendingEvent[];
}
