# DevBoard design system

Trello / Atlassian Design System (ADS) look. Foundation owned by the design-system engineer: `src/app/globals.css`,
`src/components/ui/**`, `src/lib/constants.ts`, `src/app/layout.tsx`. Live style guide: **/design-system** (every
component and state, plus a glass-over-gradient sample). Import everything from `@/components/ui` (barrel) or the
file path shown below.

```tsx
import { Button, IconButton, Modal, Field, Input, Popover, Menu, MenuItem, Lozenge, Avatar } from "@/components/ui";
```

## 0. Rules in 10 lines

1. Text colour is always explicit: `text-ink` (default), `text-ink-soft` (secondary), `text-ink-muted` (meta). Never rely on inherited colour. On a board gradient or glass bar use `text-white`.
2. Colours come from tokens (`bg-brand`, `text-danger-text`, `bg-fill`), not new hex values. Old token names still work.
3. CSS is layered (`base < components < utilities`). Utilities always beat `.btn`, `.t-input`, `.t-card`... so `className="h-7 w-full text-white"` works. Never add unlayered CSS that sets colour, font or spacing.
4. 14/20 is the UI font size. Headings are 600. Radius: controls 3px, cards and popovers 8px, lists and modals 12px.
5. Every interactive element has a visible focus ring (global `:focus-visible`, 2px #388BFF). Do not use `outline-none` except on inputs that draw their own ring.
6. Icon-only controls use `IconButton` with a `title` (it becomes aria-label and tooltip).
7. Module pages sit inside the white content sheet that ProjectShell provides. They start with `PageHeader`. No outer background, outer padding or max width.
8. Loading = `Skeleton` for known shapes, `Spinner` for unknown. Errors = `ErrorBox` or `SectionMessage`. Empty = `EmptyState` with one action.
9. Reversible actions (archive, move) happen immediately with a toast that has Undo. Irreversible single items use `ConfirmDialog`; at scale use `ConfirmDialog confirmText="name"`.
10. Everything works at 390px width: 16px side gutter, no horizontal page scroll, 32px+ touch targets (sm buttons grow to 32px on touch devices).

## 1. Tokens (`@theme` in globals.css)

### Colour (Tailwind utilities: `bg-*`, `text-*`, `border-*`, `ring-*`)

| Token | Value | Use |
| --- | --- | --- |
| `ink` / `text` | #172B4D | default text |
| `ink-soft` / `text-subtle` | #44546F | secondary text, icons |
| `ink-muted` / `text-subtlest` | #626F86 | meta, placeholder (4.9:1) |
| `ink-disabled` | #091E424F | disabled text |
| `canvas` | #FFFFFF | page, card, popover, modal surface |
| `surface` / `surface-sunken` | #F7F8F9 | sunken well, hover tint. NOTE: `bg-surface` is grey, not white |
| `list` | #F1F2F4 | Trello list background |
| `line` / `border` | #DCDFE4 | hairlines |
| `border-input` | #8590A2 | input and checkbox border |
| `border-bold` | #758195 | strong separators |
| `fill-subtle` / `fill` / `fill-hover` / `fill-pressed` | #091E42 at 3% / 6% / 14% / 31% | secondary buttons, row hover, skeleton |
| `brand` / `brand-dark` / `brand-pressed` | #0C66E4 / #0055CC / #09326C | primary action, links |
| `brand-soft` / `-hover` / `-pressed` | #E9F2FF / #CCE0FF / #85B8FF | selected row, info tint |
| `link`, `link-pressed`, `link-visited` | #0C66E4 / #0055CC / #5E4DB2 | inline links (`.link` class) |
| `focus` | #388BFF | focus ring |
| `success` (`-dark`, `-soft`, `-text`) | #1F845A / #216E4E / #DCFFF1 / #216E4E | success |
| `danger` (`-dark`, `-pressed`, `-soft`, `-text`) | #C9372C / #AE2E24 / #81201A / #FFEDEB / #AE2E24 | destructive, errors. `border-danger` red input: `border-border-danger` #E2483D |
| `warning` (text), `warning-soft`, `warning-bold` | #974F0C / #FFF7D6 / #F5CD47 | warnings. Text on `warning-bold` is `ink` |
| `discovery` (`-soft`, `-text`) | #6E5DC6 / #F3F0FF / #5E4DB2 | new / discovery |
| `glass`, `glass-board` | rgba(0,0,0,.32) / .24 | translucent chrome over a board |
| `on-board`, `on-board-hover`, `on-board-ghost-hover` | rgba(255,255,255,.24) / .32 / .20 | buttons and tiles on a board |
| `scrim`, `scrim-strong` | rgba(9,30,66,.54) / rgba(0,0,0,.64) | modal blanket, card back |

Scales: `blue red orange yellow green purple magenta teal lime neutral`, steps 100 to 1000 (`bg-blue-700`, `var(--color-green-300)`). 700 = bold fill, 800 hover, 900 text on a tint. Label colours: `--color-label-{id}` / `-ink` and `LABEL_COLORS` in `lib/constants.ts` (each has `bg`, `fg`, `subtle`, `bold`).

### Type, radius, shadow, layout

| Token | Utility | Value |
| --- | --- | --- |
| type | `text-body` 14/20, `text-body-sm` 12/16, `text-micro` 11/16, `text-body-lg` 16/24 | UI text |
| headings | `text-h-xxs` 12/16, `h-xs` 14/20, `h-s` 16/20, `h-m` 20/24, `h-l` 24/28, `h-xl` 28/32, `h-xxl` 32/36 | pair with `font-semibold` |
| font | `font-sans` (system UI stack), `font-mono` / `.mono` | |
| radius | `rounded-control` 3, `rounded-label` 4, `rounded-card` 8, `rounded-popover` 8, `rounded-list` 12, `rounded-modal` 12 | |
| shadow | `shadow-card` (card at rest), `shadow-overlay` (popover, modal; `shadow-raised` is an alias) | |
| containers | `max-w-page` 1200px, `max-w-narrow` 768px, `max-w-login` 400px | |
| layout vars | `--w-list` 272, `--w-popover` 304, `--w-drawer` 339, `--w-sidebar` 260, `--w-card-back` 768, `--h-header` 48, `--h-board-header` 56, `--h-control(-sm/-lg)` 32/24/40 | `w-[var(--w-list)]` |
| z-index | `--z-card` 100, `header` 200, `drawer` 300, `popover` 400, `blanket` 500, `modal` 510, `flag` 600, `tooltip` 800 | `z-[var(--z-header)]` |

### CSS classes (globals.css, `@layer components`)

`.t-card` (white, 8px, raised, hover swaps bg to #F7F8F9; add `.t-card--static` for no hover), `.t-list`, `.t-input` / `.t-input--sm`, `.t-label`,
`.popover-surface`, `.glass-bar` (+ `.glass-bar--board`), `.glass-panel`, `.content-sheet`, `.link`, `.btn*`, `.menu-item`, `.lozenge`,
`.skeleton`, `.prose-note`, `.mono`, `.fade-in`, `.anim-pop|modal|toast|sheet|drawer|blanket`.

## 2. Components (`src/components/ui/*`)

Minimal prop lists. Every component also accepts `className` unless noted.

### Button.tsx
```tsx
<Button variant="primary" size="md" icon={<Plus size={16} />} loading={busy}>Add card</Button>
<IconButton title="List actions" size="md"><MoreHorizontal size={16} /></IconButton>
<Link href="/x" className={buttonClass({ variant: "secondary" })}>Looks like a button</Link>
```
- `Button`: all `<button>` props + `variant` (`primary secondary subtle transparent link danger warning ghost glass`), `size` (`sm` 24px / `md` 32px / `lg` 40px), `loading` (spinner, keeps width, blocks clicks), `icon`, `iconRight`, `color` (accent override for `primary`, use `MOD.color`), `fullWidth`, `alignStart`. No children + icon = square icon button.
- Variant notes: `transparent` (white text, on a board), `glass` (translucent white fill + white text, old "subtle" look), `subtle`/`ghost` (no fill, dark text, grey hover), `link` (inline blue link look).
- `IconButton`: `title` (required, aria-label + tooltip), `size` `sm 24 | md 32 | lg 40`, `variant` (default `subtle`), `active` (toggled look + aria-pressed), `tooltip={false}`.
- `ButtonGroup`, `buttonClass({variant,size,fullWidth,iconOnly,align,className})` for styling `<Link>`.
- Default `type` is the browser default (submit inside forms): always pass `type="button"` for non-submit buttons.

### Field.tsx
```tsx
<Field label="Board title" required helper="You can rename it later" error={err}>
  <Input value={v} onChange={(e) => setV(e.target.value)} />
</Field>
```
- `Input`: `size` `"md"` 40px (default) | `"sm"` 32px (NOT a number), `invalid`, `startIcon`, `endAdornment`, all `<input>` props, `ref` works.
- `Textarea` (`invalid`), `Select` (`size`, `invalid`; native `<select>` with chevron), `Label` (`required`, `hint`, `htmlFor`).
- `Field`: `label`, `hint` (muted inline suffix, "(optional)"), `helper` (under control), `error` (red + icon, sets aria-invalid), `required` (red asterisk), `htmlFor`. The first element child gets `id`, `aria-invalid`, `aria-describedby`; or pass a render function `(p) => <input {...p} />`.
- Inputs are 16px on phones (prevents iOS zoom). Placeholder colour is ink-muted.

### Checkbox.tsx
```tsx
<Checkbox label="Mark complete" checked={c} onCheckedChange={setC} />   <Toggle label="Secret" /> <Radio name="v" label="Private" />
```
`Checkbox` (`label`, `description`, `indeterminate`, `shape="square|round"`, `invalid`, `onCheckedChange`, all input props), `Toggle` (role=switch, 40x24, green), `Radio`. Native inputs underneath. `inputRef` for refs.

### Modal.tsx / Confirm.tsx
```tsx
<Modal open={open} onClose={close} title="Add variable" size="medium" footer={<><Button variant="subtle" onClick={close}>Cancel</Button><Button type="submit" form="f">Save</Button></>}>
  <form id="f" ...>...</form>
</Modal>
<ConfirmDialog open={o} onClose={c} onConfirm={del} title="Delete list To Do?" message="All 6 cards will be removed." confirmLabel="Delete list" />
```
- `Modal` props: `open onClose title description children footer width size accent hideHeader closeOnBackdrop flush className bodyClassName scrim`. `size`/`width`: `small` 400, `medium` 600 (default), `large` 800, `xlarge` 968; `width` also accepts a legacy Tailwind class (`max-w-md`). Portal, focus trap + restore, Esc, backdrop click, scroll lock, aria-modal + labelledby. Body scrolls, header and footer stay. Initial focus: `data-autofocus`, else first field in the body. `hideHeader` + `<ModalCloseButton/>` for custom headers (card back, with `flush` and `scrim="strong"`).
- `ConfirmDialog`: `open onClose onConfirm title message confirmLabel cancelLabel variant confirmText`. `confirmText` = type-to-confirm. Title names the object, button names the verb.

### Popover.tsx and Menu.tsx
```tsx
<Popover trigger={<Button variant="secondary">Filter</Button>} title="Filter" width={304}>
  <PopoverSection first title="Keyword"><Input size="sm" /></PopoverSection>
  <PopoverFooter><Button variant="link">Clear all</Button></PopoverFooter>
</Popover>
<Menu trigger={<IconButton title="List actions"><MoreHorizontal size={16} /></IconButton>}>
  <MenuItem icon={<Pencil size={16} />} onClick={rename}>Rename</MenuItem><MenuDivider /><MenuItem danger onClick={del}>Delete</MenuItem>
</Menu>
```
- `Popover`: `open/defaultOpen/onOpenChange` (controlled or uncontrolled), `trigger` (wrapped in an inline-flex span) or `anchorRef` / `anchor` (controlled, anchored to any element), `title` (centered header + close), `onBack` (drill-down chevron), `width` (px, CSS length or `"auto"`, default 304), `placement` (`bottom-start` default, `bottom-end`, `top-*`, `right-start`, `left-start`), `offset`, `padded`, `role`, `mobileSheet` (bottom sheet under 640px, default true), `initialFocus` (`auto|container|none`), `closeOnOutsideClick`, `closeOnEsc`. `children` may be `(api) => node` with `api.close()`. Flips and clamps to the viewport, follows scroll, Esc closes exactly one layer (shared stack with Modal), outside click closes, focus moves in and returns to the trigger.
- Helpers: `PopoverSection` (12px 600 caption), `PopoverItem` (row: `icon trailing description selected danger disabled href onClick closeOnClick`; role=menuitem automatically inside a Menu), `PopoverDivider`, `PopoverFooter`, `usePopover()`.
- `Menu`: `trigger children align="right|left" width="w-56" title placement open onOpenChange`. Items close the menu on click. Keyboard: Up/Down/Home/End, typeahead, Esc, Tab closes. `MenuItem` (= PopoverItem), `MenuDivider`, `MenuLabel`. Use `selected` for single-choice menus (role menuitemradio).

### Tooltip.tsx
`<Tooltip content="Star board"><IconButton .../></Tooltip>`. Wraps exactly one element (cloned, no wrapper). 300ms delay, shows on focus-visible, Esc hides. Disabled buttons need a span wrapper.

### Tabs.tsx
```tsx
<Tabs value={tab} onChange={setTab} tabs={[{ id: "all", label: "All", count: 12 }, { id: "arch", label: "Archived" }]} />
<Tabs variant="segmented" ... />   // underline | pill | segmented | glass
```
`tabs[]: { id, label, count?, icon?, disabled?, href? }`. With `href` on any tab it renders `<nav>` links with `aria-current` (module navigation). `TabPanel idPrefix id value`. Arrow keys / Home / End. `glass` variant = white text for a board header.

### Lozenge.tsx, Misc.tsx (Badge)
`<Lozenge appearance="success" bold>Done</Lozenge>` appearances: `default success inprogress removed moved warning new`; `bold` = solid. 16px uppercase 11px. Use Lozenge for fixed statuses.
`<Badge bg fg>` 20px sentence-case chip with custom colours (pass contrast-safe pairs; default neutral).

### Avatar.tsx
`<Avatar name src size="xs|sm|md|lg|xl|number" />` (xs 16, sm 24, md 32, lg 40, xl 96; initials fallback, colour hashed from the name). `<AvatarGroup people={[{name,src}]} max={4} size ring />` (`ring` = surface colour behind it: `#fff` on cards, `#f1f2f4` in lists). Helpers `avatarColor`, `initials`.

### LabelChip.tsx
`<LabelChip color="green" name="Frontend" variant="collapsed|expanded|large" onClick selected />`. `color` = `LABEL_COLORS` id. `collapsed` 8px bar (card face), `expanded` 16px pill (default), `large` 32px full-width pill (picker; wrap in a `flex-1 min-w-0` div when beside a checkbox).

### InlineEdit.tsx
```tsx
<InlineEdit value={list.title} onSave={(t) => rename(t)} label="List title" textClassName="text-h-xs font-semibold" />
<InlineEdit as="h1" onBoard truncate value={board.name} onSave={rename} textClassName="text-h-s font-bold" />
```
Click, Enter or F2 to edit (text selected). Enter saves, Esc cancels (does not close the enclosing modal), blur saves, empty or unchanged reverts silently. `multiline` = auto-grow textarea (save with Cmd/Ctrl+Enter, shows Save / Cancel). Props: `value onSave label placeholder multiline submitOn saveOnBlur allowEmpty readOnly maxLength as onBoard truncate textClassName editorClassName rows showActions editing onEditingChange`. Typography is yours via `textClassName`.

### SearchInput.tsx
`<SearchInput value={q} onValueChange={setQ} placeholder="Search boards" />` 32px (`size="md"` 40px), clear button, Esc clears. `onBoard` = translucent white field that turns white on focus (glass header). `expandOnFocus` grows 200 to 280px.

### Feedback: SectionMessage.tsx, Skeleton.tsx, ProgressBar.tsx, Toast.tsx, Misc.tsx
- `<SectionMessage appearance="info|warning|error|success|discovery|neutral" title actions onDismiss icon>text</SectionMessage>`.
- `Skeleton` (`width height circle`), `SkeletonText lines`, `SkeletonCard` (64px). `Spinner` (`size label`), `ErrorBox message onRetry title`.
- `ProgressBar value max label showValue size color` (green at 100%, `showValue` = checklist percent label).
- `EmptyState icon title description action color compact`: tinted icon disc (module colour), one sentence, one action.
- Toasts: `const { toast, dismiss } = useToast(); toast("Card archived.", "success", { action: { label: "Undo", onClick } })`. Kinds `success error info warning`. Options: `action`, `duration` (default 5s, 8s with action, 10s error), `title`, `bold`. Bottom-left (bottom-centre on phones), max 3, pause on hover, Ctrl/Cmd+Z triggers the newest Undo. Copy: past tense with the object. Do not toast routine saves that already show their result.

### Navigation and layout: Breadcrumbs.tsx, Misc.tsx (PageHeader, StatTile), Divider.tsx, Kbd.tsx, Logo.tsx
- `<Breadcrumbs items={[{label:"Boards",href:"/boards"},{label:"Project"}]} onBoard />` last item is `aria-current`.
- `<PageHeader title description icon color actions meta breadcrumbs />` 24/28 title, 40px module-colour icon tile, actions wrap under the title on phones. `ModuleHeader` is an alias.
- `<StatTile label value color icon href />` white `t-card` number tile.
- `<Divider>or</Divider>`, `<Kbd>Esc</Kbd>`.
- `<Logo size="sm|md|lg|xl|number" variant="color|white" showWordmark />`, `<LogoMark />`. Wrap in `<Link href="/boards">`. `public/icon.svg` is the same mark.
- `<TagInput value onChange />` chip input (Enter or comma adds, Backspace removes). Works inside `Field`.

## 3. Layout recipes

**App page container** (home, settings): `<main className="mx-auto w-full max-w-page px-4 py-6 sm:px-6">`.

**Board background**: the board shell paints `style={{ background: boardBackground(project.color) }}` on a full-height wrapper. Everything over it is either translucent chrome with white text or an opaque white / `#F1F2F4` surface. Never put dark text directly on the gradient.

**Glass header** (inside a board): `<header className="glass-bar flex h-12 items-center gap-1 px-3">` with `Button variant="transparent"`, `IconButton variant="transparent"`, `Button variant="glass"` for Create, `<SearchInput onBoard />`, `<Logo variant="white" />`. Second bar: `glass-bar glass-bar--board h-14 px-4` with `<InlineEdit as="h1" onBoard ... />`, `IconButton variant="transparent"`, `Tabs variant="glass"`.

**Glass sidebar**: `<aside className="glass-bar glass-bar--board rounded-list p-2">` rows `h-8 rounded-control px-3 text-body font-medium text-white hover:bg-white/20`, active `bg-white/25`.

**Module content sheet** (ProjectShell provides it): `content-sheet mx-auto w-full max-w-page p-4 sm:p-6` and the page starts with `<PageHeader .../>`.

**List and card** (Tasks): list `t-list w-[var(--w-list)] shrink-0` with header `px-2 pt-2` (title `px-3 py-1.5 text-h-xs font-semibold`, `IconButton` menu), cards `t-card px-3 pb-1 pt-2` with 8px gap, labels as `LabelChip variant="collapsed"` bars on top, title `text-body text-ink`, badges row `flex flex-wrap gap-x-2 gap-y-1`, footer `Button variant="subtle" fullWidth alignStart icon={<Plus size={16}/>}` "Add a card". Add-list tile: `glass-panel h-11 w-[var(--w-list)] rounded-list px-3`. Drag state: add `rotate-3 shadow-overlay`.

**Forms in modals**: `space-y-4` of `Field`s, footer `Cancel (subtle)` left of the primary action. Two columns only above `sm`.

**Toolbar above a table**: `flex flex-wrap items-center gap-2`: `SearchInput className="sm:max-w-xs"`, `Select size="sm"`, spacer `ml-auto`, primary action.

**Data rows**: `border-b border-line py-2 hover:bg-fill-subtle`, secrets as `.mono`, actions as `IconButton size="sm"` revealed on hover but always visible on touch (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100`).

## 4. Do and don't

| Do | Don't |
| --- | --- |
| `className="text-ink"` / `text-white` explicitly | rely on inherited colour (white-on-white bugs) |
| tokens: `bg-brand`, `text-danger-text`, `bg-fill` | new hex values, `text-gray-500`, `bg-blue-600` (Tailwind defaults exist but are off-palette) |
| `IconButton title="Delete"` | bare `<button>` with only an icon |
| `Field` for every form control | placeholder as the only label |
| `Modal` for 4+ fields, `Popover` for 1 to 3 | stack modals; use drill-down inside a popover |
| `Skeleton` for lists and cards | a lone centered spinner for a known layout |
| name the object and verb in confirms | "Are you sure?" and "OK" |
| `Lozenge` for fixed statuses | coloured text as the only status cue |
| keep one primary button per view | two primary buttons side by side |
| `max-w-page` container, 16px gutter | custom widths per page |

## 5. Accessibility

- Contrast >= 4.5:1 for text. Safe pairs: `ink`/`ink-soft`/`ink-muted` on white or `#F7F8F9`; white on `brand`, `danger`, `success`, `discovery`, `neutral-800`; `ink` on `warning-bold`, label colours with `LABEL_COLORS[].fg`. `#8590A2` is for borders only, never text.
- Focus ring is global and must stay visible. Inputs draw border + 1px ring instead. Do not remove outlines.
- Dialogs: `role=dialog`, `aria-modal`, labelled by title, focus trapped and restored. Popovers: `role=dialog` (or `menu`), labelled, Esc closes one layer. Tooltips are supplementary, never the only label.
- Error text uses `role=alert`; toasts are `role=status` (errors `alert`). Keep one `h1` per page (PageHeader).
- Keyboard: every action reachable by Tab; menus by arrows; tabs by arrows; InlineEdit by Enter/F2. Minimum touch target 32px (coarse pointers upgrade `sm`).
- `prefers-reduced-motion` disables transitions and animations globally (also what the QA harness emulates).
- Do not convey state by colour alone (due dates also show text, lozenges show words).

## 6. Gotchas for page agents

- `bg-surface` is #F7F8F9 (sunken). White is `bg-canvas` (or `bg-white`).
- `cn()` only joins strings (no tailwind-merge). Component base styles live in layered CSS classes, so a utility in your `className` wins, but two utilities for the same property (`h-7 h-9`) are ambiguous: pass one.
- Modal `width="max-w-md"` still works (legacy). Prefer `size="small|medium|large"`.
- `variant="subtle"` is now the ADS no-fill button (dark text). The old translucent-white look is `variant="glass"` (and `transparent` for no fill, white text).
- `Input size` is `"sm" | "md"`, not the HTML number attribute.
- `Menu width` takes a Tailwind class (`w-48`), a number or `"auto"`. Menu items close on click; use `closeOnClick={false}` on an item to keep it open.
- A controlled `Popover` needs an `anchorRef` (or `anchor`) when there is no `trigger`. Put the ref on the element that opens it.
- `Tooltip` needs a single DOM-forwarding child. Wrap disabled buttons in a span.
- `Button` `loading` keeps the label width (label hidden, spinner centered) and ignores clicks. The `disabled` attribute is not set while loading.
- Do not call `toast()` for every save. Prefer the visible result; use `{ action: { label: "Undo" } }` for reversible actions.
- `.t-card:hover` changes the background to #F7F8F9 (Trello behaviour). Add `t-card--static` for non-clickable cards.
- QA harness runs with reduced motion: transitions are 0s, so do not rely on `transitionend`.
