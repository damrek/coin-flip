// Toss domain. Core rule (ported in T2): the outcome is drawn BEFORE the
// animation starts, and the final spin angle is derived from it.

export type Side = 'heads' | 'tails';

/**
 * Landing angle for a given outcome.
 * One full turn is 360°. Heads is a multiple of 360; tails adds 180 more.
 * Five or six turns are drawn so two consecutive tosses never feel identical,
 * but the final angle is always exact.
 */
export function spinEndFor(isHeads: boolean): number {
  const turns = 5 + Math.floor(Math.random() * 2);
  return turns * 360 + (isHeads ? 0 : 180);
}

// TODO(T2): port flip/settle/restart plus the reduced-motion path from app.js.
export function flip(): void {
  // Stub for T2.
}

export function settle(_side: Side): void {
  // Stub for T2.
}
