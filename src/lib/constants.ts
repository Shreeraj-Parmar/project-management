/** Trello-like board background presets (gradients). */
export const BOARD_COLORS: { id: string; label: string; css: string }[] = [
  { id: "ocean", label: "Ocean", css: "linear-gradient(135deg,#0079bf 0%,#5067c5 100%)" },
  { id: "forest", label: "Forest", css: "linear-gradient(135deg,#1f845a 0%,#4bce97 100%)" },
  { id: "sunset", label: "Sunset", css: "linear-gradient(135deg,#e34935 0%,#f38a3f 100%)" },
  { id: "grape", label: "Grape", css: "linear-gradient(135deg,#6e5dc6 0%,#c97cf4 100%)" },
  { id: "flamingo", label: "Flamingo", css: "linear-gradient(135deg,#ae4787 0%,#f87168 100%)" },
  { id: "sky", label: "Sky", css: "linear-gradient(135deg,#227d9b 0%,#6cc3e0 100%)" },
  { id: "lime", label: "Lime", css: "linear-gradient(135deg,#5b7f24 0%,#94c748 100%)" },
  { id: "midnight", label: "Midnight", css: "linear-gradient(135deg,#172b4d 0%,#44546f 100%)" },
  { id: "mango", label: "Mango", css: "linear-gradient(135deg,#b65c02 0%,#f5cd47 100%)" },
  { id: "coral", label: "Coral", css: "linear-gradient(135deg,#c9372c 0%,#fd9891 100%)" },
];

/** Built-in demo photos/illustrations shipped in /public/backgrounds. Stored on a board as "img:<id>". */
export const BOARD_IMAGES: { id: string; label: string; src: string; light: boolean; fallback: string }[] = [
  { id: "clouds", label: "Clouds", src: "/backgrounds/clouds.svg", light: true, fallback: "#cfe6ff" },
  { id: "mint-waves", label: "Mint waves", src: "/backgrounds/mint-waves.svg", light: true, fallback: "#c8f1de" },
  { id: "peach-dunes", label: "Peach dunes", src: "/backgrounds/peach-dunes.svg", light: true, fallback: "#ffd9c2" },
  { id: "lavender-hills", label: "Lavender hills", src: "/backgrounds/lavender-hills.svg", light: true, fallback: "#ddd6ff" },
  { id: "paper", label: "Paper", src: "/backgrounds/paper.svg", light: true, fallback: "#f7f8f9" },
  { id: "sunrise", label: "Sunrise", src: "/backgrounds/sunrise.svg", light: true, fallback: "#ffe8d6" },
  { id: "night-mountains", label: "Night mountains", src: "/backgrounds/night-mountains.svg", light: false, fallback: "#1d2b4f" },
  { id: "aurora", label: "Aurora", src: "/backgrounds/aurora.svg", light: false, fallback: "#0c2a3a" },
  { id: "deep-sea", label: "Deep sea", src: "/backgrounds/deep-sea.svg", light: false, fallback: "#0a3d62" },
  { id: "dusk-city", label: "Dusk city", src: "/backgrounds/dusk-city.svg", light: false, fallback: "#3b2667" },
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const MAX_CUSTOM_IMAGE = 1_500_000; // ~1.1 MB image as a data URL

/**
 * A board's `color` field holds one of:
 *  - a preset gradient id ("ocean")
 *  - a solid color "#rrggbb" (color picker)
 *  - a built-in image "img:<id>"
 *  - a custom image "url:<https url | data:image/... URL>"
 */
export function isValidBoardBackground(v: unknown): v is string {
  if (typeof v !== "string") return false;
  if (BOARD_COLORS.some((c) => c.id === v)) return true;
  if (HEX_RE.test(v)) return true;
  if (v.startsWith("img:")) return BOARD_IMAGES.some((i) => i.id === v.slice(4));
  if (v.startsWith("url:")) {
    const u = v.slice(4);
    if (u.length > MAX_CUSTOM_IMAGE) return false;
    return /^https?:\/\/[^\s"'()]+$/i.test(u) || /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u);
  }
  return false;
}

function cssUrl(u: string): string {
  return `url("${u.replace(/["\\\n\r]/g, "")}")`;
}

/** CSS `background` shorthand for any board background value. */
export function boardBackground(id: string): string {
  const preset = BOARD_COLORS.find((c) => c.id === id);
  if (preset) return preset.css;
  if (typeof id === "string" && HEX_RE.test(id)) return id;
  if (typeof id === "string" && id.startsWith("img:")) {
    const img = BOARD_IMAGES.find((i) => i.id === id.slice(4));
    if (img) return `${img.fallback} ${cssUrl(img.src)} center / cover no-repeat`;
  }
  if (typeof id === "string" && id.startsWith("url:") && isValidBoardBackground(id)) {
    return `#44546f ${cssUrl(id.slice(4))} center / cover no-repeat`;
  }
  return BOARD_COLORS[0].css;
}

/** Human label for the current background (menu summary). */
export function boardBackgroundLabel(id: string): string {
  const preset = BOARD_COLORS.find((c) => c.id === id);
  if (preset) return preset.label;
  if (HEX_RE.test(id)) return `Custom color ${id.toUpperCase()}`;
  if (id.startsWith("img:")) return BOARD_IMAGES.find((i) => i.id === id.slice(4))?.label ?? "Image";
  if (id.startsWith("url:")) return "Custom image";
  return BOARD_COLORS[0].label;
}

/**
 * Trello label colours (default tier). `bg` / `fg` is the card-face tier; `subtle` (light) and `bold` (saturated)
 * are the optional picker tiers. Every fg has >= 4.5:1 contrast on its bg.
 */
export const LABEL_COLORS: {
  id: string;
  bg: string;
  fg: string;
  label: string;
  subtle: { bg: string; fg: string };
  bold: { bg: string; fg: string };
}[] = [
  { id: "green", bg: "#4bce97", fg: "#164b35", label: "Green", subtle: { bg: "#baf3db", fg: "#164b35" }, bold: { bg: "#1f845a", fg: "#ffffff" } },
  { id: "yellow", bg: "#f5cd47", fg: "#533f04", label: "Yellow", subtle: { bg: "#f8e6a0", fg: "#533f04" }, bold: { bg: "#946f00", fg: "#ffffff" } },
  { id: "orange", bg: "#fea362", fg: "#5f3811", label: "Orange", subtle: { bg: "#ffe2bd", fg: "#5f3811" }, bold: { bg: "#c25100", fg: "#ffffff" } },
  { id: "red", bg: "#f87168", fg: "#5d1f1a", label: "Red", subtle: { bg: "#ffd5d2", fg: "#5d1f1a" }, bold: { bg: "#c9372c", fg: "#ffffff" } },
  { id: "purple", bg: "#9f8fef", fg: "#352c63", label: "Purple", subtle: { bg: "#dfd8fd", fg: "#352c63" }, bold: { bg: "#6e5dc6", fg: "#ffffff" } },
  { id: "blue", bg: "#579dff", fg: "#09326c", label: "Blue", subtle: { bg: "#cce0ff", fg: "#09326c" }, bold: { bg: "#0c66e4", fg: "#ffffff" } },
  { id: "sky", bg: "#6cc3e0", fg: "#164555", label: "Sky", subtle: { bg: "#c6edfb", fg: "#164555" }, bold: { bg: "#227d9b", fg: "#ffffff" } },
  { id: "lime", bg: "#94c748", fg: "#37471f", label: "Lime", subtle: { bg: "#d3f1a7", fg: "#37471f" }, bold: { bg: "#5b7f24", fg: "#ffffff" } },
  { id: "pink", bg: "#e774bb", fg: "#50253f", label: "Pink", subtle: { bg: "#fdd0ec", fg: "#50253f" }, bold: { bg: "#ae4787", fg: "#ffffff" } },
  { id: "black", bg: "#8590a2", fg: "#091e42", label: "Gray", subtle: { bg: "#dcdfe4", fg: "#091e42" }, bold: { bg: "#44546f", fg: "#ffffff" } },
];

export function labelColor(id: string) {
  return LABEL_COLORS.find((c) => c.id === id) ?? LABEL_COLORS[5];
}

/** Each module (section) in a project has its own accent color. */
export const MODULES = [
  { id: "overview", label: "Overview", color: "#0c66e4", soft: "#e9f2ff", path: "" },
  { id: "tasks", label: "Tasks", color: "#1f845a", soft: "#dcfff1", path: "/tasks" },
  { id: "env", label: "Environment", color: "#5e4db2", soft: "#f3f0ff", path: "/env" },
  { id: "passwords", label: "Passwords", color: "#c9372c", soft: "#ffeceb", path: "/passwords" },
  { id: "files", label: "Files", color: "#c25100", soft: "#fff3eb", path: "/files" },
  { id: "notes", label: "Notes", color: "#946f00", soft: "#fff7d6", path: "/notes" },
  { id: "spending", label: "Spending", color: "#ae4787", soft: "#ffecf8", path: "/spending" },
  { id: "git", label: "Git Repo", color: "#172b4d", soft: "#f1f2f4", path: "/git" },
] as const;

export type ModuleId = (typeof MODULES)[number]["id"];

export const ENVIRONMENTS = ["development", "staging", "production", "test"] as const;

export const SPEND_CATEGORIES = [
  "Hosting",
  "Domain",
  "Database",
  "API / SaaS",
  "Storage",
  "Tools",
  "Design",
  "Marketing",
  "Hardware",
  "Other",
] as const;

export const PASSWORD_CATEGORIES = ["Server", "Database", "API Key", "Service", "Email", "Social", "Other"] as const;

export const NOTE_COLORS = ["#fff7d6", "#dcfff1", "#e9f2ff", "#f3f0ff", "#ffeceb", "#fff3eb", "#ffecf8", "#ffffff"];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PRIORITY_STYLE: Record<TaskPriority, { bg: string; fg: string }> = {
  low: { bg: "#dcfff1", fg: "#164b35" },
  medium: { bg: "#e9f2ff", fg: "#09326c" },
  high: { bg: "#fff3eb", fg: "#5f3811" },
  urgent: { bg: "#ffeceb", fg: "#601e16" },
};

/**
 * Board templates (Trello-style "start with a template").
 * A template only decides which lists (columns) a new board starts with.
 */
export const BOARD_TEMPLATES: {
  id: string;
  label: string;
  description: string;
  columns: { id: string; title: string; color: string }[];
}[] = [
  {
    id: "kanban",
    label: "Kanban",
    description: "To Do → In Progress → Review → Done",
    columns: [
      { id: "todo", title: "To Do", color: "blue" },
      { id: "doing", title: "In Progress", color: "yellow" },
      { id: "review", title: "Review", color: "purple" },
      { id: "done", title: "Done", color: "green" },
    ],
  },
  {
    id: "simple",
    label: "Simple",
    description: "To Do → Doing → Done",
    columns: [
      { id: "todo", title: "To Do", color: "blue" },
      { id: "doing", title: "Doing", color: "yellow" },
      { id: "done", title: "Done", color: "green" },
    ],
  },
  {
    id: "software",
    label: "Software dev",
    description: "Backlog → Design → Dev → Testing → Deployed",
    columns: [
      { id: "backlog", title: "Backlog", color: "black" },
      { id: "design", title: "Design", color: "purple" },
      { id: "doing", title: "Development", color: "blue" },
      { id: "testing", title: "Testing", color: "orange" },
      { id: "done", title: "Deployed", color: "green" },
    ],
  },
  {
    id: "bugs",
    label: "Bug tracking",
    description: "Reported → Confirmed → Fixing → Verified",
    columns: [
      { id: "reported", title: "Reported", color: "red" },
      { id: "confirmed", title: "Confirmed", color: "orange" },
      { id: "doing", title: "Fixing", color: "blue" },
      { id: "done", title: "Verified", color: "green" },
    ],
  },
];
