export type Column = { id: string; title: string; color: string };

export type Project = {
  _id: string;
  name: string;
  description: string;
  color: string;
  status: "active" | "paused" | "completed" | "archived";
  tags: string[];
  starred: boolean;
  links: { label: string; url: string }[];
  columns: Column[];
  git?: { repo: string; hasToken: boolean };
  createdAt: string;
  updatedAt: string;
  stats?: { tasks: number; done: number; spent: number };
};

export type ProjectDetail = Project & {
  stats: {
    tasks: number;
    doneTasks: number;
    env: number;
    passwords: number;
    files: number;
    notes: number;
    spent: number;
    expenses: number;
  };
  recentTasks: Task[];
  recentNotes: Note[];
};

export type ChecklistItem = { id: string; text: string; done: boolean };

export type Task = {
  _id: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string;
  labels: string[];
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  order: number;
  checklist: ChecklistItem[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EnvVar = {
  _id: string;
  projectId: string;
  environment: string;
  key: string;
  value: string;
  hasValue: boolean;
  note: string;
  secret: boolean;
  updatedAt: string;
};

export type PasswordItem = {
  _id: string;
  projectId: string;
  title: string;
  category: string;
  username: string;
  password?: string;
  hasPassword: boolean;
  url: string;
  notes: string;
  updatedAt: string;
};

export type FileItem = {
  _id: string;
  projectId: string;
  name: string;
  key: string;
  size: number;
  contentType: string;
  folder: string;
  status: "pending" | "uploaded";
  createdAt: string;
};

export type Note = {
  _id: string;
  projectId: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  _id: string;
  projectId: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  recurring: "none" | "monthly" | "yearly";
  note: string;
};

export type DashboardData = {
  counts: { projects: number; tasks: number; openTasks: number; notes: number; passwords: number; env: number; files: number; spent: number };
  dueSoon: Task[];
  overdue: Task[];
  recent: Task[];
};
