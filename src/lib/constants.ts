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

/** Trello label colors used for task labels & list headers. */
export const LABEL_COLORS: { id: string; bg: string; fg: string; label: string }[] = [
  { id: "green", bg: "#4bce97", fg: "#164b35", label: "Green" },
  { id: "yellow", bg: "#f5cd47", fg: "#533f04", label: "Yellow" },
  { id: "orange", bg: "#fea362", fg: "#5f3811", label: "Orange" },
  { id: "red", bg: "#f87168", fg: "#601e16", label: "Red" },
  { id: "purple", bg: "#9f8fef", fg: "#352c63", label: "Purple" },
  { id: "blue", bg: "#579dff", fg: "#09326c", label: "Blue" },
  { id: "sky", bg: "#6cc3e0", fg: "#164555", label: "Sky" },
  { id: "lime", bg: "#94c748", fg: "#37471f", label: "Lime" },
  { id: "pink", bg: "#e774bb", fg: "#50253f", label: "Pink" },
  { id: "black", bg: "#8590a2", fg: "#091e42", label: "Gray" },
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
