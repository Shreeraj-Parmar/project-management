import { boardBackground } from "@/lib/constants";

/**
 * Live preview of the board that is about to be created (Trello's 200x120 mini board): the chosen gradient,
 * a mock header with the typed title and one mock list per list of the chosen template.
 */
export function BoardPreview({ color, title, columns }: { color: string; title: string; columns: { id: string; title: string }[] }) {
  const lists = columns.slice(0, 5);
  return (
    <div className="flex justify-center rounded-card bg-surface py-3" aria-hidden data-testid="board-preview">
      <div className="h-[120px] w-[200px] overflow-hidden rounded-control shadow-card transition-[background] duration-200" style={{ background: boardBackground(color) }}>
        <div className="flex h-5 items-center bg-black/30 px-2">
          <span className="truncate text-[8px] font-bold leading-none text-white">{title.trim() || "Board title"}</span>
        </div>
        <div className="flex items-start gap-1 p-1.5">
          {lists.map((c, i) => (
            <div key={c.id} className="min-w-0 flex-1 rounded-[3px] bg-white/45 p-[3px]">
              <div className="mb-[3px] h-[3px] w-2/3 rounded-full bg-white/95" />
              {Array.from({ length: [3, 2, 1, 2, 1][i % 5] }).map((_, j) => (
                <div key={j} className="mb-[3px] h-2.5 rounded-[2px] bg-white/95 last:mb-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
