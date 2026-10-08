// The matchmaking "game": queue → match found → someone doesn't accept → queue.

export type Phase = "queue" | "ready" | "failed";
export type GameEvent = "pop" | "fail" | "requeue";

export interface QueueTiming {
  /** Shortest wait before a match pops, in seconds. */
  minQueue: number;
  /** Longest wait before a match pops, in seconds. */
  maxQueue: number;
}

export const READY_SECONDS = 20;
const FAILED_SECONDS = 7;
const OTHER_PLAYERS = 9;

const QUIPS = [
  "It was probably the Techies main.",
  "Their mom called them up for dinner.",
  "They alt-tabbed to watch a 40 minute video essay.",
  "They were in the bathroom. They are always in the bathroom.",
  "Their internet died. Or so they claim.",
  "They saw the queue pop and felt nothing.",
  "They fell asleep. Can you blame them?",
  "They queued by accident.",
  "Somewhere, a man in Peru closed his laptop.",
];

const YOU_QUIPS = [
  "You failed to accept. Fittingly.",
  "You hesitated. The basement noticed.",
  "Even you didn't want this.",
];

export const TIPS = [
  "Tip: The sun is still out there.",
  "Tip: You could stand up at any time. You won't.",
  "Tip: Your friends are playing without you.",
  "Tip: Energy drinks count as water.",
  "Tip: Queue times are shorter in the morning. It is never morning.",
  "Tip: That dripping sound is nothing to worry about.",
  "Tip: Estimated wait times are a lie we tell ourselves.",
  "Tip: Nobody has been upstairs in weeks.",
];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class QueueGame {
  phase: Phase = "queue";
  phaseStart: number;
  readonly startedAt: number;
  matchesFound = 0;
  playerAccepted = false;
  /** Seconds into the ready check at which each other player accepts. Infinity = never. */
  otherAccepts: number[] = [];
  quip = "";
  private popAfter: number;

  constructor(
    private timing: QueueTiming,
    now: number,
  ) {
    this.startedAt = now;
    this.phaseStart = now;
    this.popAfter = rand(timing.minQueue, timing.maxQueue);
  }

  elapsed(now: number): number {
    return now - this.phaseStart;
  }

  update(now: number): GameEvent | null {
    const t = this.elapsed(now);
    if (this.phase === "queue" && t >= this.popAfter) {
      this.phase = "ready";
      this.phaseStart = now;
      this.matchesFound++;
      this.playerAccepted = false;
      const culprit = Math.floor(Math.random() * OTHER_PLAYERS);
      this.otherAccepts = Array.from({ length: OTHER_PLAYERS }, (_, i) =>
        // Most accept quickly; one straggler cuts it close to keep hope alive.
        i === culprit ? Infinity : Math.random() < 0.15 ? rand(12, READY_SECONDS - 1.5) : rand(0.6, 9),
      );
      return "pop";
    }
    if (this.phase === "ready" && t >= READY_SECONDS) {
      this.phase = "failed";
      this.phaseStart = now;
      const pool = this.playerAccepted ? QUIPS : YOU_QUIPS;
      this.quip = pool[Math.floor(Math.random() * pool.length)];
      return "fail";
    }
    if (this.phase === "failed" && t >= FAILED_SECONDS) {
      this.phase = "queue";
      this.phaseStart = now;
      this.popAfter = rand(this.timing.minQueue, this.timing.maxQueue);
      return "requeue";
    }
    return null;
  }

  /** Returns true if this press counted as accepting the match. */
  accept(): boolean {
    if (this.phase !== "ready" || this.playerAccepted) return false;
    this.playerAccepted = true;
    return true;
  }
}

export function formatDuration(seconds: number, withHours = false): string {
  const s = Math.floor(seconds);
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return withHours || h > 0 ? `${pad(h)}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}
