"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, Link2, Upload } from "lucide-react";
import { cn } from "@/lib/client";
import { BOARD_COLORS, BOARD_IMAGES, boardBackground, isValidBoardBackground } from "@/lib/constants";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useProject } from "../ProjectContext";
import { useBoardActions } from "../useBoardActions";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Shrinks an uploaded image to at most 1920px wide and returns a JPEG data URL (keeps the board document small). */
async function fileToBackground(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That file is not an image we can read."));
      i.src = url;
    });
    const scale = Math.min(1, 1920 / img.naturalWidth, 1200 / img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not process the image.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.8, 0.65, 0.5]) {
      const data = canvas.toDataURL("image/jpeg", q);
      if (isValidBoardBackground(`url:${data}`)) return data;
    }
    throw new Error("The image is too large. Try a smaller one.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Swatch({ value, label, checked, onPick, tall }: { value: string; label: string; checked: boolean; onPick: () => void; tall?: boolean }) {
  return (
    <label className="group block cursor-pointer">
      <input type="radio" name="board-background" value={value} checked={checked} onChange={onPick} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          "relative block rounded-card shadow-[inset_0_0_0_1px_rgba(9,30,66,0.15)] transition-shadow group-hover:shadow-[inset_0_0_0_1px_rgba(9,30,66,0.15),0_0_0_2px_var(--color-fill-hover)]",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
          tall ? "h-16" : "h-10",
          checked && "ring-2 ring-brand ring-offset-2"
        )}
        style={{ background: boardBackground(value) }}
      >
        {checked ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white">
              <Check size={14} />
            </span>
          </span>
        ) : null}
      </span>
      <span className={cn("mt-1 block truncate text-body-sm", checked ? "font-semibold text-ink" : "text-ink-soft")}>{label}</span>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <legend className="mb-2 text-h-xxs font-semibold text-ink-soft">{children}</legend>;
}

/** Board background picker: demo photos, preset gradients, a color picker and custom images (URL or upload). Applies live. */
export function BackgroundPanel() {
  const { project } = useProject();
  const { setColor } = useBoardActions();
  const { toast } = useToast();
  const current = project.color;
  const [hex, setHex] = useState(HEX_RE.test(current) ? current : "#0c66e4");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isCustomImage = current.startsWith("url:");
  const urlValid = /^https?:\/\/\S+$/i.test(imageUrl.trim()) && isValidBoardBackground(`url:${imageUrl.trim()}`);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file (JPG, PNG, WebP).", "error");
      return;
    }
    setUploading(true);
    try {
      const data = await fileToBackground(file);
      if (await setColor(`url:${data}`)) toast("Background updated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not use that image.", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <fieldset className="min-w-0">
        <SectionTitle>Photos</SectionTitle>
        <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
          {BOARD_IMAGES.map((img) => {
            const v = `img:${img.id}`;
            return <Swatch key={img.id} value={v} label={img.label} checked={current === v} onPick={() => void setColor(v)} tall />;
          })}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <SectionTitle>Colors</SectionTitle>
        <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
          {BOARD_COLORS.map((c) => (
            <Swatch key={c.id} value={c.id} label={c.label} checked={current === c.id} onPick={() => void setColor(c.id)} />
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <SectionTitle>Custom color</SectionTitle>
        <div className="flex items-center gap-2">
          <label className="relative h-9 w-12 shrink-0 cursor-pointer overflow-hidden rounded-control shadow-[inset_0_0_0_1px_rgba(9,30,66,0.2)]" style={{ background: HEX_RE.test(hex) ? hex : "#ffffff" }}>
            <span className="sr-only">Pick a color</span>
            <input type="color" value={HEX_RE.test(hex) ? hex : "#0c66e4"} onChange={(e) => setHex(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          </label>
          <Input value={hex} onChange={(e) => setHex(e.target.value.trim())} aria-label="Hex color" placeholder="#0c66e4" className="mono" maxLength={7} />
          <Button size="sm" variant="secondary" disabled={!HEX_RE.test(hex) || hex.toLowerCase() === current.toLowerCase()} onClick={() => void setColor(hex.toLowerCase())}>
            Apply
          </Button>
        </div>
        {HEX_RE.test(current) ? <p className="mt-1.5 text-body-sm text-ink-muted">Current: {current.toUpperCase()}</p> : null}
      </fieldset>

      <fieldset className="min-w-0">
        <SectionTitle>Custom image</SectionTitle>
        {isCustomImage ? (
          <div className="mb-2 h-20 rounded-card ring-2 ring-brand ring-offset-2" style={{ background: boardBackground(current) }} aria-label="Current custom image" role="img" />
        ) : null}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={onUpload} tabIndex={-1} />
        <Button fullWidth variant="secondary" icon={<Upload size={14} />} loading={uploading} onClick={() => fileRef.current?.click()}>
          Upload an image
        </Button>
        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!urlValid) return;
            void setColor(`url:${imageUrl.trim()}`).then((ok) => ok && setImageUrl(""));
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Link2 size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/photo.jpg" aria-label="Image URL" style={{ paddingLeft: 30 }} />
          </div>
          <Button size="sm" type="submit" variant="secondary" icon={<ImagePlus size={14} />} disabled={!urlValid}>
            Use
          </Button>
        </form>
        <p className="mt-1.5 text-body-sm text-ink-muted">Uploads are resized to 1920px and saved with the board.</p>
      </fieldset>
    </div>
  );
}
