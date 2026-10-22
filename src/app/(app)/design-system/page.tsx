"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  LayoutGrid,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Star,
  Tag,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Checkbox,
  ConfirmDialog,
  Divider,
  EmptyState,
  ErrorBox,
  Field,
  IconButton,
  InlineEdit,
  Input,
  Kbd,
  LabelChip,
  Logo,
  LogoMark,
  Lozenge,
  Menu,
  MenuDivider,
  MenuItem,
  Modal,
  PageHeader,
  Popover,
  PopoverFooter,
  PopoverItem,
  PopoverSection,
  ProgressBar,
  Radio,
  SearchInput,
  SectionMessage,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Spinner,
  StatTile,
  Tabs,
  TagInput,
  Textarea,
  Toggle,
  Tooltip,
  useToast,
} from "@/components/ui";
import { BOARD_COLORS, LABEL_COLORS, boardBackground } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line py-8 first:border-t-0">
      <h2 className="text-h-m font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 max-w-2xl text-body text-ink-soft">{description}</p> : null}
      <div className="mt-5 space-y-6">{children}</div>
    </section>
  );
}
function Row({ label, children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div>
      {label ? <div className="mb-2 text-h-xxs font-semibold text-ink-soft">{label}</div> : null}
      <div className={className ?? "flex flex-wrap items-center gap-3"}>{children}</div>
    </div>
  );
}

const SCALES = ["blue", "red", "orange", "yellow", "green", "purple", "magenta", "teal", "lime", "neutral"] as const;
const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const SEMANTIC: [string, string, string][] = [
  ["ink / text", "#172b4d", "bg-ink"],
  ["ink-soft / text-subtle", "#44546f", "bg-ink-soft"],
  ["ink-muted / text-subtlest", "#626f86", "bg-ink-muted"],
  ["border-input", "#8590a2", "bg-border-input"],
  ["line / border", "#dcdfe4", "bg-line"],
  ["surface (sunken)", "#f7f8f9", "bg-surface"],
  ["list", "#f1f2f4", "bg-list"],
  ["canvas", "#ffffff", "bg-canvas"],
  ["brand / link", "#0c66e4", "bg-brand"],
  ["brand-dark", "#0055cc", "bg-brand-dark"],
  ["brand-soft", "#e9f2ff", "bg-brand-soft"],
  ["focus", "#388bff", "bg-focus"],
  ["success", "#1f845a", "bg-success"],
  ["danger", "#c9372c", "bg-danger"],
  ["warning (text)", "#974f0c", "bg-warning"],
  ["warning-bold", "#f5cd47", "bg-warning-bold"],
  ["discovery", "#6e5dc6", "bg-discovery"],
];

const NAV = [
  ["colors", "Colors"],
  ["type", "Type"],
  ["buttons", "Buttons"],
  ["forms", "Forms"],
  ["feedback", "Feedback"],
  ["overlays", "Overlays"],
  ["navigation", "Navigation"],
  ["data", "Data display"],
  ["recipes", "Recipes"],
  ["glass", "Glass over board"],
];

/* ------------------------------------------------------------------ */
/* page                                                               */
/* ------------------------------------------------------------------ */
export default function DesignSystemPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("board");
  const [pill, setPill] = useState("a");
  const [seg, setSeg] = useState("list");
  const [modal, setModal] = useState<null | "small" | "medium" | "large">(null);
  const [confirm, setConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState(false);
  const [popOpen, setPopOpen] = useState(false);
  const [popView, setPopView] = useState<"root" | "labels">("root");
  const popAnchor = useRef<HTMLButtonElement>(null);
  const [title, setTitle] = useState("Project management tool");
  const [note, setNote] = useState("Click to edit this multi-line description. Cmd/Ctrl+Enter saves.");
  const [tags, setTags] = useState(["next.js", "mongo"]);
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(true);
  const [radio, setRadio] = useState("b");
  const [name, setName] = useState("");
  const [shown, setShown] = useState(false);
  const [q, setQ] = useState("");
  const [labelSel, setLabelSel] = useState<string[]>(["green", "blue"]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-[200] flex h-12 items-center gap-3 border-b border-line bg-canvas px-4">
        <Logo size="md" />
        <span className="hidden text-body text-ink-muted sm:inline">Design system</span>
        <nav aria-label="Sections" className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-control px-2 py-1 text-body text-ink-soft hover:bg-fill hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-page px-4 pb-24 pt-8 sm:px-6">
        <PageHeader
          title="DevBoard design system"
          description="Trello / Atlassian Design System foundation. Every component and state, rendered live."
          icon={<LayoutGrid size={20} />}
          actions={
            <>
              <Button variant="secondary" icon={<Copy size={16} />} onClick={() => toast("Link copied.", "success")}>
                Copy link
              </Button>
              <Button icon={<Plus size={16} />}>Create board</Button>
            </>
          }
          meta={
            <>
              <Lozenge appearance="success">v1</Lozenge>
              <Lozenge appearance="inprogress">Tailwind v4</Lozenge>
              <span className="text-body-sm text-ink-muted">docs/design-system.md</span>
            </>
          }
        />

        {/* ---------------- Colors ---------------- */}
        <Section id="colors" title="Colors" description="Semantic tokens first. Use ink for text, brand for actions, never pure black. Old names keep working.">
          <Row label="Semantic tokens" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SEMANTIC.map(([label, hex, cls]) => (
              <div key={label} className="overflow-hidden rounded-card border border-line">
                <div className={`h-12 ${cls}`} />
                <div className="p-2">
                  <div className="truncate text-body-sm font-semibold text-ink">{label}</div>
                  <div className="mono text-micro text-ink-muted">{hex}</div>
                </div>
              </div>
            ))}
          </Row>
          <Row label="Scales (100 to 1000)" className="space-y-1">
            {SCALES.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-body-sm text-ink-soft">{s}</span>
                <div className="grid flex-1 grid-cols-10 overflow-hidden rounded-control">
                  {STEPS.map((n) => (
                    <div key={n} className="h-7" style={{ background: `var(--color-${s}-${n})` }} title={`${s}-${n}`} />
                  ))}
                </div>
              </div>
            ))}
          </Row>
          <Row label="Board backgrounds (BOARD_COLORS)" className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {BOARD_COLORS.map((c) => (
              <div key={c.id} className="h-10 rounded-control" style={{ background: c.css }} title={c.label} />
            ))}
          </Row>
          <Row label="Elevation and radius" className="flex flex-wrap items-end gap-6">
            <div className="flex h-20 w-32 items-center justify-center rounded-card bg-canvas text-body-sm shadow-card">shadow-card</div>
            <div className="flex h-20 w-32 items-center justify-center rounded-card bg-canvas text-body-sm shadow-overlay">shadow-overlay</div>
            <div className="flex h-20 w-32 items-center justify-center rounded-control bg-fill text-body-sm">radius 3</div>
            <div className="flex h-20 w-32 items-center justify-center rounded-card bg-fill text-body-sm">radius 8</div>
            <div className="flex h-20 w-32 items-center justify-center rounded-list bg-list text-body-sm">radius 12</div>
          </Row>
        </Section>

        {/* ---------------- Type ---------------- */}
        <Section id="type" title="Typography" description="System UI stack. 14/20 is the default for all UI. Headings are 600; weights 400, 500 (buttons), 600, 700 only.">
          <div className="space-y-2">
            <div className="text-h-xxl font-bold">Heading xxl 32/36 bold</div>
            <div className="text-h-xl font-bold">Heading xl 28/32</div>
            <div className="text-h-l font-semibold">Heading l 24/28 (page title)</div>
            <div className="text-h-m font-semibold">Heading m 20/24 (modal, card title)</div>
            <div className="text-h-s font-semibold">Heading s 16/20 (section)</div>
            <div className="text-h-xs font-semibold">Heading xs 14/20 (list title, popover title)</div>
            <div className="text-h-xxs font-semibold text-ink-soft">Heading xxs 12/16 (field label, caption)</div>
            <div className="text-body">Body 14/20. The quick brown fox jumps over the lazy dog. Text colour ink.</div>
            <div className="text-body text-ink-soft">Body subtle (ink-soft) for secondary information.</div>
            <div className="text-body-sm text-ink-muted">Body small 12/16 muted (ink-muted) for meta, helper and timestamps.</div>
            <div className="text-body">
              Inline <a href="#type" className="link">link</a>, <code className="mono rounded-control bg-fill px-1">inline code</code> and <Kbd>Esc</Kbd> key.
            </div>
          </div>
        </Section>

        {/* ---------------- Buttons ---------------- */}
        <Section id="buttons" title="Buttons" description="Primary text is white, links take text-ink where utilities win again (layer fix). 32px default, 24px sm, 40px lg.">
          <Row label="Variants (md)">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="link">Link button</Button>
            <Button variant="ghost">Ghost (alias)</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small 24</Button>
            <Button size="md">Medium 32</Button>
            <Button size="lg">Large 40</Button>
            <Button size="sm" variant="secondary">Small</Button>
            <Button size="lg" variant="secondary">Large</Button>
          </Row>
          <Row label="With icons, loading, disabled, colour override">
            <Button icon={<Plus size={16} />}>Add a card</Button>
            <Button variant="secondary" icon={<Filter size={16} />} iconRight={<ChevronDown size={16} />}>
              Filters
            </Button>
            <Button loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}>
              {loading ? "Saving" : "Click to load"}
            </Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <Button variant="subtle" disabled>Disabled</Button>
            <Button color="#946f00">Notes accent</Button>
            <Button color="#5e4db2">Env accent</Button>
          </Row>
          <Row label="Icon buttons (tooltip = accessible name)">
            <IconButton title="More actions" size="sm"><MoreHorizontal size={16} /></IconButton>
            <IconButton title="More actions"><MoreHorizontal size={16} /></IconButton>
            <IconButton title="More actions" size="lg"><MoreHorizontal size={20} /></IconButton>
            <IconButton title="Star board" active><Star size={16} fill="currentColor" /></IconButton>
            <IconButton title="Edit" variant="secondary"><Pencil size={16} /></IconButton>
            <IconButton title="Delete" className="hover:!text-danger"><Trash2 size={16} /></IconButton>
            <IconButton title="Disabled" disabled><Archive size={16} /></IconButton>
          </Row>
          <Row label="Full width and sidebar-style (card back)" className="max-w-xs space-y-2">
            <Button fullWidth size="lg">Continue</Button>
            <Button variant="secondary" fullWidth alignStart icon={<Users size={16} />}>Members</Button>
            <Button variant="secondary" fullWidth alignStart icon={<Tag size={16} />}>Labels</Button>
            <Button variant="secondary" fullWidth alignStart icon={<Calendar size={16} />}>Dates</Button>
          </Row>
          <div className="rounded-list p-4" style={{ background: boardBackground("ocean") }}>
            <div className="mb-2 text-h-xxs font-semibold text-white">On a board background</div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="transparent">Transparent</Button>
              <Button variant="glass" icon={<Plus size={16} />}>Create</Button>
              <Button variant="transparent" icon={<Filter size={16} />}>Filters</Button>
              <IconButton title="Notifications" variant="transparent"><Bell size={16} /></IconButton>
              <Button variant="transparent" disabled>Disabled</Button>
            </div>
          </div>
        </Section>

        {/* ---------------- Forms ---------------- */}
        <Section id="forms" title="Forms" description="1px #8590A2 border, 2px blue focus ring, red when invalid. Field wires label, helper and error text with ids.">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="Board title" required helper="Boards are projects. You can rename it later.">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Portfolio site" />
              </Field>
              <Field label="Board title" required error="Board title is required">
                <Input defaultValue="" placeholder="Required" />
              </Field>
              <Field label="Repository" hint="owner/name or URL">
                <Input defaultValue="acme/project-management" />
              </Field>
              <Field label="Disabled">
                <Input disabled defaultValue="Cannot edit" />
              </Field>
              <Field label="Compact (32px)">
                <Input size="sm" placeholder="Enter list name" />
              </Field>
              <Field label="Password">
                <Input
                  type={shown ? "text" : "password"}
                  defaultValue="hunter2hunter2"
                  endAdornment={
                    <IconButton title={shown ? "Hide password" : "Show password"} size="sm" onClick={() => setShown((s) => !s)}>
                      {shown ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  }
                />
              </Field>
            </div>
            <div className="space-y-4">
              <Field label="Description">
                <Textarea placeholder="Add a more detailed description..." />
              </Field>
              <Field label="Environment">
                <Select defaultValue="staging">
                  <option value="development">development</option>
                  <option value="staging">staging</option>
                  <option value="production">production</option>
                </Select>
              </Field>
              <Field label="Tags" hint="comma separated">
                <TagInput value={tags} onChange={setTags} />
              </Field>
              <Field label="Search field">
                <SearchInput value={q} onValueChange={setQ} placeholder="Search notes" />
              </Field>
              <div className="space-y-3">
                <Checkbox label="Mark as complete" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                <Checkbox label="Round (card complete)" shape="round" defaultChecked />
                <Checkbox label="Indeterminate" indeterminate />
                <Checkbox label="Disabled" disabled />
                <Checkbox label="Disabled checked" disabled defaultChecked />
                <Toggle label="Reveal secrets" checked={on} onChange={(e) => setOn(e.target.checked)} />
                <div className="space-y-2" role="radiogroup" aria-label="Visibility">
                  <Radio name="vis" label="Private" checked={radio === "a"} onChange={() => setRadio("a")} />
                  <Radio name="vis" label="Workspace" checked={radio === "b"} onChange={() => setRadio("b")} />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ---------------- Feedback ---------------- */}
        <Section id="feedback" title="Feedback" description="Section messages, lozenges, toasts (flags), progress, loading and empty states.">
          <div className="grid gap-3 md:grid-cols-2">
            <SectionMessage appearance="info" title="Information">Boards are projects with their own modules.</SectionMessage>
            <SectionMessage appearance="success" title="Saved">Your changes were saved.</SectionMessage>
            <SectionMessage appearance="warning" title="S3 is not configured" actions={<Button variant="link">Read the setup guide</Button>}>Uploads are disabled until the AWS variables are set.</SectionMessage>
            <SectionMessage appearance="error" title="Could not connect" onDismiss={() => {}}>GitHub returned 404 for acme/missing.</SectionMessage>
            <SectionMessage appearance="discovery" title="New">Press <Kbd>/</Kbd> to search every board.</SectionMessage>
            <SectionMessage appearance="neutral">A neutral note without a title.</SectionMessage>
          </div>
          <Row label="Lozenge (subtle and bold)">
            {(["default", "success", "inprogress", "removed", "moved", "warning", "new"] as const).map((a) => (
              <Lozenge key={a} appearance={a}>{a}</Lozenge>
            ))}
          </Row>
          <Row>
            {(["default", "success", "inprogress", "removed", "moved", "warning", "new"] as const).map((a) => (
              <Lozenge key={a} appearance={a} bold>{a}</Lozenge>
            ))}
          </Row>
          <Row label="Badge (custom colours, keep contrast)">
            <Badge>Default</Badge>
            <Badge bg="#e9f2ff" fg="#09326c">Blue</Badge>
            <Badge bg="#dcfff1" fg="#164b35">Green</Badge>
            <Badge bg="#ffeceb" fg="#5d1f1a">Red</Badge>
          </Row>
          <Row label="Toasts">
            <Button variant="secondary" onClick={() => toast("Board created.", "success")}>Success</Button>
            <Button variant="secondary" onClick={() => toast("Couldn't save the title. Try again.", "error")}>Error</Button>
            <Button variant="secondary" onClick={() => toast("Link copied.", "info")}>Info</Button>
            <Button variant="secondary" onClick={() => toast("Quota almost reached.", "warning")}>Warning</Button>
            <Button variant="secondary" onClick={() => toast("Card archived.", "success", { action: { label: "Undo", onClick: () => toast("Restored.", "info") } })}>With Undo</Button>
          </Row>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <ProgressBar value={3} max={5} showValue label="Checklist" />
              <ProgressBar value={5} max={5} showValue label="Checklist complete" />
              <ProgressBar value={40} size="sm" label="Upload" />
            </div>
            <div className="space-y-3">
              <SkeletonText lines={3} />
              <div className="flex items-center gap-3"><Skeleton circle width={32} height={32} /><Skeleton width={160} height={14} /></div>
              <SkeletonCard />
              <Spinner className="!py-4" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-card border border-line">
              <EmptyState icon={<KeyRound size={26} />} color="#c9372c" title="No credentials yet" description="Store server logins, DB users and API keys. Everything is AES-256-GCM encrypted." action={<Button color="#c9372c" icon={<Plus size={16} />}>Add credential</Button>} />
            </div>
            <ErrorBox className="self-start" message="Request failed with status 500" onRetry={() => toast("Retrying...", "info")} />
          </div>
        </Section>

        {/* ---------------- Overlays ---------------- */}
        <Section id="overlays" title="Overlays" description="Popover (drill-down, anchored, flips and clamps), Menu (keyboard), Tooltip, Modal sizes, Confirm.">
          <Row label="Popover, menu, tooltip">
            <Popover
              open={popOpen}
              onOpenChange={(o) => {
                setPopOpen(o);
                if (!o) setPopView("root");
              }}
              anchorRef={popAnchor}
              title={popView === "root" ? "Card actions" : "Labels"}
              onBack={popView === "labels" ? () => setPopView("root") : undefined}
            >
              {popView === "root" ? (
                <>
                  <PopoverSection first title="Add to card">
                    <PopoverItem icon={<Users size={16} />}>Members</PopoverItem>
                    <PopoverItem icon={<Tag size={16} />} trailing={<ChevronDown size={16} className="-rotate-90" />} onClick={() => setPopView("labels")}>Labels</PopoverItem>
                    <PopoverItem icon={<Calendar size={16} />}>Dates</PopoverItem>
                  </PopoverSection>
                  <PopoverSection title="Name">
                    <Input size="sm" defaultValue="Fix typo on landing" />
                  </PopoverSection>
                  <PopoverFooter>
                    <Button onClick={() => setPopOpen(false)}>Save</Button>
                  </PopoverFooter>
                </>
              ) : (
                <div className="space-y-1">
                  {LABEL_COLORS.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Checkbox checked={labelSel.includes(c.id)} onCheckedChange={(v) => setLabelSel((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))} aria-label={c.label} />
                      <div className="min-w-0 flex-1"><LabelChip color={c.id} variant="large" name={c.label} /></div>
                    </div>
                  ))}
                </div>
              )}
            </Popover>
            <Button ref={popAnchor} variant="secondary" onClick={() => setPopOpen((o) => !o)}>
              Open popover
            </Button>
            <Popover trigger={<Button variant="secondary" iconRight={<ChevronDown size={16} />}>Uncontrolled popover</Button>} title="Filter" width={280}>
              <PopoverSection first title="Keyword">
                <Input size="sm" placeholder="Enter a keyword" />
              </PopoverSection>
            </Popover>
            <Menu trigger={<IconButton title="List actions"><MoreHorizontal size={16} /></IconButton>}>
              <MenuItem icon={<Pencil size={16} />} onClick={() => toast("Rename", "info")}>Rename list</MenuItem>
              <MenuItem icon={<Copy size={16} />} onClick={() => toast("Copied", "info")}>Copy list</MenuItem>
              <MenuItem icon={<Archive size={16} />} disabled>Archive (disabled)</MenuItem>
              <MenuDivider />
              <MenuItem danger icon={<Trash2 size={16} />} onClick={() => setConfirm(true)}>Delete list</MenuItem>
            </Menu>
            <Menu align="left" trigger={<Button variant="secondary" iconRight={<ChevronDown size={16} />}>Sort by</Button>}>
              <MenuItem selected>Newest first</MenuItem>
              <MenuItem selected={false}>Oldest first</MenuItem>
              <MenuItem selected={false}>Amount</MenuItem>
            </Menu>
            <Tooltip content="Hover or focus me"><Button variant="secondary">Tooltip</Button></Tooltip>
          </Row>
          <Row label="Modal and confirm">
            <Button variant="secondary" onClick={() => setModal("small")}>Small 400</Button>
            <Button variant="secondary" onClick={() => setModal("medium")}>Medium 600</Button>
            <Button variant="secondary" onClick={() => setModal("large")}>Large 800 (scrolls)</Button>
            <Button variant="danger" onClick={() => setConfirm(true)}>Confirm delete</Button>
            <Button variant="danger" onClick={() => setConfirmType(true)}>Type to confirm</Button>
          </Row>
        </Section>

        {/* ---------------- Navigation ---------------- */}
        <Section id="navigation" title="Navigation" description="Tabs (underline with counts, pill, segmented, glass), breadcrumbs, page header.">
          <Tabs
            ariaLabel="Boards filter"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "All boards", count: 6 },
              { id: "starred", label: "Starred", count: 2 },
              { id: "archived", label: "Archived", count: 1 },
              { id: "off", label: "Disabled", disabled: true },
            ]}
          />
          <Row label="Pill, segmented, glass">
            <Tabs variant="pill" value={pill} onChange={setPill} ariaLabel="Pill" tabs={[{ id: "a", label: "Overview" }, { id: "b", label: "Tasks" }, { id: "c", label: "Notes" }]} />
            <Tabs variant="segmented" value={seg} onChange={setSeg} ariaLabel="View" tabs={[{ id: "list", label: "List" }, { id: "grid", label: "Grid" }]} />
            <div className="rounded-control p-2" style={{ background: boardBackground("grape") }}>
              <Tabs variant="glass" value={view} onChange={setView} ariaLabel="View" tabs={[{ id: "board", label: "Board" }, { id: "table", label: "Table" }, { id: "cal", label: "Calendar" }]} />
            </div>
          </Row>
          <Breadcrumbs items={[{ label: "Boards", href: "/boards" }, { label: "Project management tool", href: "#navigation" }, { label: "Environment" }]} />
          <div className="content-sheet p-6 shadow-card">
            <PageHeader
              title="Environment"
              description="Variables per environment, encrypted at rest."
              color="#5e4db2"
              icon={<Lock size={20} />}
              actions={<><Button variant="secondary">Import</Button><Button color="#5e4db2" icon={<Plus size={16} />}>Add variable</Button></>}
              className="!mb-0"
            />
          </div>
        </Section>

        {/* ---------------- Data display ---------------- */}
        <Section id="data" title="Data display" description="Avatars, labels, stat tiles, inline edit, keyboard keys, dividers.">
          <Row label="Avatar sizes and group">
            <Avatar name="Shree Raj" size="xs" />
            <Avatar name="Shree Raj" size="sm" />
            <Avatar name="Ada Lovelace" />
            <Avatar name="Grace Hopper" size="lg" />
            <Avatar name="Linus Torvalds" size="xl" />
            <AvatarGroup people={[{ name: "Ada Lovelace" }, { name: "Grace Hopper" }, { name: "Linus Torvalds" }, { name: "Margaret Hamilton" }, { name: "Alan Turing" }, { name: "Dennis Ritchie" }]} />
          </Row>
          <Row label="LabelChip: collapsed bar, expanded, large">
            <div className="flex flex-wrap gap-1">
              {LABEL_COLORS.map((c) => <LabelChip key={c.id} color={c.id} variant="collapsed" />)}
            </div>
          </Row>
          <Row>
            {LABEL_COLORS.map((c) => <LabelChip key={c.id} color={c.id} name={c.label} />)}
          </Row>
          <Row className="grid max-w-md grid-cols-1 gap-1 sm:grid-cols-2">
            {LABEL_COLORS.slice(0, 4).map((c) => <LabelChip key={c.id} color={c.id} variant="large" name={c.label} selected={labelSel.includes(c.id)} onClick={() => setLabelSel((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))} />)}
          </Row>
          <Row label="StatTile" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile label="Open tasks" value={14} color="#1f845a" icon={<Check size={20} />} />
            <StatTile label="Spent this month" value="$412.00" color="#ae4787" icon={<Wallet size={20} />} href="#data" />
            <StatTile label="Secrets" value={28} color="#c9372c" icon={<KeyRound size={20} />} />
          </Row>
          <Row label="InlineEdit (click, Enter saves, Esc cancels)" className="max-w-xl space-y-3">
            <InlineEdit as="h3" value={title} onSave={setTitle} label="Board name" textClassName="text-h-m font-semibold" />
            <InlineEdit value={note} onSave={setNote} multiline label="Description" rows={3} />
          </Row>
          <Row label="Keys and divider" className="max-w-md">
            <div className="flex items-center gap-1 text-body text-ink-soft">Search <Kbd>Ctrl</Kbd><Kbd>K</Kbd> · Close <Kbd>Esc</Kbd></div>
            <Divider>or</Divider>
          </Row>
        </Section>

        {/* ---------------- Recipes ---------------- */}
        <Section id="recipes" title="Recipes: list and card" description="Trello list (272px, #F1F2F4, radius 12) and card (white, radius 8, raised, hover swaps background).">
          <div className="flex gap-2 overflow-x-auto rounded-list bg-neutral-300 p-2">
            {["To Do", "In Progress"].map((l, li) => (
              <div key={l} className="t-list w-[272px] shrink-0 pb-2">
                <div className="flex items-center justify-between px-2 pt-2">
                  <div className="px-3 py-1.5 text-h-xs font-semibold text-ink">{l}</div>
                  <IconButton title="List actions"><MoreHorizontal size={16} /></IconButton>
                </div>
                <div className="space-y-2 px-1 pt-1">
                  {(li === 0 ? [0, 1, 2] : [0, 1]).map((i) => (
                    <div key={i} className="t-card cursor-pointer px-3 pb-1 pt-2">
                      <div className="mb-1 flex gap-1">
                        <LabelChip color={LABEL_COLORS[(i + li * 2) % 6].id} variant="collapsed" />
                        {i === 0 ? <LabelChip color="purple" variant="collapsed" /> : null}
                      </div>
                      <div className="mb-1 text-body text-ink">{["Fix typo on landing page", "Wire the Stripe webhook and handle retries for failed payments", "Write release notes"][i]}</div>
                      <div className="mb-1 flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1">
                        <Lozenge appearance={i === 0 ? "removed" : "default"} bold={i === 0}>{i === 0 ? "Jun 14" : "Jul 02"}</Lozenge>
                        <span className="inline-flex items-center gap-1 text-body-sm text-ink-soft"><Check size={14} />2/5</span>
                        <span className="ml-auto"><AvatarGroup people={[{ name: "Ada Lovelace" }, { name: "Grace Hopper" }]} size="sm" /></span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-2 pt-2">
                  <Button variant="subtle" fullWidth alignStart icon={<Plus size={16} />} className="!rounded-card !text-ink-soft">Add a card</Button>
                </div>
              </div>
            ))}
            <div className="glass-panel flex h-11 w-[272px] shrink-0 items-center gap-2 rounded-list px-3 text-body font-medium !text-ink">
              <Plus size={16} /> Add another list
            </div>
          </div>
        </Section>

        {/* ---------------- Glass ---------------- */}
        <Section id="glass" title="Glass over a board gradient" description="Header and sidebar are translucent dark overlays with white text. Content sheet and lists stay opaque.">
          <div className="overflow-hidden rounded-list" style={{ background: boardBackground("ocean") }}>
            <div className="glass-bar flex h-12 items-center gap-1 px-3">
              <Logo variant="white" size="md" />
              <Button variant="transparent" className="ml-2">Boards</Button>
              <Button variant="glass" icon={<Plus size={16} />}>Create</Button>
              <div className="ml-auto flex items-center gap-1">
                <SearchInput onBoard placeholder="Search" expandOnFocus className="hidden sm:block" />
                <IconButton title="Notifications" variant="transparent"><Bell size={16} /></IconButton>
                <Avatar name="Shree Raj" size="sm" />
              </div>
            </div>
            <div className="glass-bar glass-bar--board flex h-14 items-center gap-2 px-4">
              <InlineEdit as="h2" onBoard value="Project management tool" onSave={() => {}} label="Board name" textClassName="text-h-s font-bold" truncate className="min-w-0 max-w-[260px]" />
              <IconButton title="Star board" variant="transparent"><Star size={16} /></IconButton>
              <Tabs variant="glass" value={view} onChange={setView} ariaLabel="View" tabs={[{ id: "board", label: "Board" }, { id: "table", label: "Table" }]} className="hidden sm:flex" />
              <div className="ml-auto flex items-center gap-2">
                <Button variant="transparent" icon={<Filter size={16} />}>Filters</Button>
                <Button variant="transparent" className="!bg-white !text-ink hover:!bg-list">Share</Button>
                <IconButton title="Show menu" variant="transparent"><MoreHorizontal size={16} /></IconButton>
              </div>
            </div>
            <div className="grid gap-3 p-3 sm:grid-cols-[200px_1fr]">
              <aside className="glass-bar glass-bar--board hidden rounded-list p-2 sm:block" aria-label="Modules">
                {["Overview", "Tasks", "Environment", "Passwords", "Files", "Notes"].map((m, i) => (
                  <div key={m} className={`flex h-8 items-center gap-2 rounded-control px-3 text-body font-medium text-white ${i === 1 ? "bg-white/25" : "hover:bg-white/20"}`}>
                    {i === 1 ? <Check size={16} /> : <Settings size={16} />} {m}
                  </div>
                ))}
              </aside>
              <div className="content-sheet p-5">
                <PageHeader title="Notes" description="Markdown notes with live preview." color="#946f00" icon={<Pencil size={20} />} actions={<Button color="#946f00" icon={<Plus size={16} />}>New note</Button>} className="!mb-4" />
                <div className="flex items-center gap-2 text-body text-ink-soft">
                  <AlertTriangle size={16} /> White sheet, ink text, 24px padding, max-w-page.
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <LogoMark size="xl" /> <span className="rounded-card bg-ink p-2"><LogoMark size="xl" variant="white" /></span>
            <span className="rounded-card bg-ink p-3"><Logo variant="white" size="lg" /></span>
            <Logo size="lg" />
          </div>
        </Section>
      </main>

      {/* ---- overlays rendered here ---- */}
      <Modal
        open={modal === "small"}
        onClose={() => setModal(null)}
        size="small"
        title="Create list"
        description="Lists group cards on the board."
        footer={<><Button variant="subtle" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => setModal(null)}>Create</Button></>}
      >
        <Field label="List name" required><Input placeholder="e.g. Backlog" /></Field>
      </Modal>
      <Modal
        open={modal === "medium"}
        onClose={() => setModal(null)}
        title="Add variable"
        accent="#5e4db2"
        footer={<><Button variant="subtle" onClick={() => setModal(null)}>Cancel</Button><Button color="#5e4db2" onClick={() => setModal(null)}>Save</Button></>}
      >
        <div className="space-y-4">
          <Field label="Key" required><Input placeholder="DATABASE_URL" className="mono" /></Field>
          <Field label="Value"><Textarea placeholder="postgres://..." /></Field>
          <Field label="Environment"><Select><option>development</option><option>production</option></Select></Field>
          <Toggle label="Mark as secret" defaultChecked />
        </div>
      </Modal>
      <Modal open={modal === "large"} onClose={() => setModal(null)} size="large" title="Large modal with long content" footer={<Button onClick={() => setModal(null)}>Done</Button>}>
        <div className="space-y-3 text-body text-ink-soft">
          {Array.from({ length: 24 }).map((_, i) => (
            <p key={i}>Paragraph {i + 1}. The body scrolls inside the dialog while the header and footer stay fixed. Esc closes, Tab is trapped inside, focus returns to the button that opened it.</p>
          ))}
        </div>
      </Modal>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => toast("List deleted.", "success")} title="Delete list To Do?" message="All 6 cards in this list will be removed. There is no undo." confirmLabel="Delete list" />
      <ConfirmDialog open={confirmType} onClose={() => setConfirmType(false)} onConfirm={() => toast("Board deleted.", "success")} title="Delete board Portfolio site?" message="This deletes 24 tasks, 12 variables, 6 credentials, 3 files and 5 notes." confirmLabel="Delete board" confirmText="Portfolio site" />
    </div>
  );
}
