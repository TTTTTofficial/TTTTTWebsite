// Edit this file to update the site's content.

export interface Member {
  name: string;
  role: string;
  /** Path to an image in /public, e.g. "avatars/playerone.png". Leave empty for an initial. */
  avatar?: string;
}

export interface Game {
  name: string;
  description: string;
}

export const clan = {
  name: "TTTTT",
  tagline: "Your clan tagline goes here.",
  about:
    "Write a short intro about your clan: when it was founded, what you play, and what makes you different.",
  discordUrl: "https://discord.gg/your-invite-code",
};

export const members: Member[] = [
  { name: "PlayerOne", role: "Leader" },
  { name: "PlayerTwo", role: "Officer" },
  { name: "PlayerThree", role: "Member" },
  { name: "PlayerFour", role: "Member" },
];

export const games: Game[] = [
  { name: "Game One", description: "What you play and how competitive you are." },
  { name: "Game Two", description: "Another game the clan plays together." },
];
