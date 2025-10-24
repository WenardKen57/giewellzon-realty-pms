import { nanoid } from 'nanoid';
const listeners = new Set();

export function notify(message, type='info', timeout=3000) {
  const id = nanoid();
  const note = { id, message, type };
  listeners.forEach(fn => fn(note));
  if (timeout) {
    setTimeout(() => {
      listeners.forEach(fn => fn({ id, dismiss: true }));
    }, timeout);
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}