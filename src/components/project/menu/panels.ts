export type PanelId = "root" | "about" | "background" | "tags" | "status";

export const PANEL_TITLES: Record<PanelId, string> = {
  root: "Menu",
  about: "About this board",
  background: "Change background",
  tags: "Tags",
  status: "Status",
};
