"use client";

import Link from "next/link";
import { CalendarDays, Clock, GitBranch } from "lucide-react";
import { formatDate, relativeTime } from "@/lib/client";
import { useProject } from "../ProjectContext";
import { useBoardActions } from "../useBoardActions";
import { DescriptionEditor } from "./DescriptionEditor";
import { QuickLinks } from "./QuickLinks";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-1.5 text-h-xxs font-semibold text-ink-soft">{title}</h3>
      {children}
    </section>
  );
}

/** About this board: editable description, dates, repository and quick links. */
export function AboutPanel() {
  const { project } = useProject();
  const { setDescription } = useBoardActions();
  const repo = project.git?.repo;

  return (
    <div>
      <Section title="Description">
        <DescriptionEditor value={project.description} onSave={(d) => setDescription(d)} />
      </Section>

      <Section title="Details">
        <ul className="space-y-2 text-body text-ink">
          <li className="flex items-center gap-2">
            <CalendarDays size={16} className="shrink-0 text-ink-soft" aria-hidden />
            <span>Created {formatDate(project.createdAt)}</span>
          </li>
          <li className="flex items-center gap-2">
            <Clock size={16} className="shrink-0 text-ink-soft" aria-hidden />
            <span>Updated {relativeTime(project.updatedAt)}</span>
          </li>
          <li className="flex items-center gap-2">
            <GitBranch size={16} className="shrink-0 text-ink-soft" aria-hidden />
            {repo ? (
              <Link href={`/boards/${project._id}/git`} className="link min-w-0 truncate" title={repo}>
                {repo}
              </Link>
            ) : (
              <span className="text-ink-soft">
                No repository connected.{" "}
                <Link href={`/boards/${project._id}/git`} className="link">
                  Connect one
                </Link>
              </span>
            )}
          </li>
        </ul>
      </Section>

      <Section title="Quick links">
        <QuickLinks />
      </Section>
    </div>
  );
}
