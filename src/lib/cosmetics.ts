/**
 * Avatar customization catalog. Items unlock at level milestones (no XP cost
 * — XP stays as reputation, not currency). Stored loadout: one avatar emoji,
 * one frame gradient, one title text.
 */

export type CosmeticKind = "avatar" | "frame" | "title";

export interface CosmeticItem {
  id: string;
  kind: CosmeticKind;
  label: string;
  /** Emoji for avatar items, gradient class string for frames, plain text for titles. */
  preview: string;
  /** Minimum level required to equip this item. 1 = available from start. */
  requireLevel: number;
}

export const COSMETICS: CosmeticItem[] = [
  // Avatars — emoji set, mix of expressive and themed.
  { id: "avatar-default", kind: "avatar", label: "По умолчанию", preview: "🙂", requireLevel: 1 },
  { id: "avatar-grin", kind: "avatar", label: "Улыбка", preview: "😄", requireLevel: 1 },
  { id: "avatar-cool", kind: "avatar", label: "Крутой", preview: "😎", requireLevel: 2 },
  { id: "avatar-nerd", kind: "avatar", label: "Отличник", preview: "🤓", requireLevel: 3 },
  { id: "avatar-cat", kind: "avatar", label: "Котик", preview: "🐱", requireLevel: 3 },
  { id: "avatar-dog", kind: "avatar", label: "Пёсик", preview: "🐶", requireLevel: 3 },
  { id: "avatar-fox", kind: "avatar", label: "Лисёнок", preview: "🦊", requireLevel: 5 },
  { id: "avatar-panda", kind: "avatar", label: "Панда", preview: "🐼", requireLevel: 5 },
  { id: "avatar-owl", kind: "avatar", label: "Сова", preview: "🦉", requireLevel: 7 },
  { id: "avatar-rocket", kind: "avatar", label: "Ракета", preview: "🚀", requireLevel: 8 },
  { id: "avatar-fire", kind: "avatar", label: "Огонь", preview: "🔥", requireLevel: 10 },
  { id: "avatar-star", kind: "avatar", label: "Звезда", preview: "⭐", requireLevel: 12 },
  { id: "avatar-trophy", kind: "avatar", label: "Кубок", preview: "🏆", requireLevel: 15 },
  { id: "avatar-crown", kind: "avatar", label: "Корона", preview: "👑", requireLevel: 20 },
  { id: "avatar-dragon", kind: "avatar", label: "Дракон", preview: "🐉", requireLevel: 25 },
  { id: "avatar-unicorn", kind: "avatar", label: "Единорог", preview: "🦄", requireLevel: 30 },

  // Frames — gradient ring around the avatar. Tailwind class fragment used in `bg-gradient-to-tr`.
  { id: "frame-classic", kind: "frame", label: "Классика", preview: "from-primary via-accent to-primary", requireLevel: 1 },
  { id: "frame-emerald", kind: "frame", label: "Изумруд", preview: "from-emerald-400 via-teal-400 to-emerald-500", requireLevel: 3 },
  { id: "frame-ocean", kind: "frame", label: "Океан", preview: "from-sky-400 via-blue-500 to-indigo-500", requireLevel: 6 },
  { id: "frame-sunset", kind: "frame", label: "Закат", preview: "from-rose-400 via-orange-400 to-amber-400", requireLevel: 9 },
  { id: "frame-violet", kind: "frame", label: "Аметист", preview: "from-fuchsia-500 via-violet-500 to-purple-500", requireLevel: 12 },
  { id: "frame-fire", kind: "frame", label: "Пламя", preview: "from-amber-400 via-orange-500 to-rose-500", requireLevel: 18 },
  { id: "frame-aurora", kind: "frame", label: "Полярное", preview: "from-emerald-300 via-cyan-400 to-fuchsia-500", requireLevel: 25 },
  { id: "frame-gold", kind: "frame", label: "Золото", preview: "from-yellow-400 via-amber-300 to-yellow-500", requireLevel: 35 },

  // Titles — appear under the user's name on the profile.
  { id: "title-none", kind: "title", label: "Без титула", preview: "", requireLevel: 1 },
  { id: "title-newbie", kind: "title", label: "Новичок", preview: "Новичок", requireLevel: 1 },
  { id: "title-eager", kind: "title", label: "Старатель", preview: "Старатель", requireLevel: 4 },
  { id: "title-bookworm", kind: "title", label: "Книголюб", preview: "Книголюб", requireLevel: 7 },
  { id: "title-explorer", kind: "title", label: "Путешественник", preview: "Путешественник", requireLevel: 10 },
  { id: "title-polyglot", kind: "title", label: "Полиглот", preview: "Полиглот", requireLevel: 14 },
  { id: "title-champion", kind: "title", label: "Чемпион", preview: "Чемпион", requireLevel: 18 },
  { id: "title-legend", kind: "title", label: "Легенда", preview: "Легенда", requireLevel: 25 },
  { id: "title-mentor", kind: "title", label: "Наставник", preview: "Наставник", requireLevel: 35 },
];

export function findCosmetic(id: string): CosmeticItem | null {
  return COSMETICS.find((c) => c.id === id) ?? null;
}

export function listByKind(kind: CosmeticKind): CosmeticItem[] {
  return COSMETICS.filter((c) => c.kind === kind);
}

export const DEFAULTS = {
  avatarEmoji: "avatar-default",
  frameId: "frame-classic",
  titleId: "title-none",
} as const;
