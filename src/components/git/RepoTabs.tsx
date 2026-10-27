"use client";

import { useEffect, useState } from "react";
import { CircleDot, GitBranch, GitCommit, GitPullRequest, LayoutDashboard, Play, Tag } from "lucide-react";
import { Tabs } from "@/components/ui";
import type { GitSnapshot } from "@/lib/github";
import { Actions, Branches, Commits, Releases } from "./Activity";
import { Issues, Pulls } from "./Items";
import { RepoOverview } from "./RepoOverview";

const TAB_KEY = "devboard.git.tab";
const TABS = ["overview", "commits", "branches", "issues", "prs", "releases", "actions"] as const;
type Tab = (typeof TABS)[number];

export function RepoTabs({ data }: { data: GitSnapshot }) {
  const [tab, setTab] = useState<Tab>("overview");
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(TAB_KEY) as Tab | null;
      if (v && TABS.includes(v)) setTab(v);
    } catch {
      /* ignore */
    }
  }, []);
  const change = (id: string) => {
    setTab(id as Tab);
    try {
      window.localStorage.setItem(TAB_KEY, id);
    } catch {
      /* ignore */
    }
  };
  const openIssues = data.issues.filter((i) => i.state === "open").length;
  const openPrs = data.pulls.filter((p) => p.state === "open").length;
  const releases = data.releases.length || data.tags.length;
  return (
    <div>
      <div className="mb-4 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={change}
          tabs={[
            { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
            { id: "commits", label: "Commits", icon: <GitCommit size={16} />, count: data.commits.length },
            { id: "branches", label: "Branches", icon: <GitBranch size={16} />, count: data.branches.length },
            { id: "issues", label: "Issues", icon: <CircleDot size={16} />, count: openIssues },
            { id: "prs", label: "Pull requests", icon: <GitPullRequest size={16} />, count: openPrs },
            { id: "releases", label: "Releases", icon: <Tag size={16} />, count: releases },
            { id: "actions", label: "Actions", icon: <Play size={16} />, count: data.workflowRuns.length },
          ]}
        />
      </div>
      <div key={tab} className="fade-in">
        {tab === "overview" ? <RepoOverview data={data} /> : null}
        {tab === "commits" ? <Commits data={data} /> : null}
        {tab === "branches" ? <Branches data={data} /> : null}
        {tab === "issues" ? <Issues data={data} /> : null}
        {tab === "prs" ? <Pulls data={data} /> : null}
        {tab === "releases" ? <Releases data={data} /> : null}
        {tab === "actions" ? <Actions data={data} /> : null}
      </div>
    </div>
  );
}
