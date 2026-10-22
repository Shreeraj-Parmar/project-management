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

export function boardBackground(id: string): string {
  return BOARD_COLORS.find((c) => c.id === id)?.css ?? BOARD_COLORS[0].css;
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
