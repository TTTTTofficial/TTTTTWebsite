// Draws the in-game monitor (the matchmaking client) onto a canvas.
import { QueueGame, READY_SECONDS, TIPS, formatDuration } from "./queue.ts";

export const SCREEN_W = 1024;
export const SCREEN_H = 640;

const FONT = "Rajdhani, 'Arial Narrow', sans-serif";

function centered(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, color: string, x = SCREEN_W / 2) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawPips(ctx: CanvasRenderingContext2D, game: QueueGame, t: number, y: number, reveal: boolean) {
  const gap = 84;
  const startX = SCREEN_W / 2 - (gap * 9) / 2;
  const states = [
    game.playerAccepted ? "ok" : reveal ? "no" : "wait",
    ...game.otherAccepts.map((at) => (t >= at ? "ok" : reveal ? "no" : "wait")),
  ];
  states.forEach((state, i) => {
    const x = startX + i * gap;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fillStyle = state === "ok" ? "#3fae3f" : state === "no" ? "#7a1a14" : "#24282e";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = state === "ok" ? "#8ef08e" : state === "no" ? "#e0453a" : "#4b525c";
    ctx.stroke();
    if (state === "no") {
      ctx.strokeStyle = "#ff6b5e";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - 11, y - 11);
      ctx.lineTo(x + 11, y + 11);
      ctx.moveTo(x + 11, y - 11);
      ctx.lineTo(x - 11, y + 11);
      ctx.stroke();
    }
    if (i === 0) centered(ctx, "YOU", y + 46, `bold 22px ${FONT}`, "#9aa0a8", x);
  });
}

export function drawScreen(ctx: CanvasRenderingContext2D, game: QueueGame, now: number) {
  const t = game.elapsed(now);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  if (game.phase === "failed") {
    bg.addColorStop(0, "#2a0d0b");
    bg.addColorStop(1, "#0d0505");
  } else if (game.phase === "ready") {
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    bg.addColorStop(0, `rgb(${18 + pulse * 10}, ${46 + pulse * 30}, ${22 + pulse * 10})`);
    bg.addColorStop(1, "#06100a");
  } else {
    bg.addColorStop(0, "#1b1f25");
    bg.addColorStop(1, "#0a0c0f");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Title bar
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, SCREEN_W, 52);
  ctx.font = `bold 26px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#c23c2a";
  ctx.fillText("DOTA 2", 22, 27);
  ctx.textAlign = "right";
  ctx.fillStyle = "#7d848e";
  ctx.fillText("TTTTT LIFE SIMULATOR", SCREEN_W - 22, 27);

  if (game.phase === "queue") {
    // Spinner
    const cx = SCREEN_W / 2;
    const cy = 250;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#2c323a";
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#c9ccd1";
    ctx.beginPath();
    ctx.arc(cx, cy, 120, now * 2.2, now * 2.2 + Math.PI * 0.45);
    ctx.stroke();

    centered(ctx, "FINDING MATCH", 205, `bold 40px ${FONT}`, "#d5d8dc");
    centered(ctx, formatDuration(t), 268, `bold 84px ${FONT}`, "#ffffff");
    centered(ctx, "Estimated wait: 2:31", 418, `28px ${FONT}`, "#8b929b");
    centered(ctx, "Ability Draft  ·  US East", 456, `24px ${FONT}`, "#5f666f");

    const tip = TIPS[Math.floor((now - game.startedAt) / 12) % TIPS.length];
    centered(ctx, tip, 520, `italic 26px ${FONT}`, "#6f7781");

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, SCREEN_H - 64, SCREEN_W, 64);
    centered(
      ctx,
      `Matches found: ${game.matchesFound}    ·    Matches played: 0    ·    Time in basement: ${formatDuration(now - game.startedAt, true)}`,
      SCREEN_H - 32,
      `24px ${FONT}`,
      "#9aa0a8",
    );
  } else if (game.phase === "ready") {
    centered(ctx, "YOUR GAME IS READY", 125, `bold 64px ${FONT}`, "#ffffff");

    const bx = SCREEN_W / 2 - 230;
    ctx.fillStyle = game.playerAccepted ? "#245a24" : "#33a133";
    ctx.fillRect(bx, 190, 460, 110);
    ctx.strokeStyle = game.playerAccepted ? "#3d7a3d" : "#9df59d";
    ctx.lineWidth = 4;
    ctx.strokeRect(bx, 190, 460, 110);
    centered(ctx, game.playerAccepted ? "ACCEPTED" : "ACCEPT", 247, `bold 62px ${FONT}`, "#ffffff");
    centered(
      ctx,
      game.playerAccepted ? "Waiting for other players..." : "DECLINE",
      340,
      `26px ${FONT}`,
      "#7d848e",
    );

    // Countdown bar
    const remaining = Math.max(0, READY_SECONDS - t);
    ctx.fillStyle = "#14181d";
    ctx.fillRect(112, 388, SCREEN_W - 224, 14);
    ctx.fillStyle = remaining < 5 ? "#d9473a" : "#d8d8d8";
    ctx.fillRect(112, 388, (SCREEN_W - 224) * (remaining / READY_SECONDS), 14);

    drawPips(ctx, game, t, 480, false);
  } else {
    centered(ctx, "MATCH FAILED", 140, `bold 72px ${FONT}`, "#e0453a");
    centered(
      ctx,
      game.playerAccepted ? "A player failed to accept the match." : "Not everyone accepted the match.",
      225,
      `34px ${FONT}`,
      "#e4d6d4",
    );
    centered(ctx, game.quip, 280, `italic 30px ${FONT}`, "#a88f8c");
    drawPips(ctx, game, READY_SECONDS, 390, true);
    const dots = ".".repeat(1 + (Math.floor(t * 2) % 3));
    centered(ctx, `Returning you to the queue${dots}`, 540, `28px ${FONT}`, "#8b929b");
  }
}
