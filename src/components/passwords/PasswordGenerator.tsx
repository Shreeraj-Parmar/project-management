"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Wand2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Popover, PopoverFooter, PopoverSection } from "@/components/ui/Popover";
import { StrengthMeter } from "./StrengthMeter";
import { usePersistedState } from "./usePersistedState";
import { clampLength, DEFAULT_GENERATOR, generatePassword, MAX_LENGTH, MIN_LENGTH, type GeneratorOptions } from "./password-utils";

const KEYS = ["upper", "lower", "digits", "symbols"] as const;
type ClassKey = (typeof KEYS)[number];

const CLASS_LABEL: Record<ClassKey, { label: string; sample: string }> = {
  upper: { label: "Uppercase", sample: "A-Z" },
  lower: { label: "Lowercase", sample: "a-z" },
  digits: { label: "Numbers", sample: "0-9" },
  symbols: { label: "Symbols", sample: "!@#" },
};

function isGeneratorOptions(v: unknown): v is GeneratorOptions {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.length === "number" && KEYS.every((k) => typeof o[k] === "boolean") && KEYS.some((k) => o[k] === true);
}

/**
 * "Generate" button that opens a compact generator popover (length 8 to 64, four character classes,
 * live strength bar). "Use password" hands the candidate to the form. The candidate only ever lives in
 * this component's state and in the form field it is handed to.
 */
export function PasswordGenerator({ onUse, disabled }: { onUse: (password: string) => void; disabled?: boolean }) {
  return (
    <Popover
      title="Generate password"
      width={320}
      placement="bottom-end"
      // Popover pins z-index 400 inline, which sits under the modal (500). Important utility wins over the inline style.
      className="z-[600]!"
      triggerClassName="w-full sm:w-auto"
      trigger={
        <Button type="button" variant="secondary" size="lg" icon={<Wand2 size={16} />} disabled={disabled} className="w-full sm:w-auto">
          Generate
        </Button>
      }
    >
      {({ close }) => (
        <GeneratorBody
          onCancel={close}
          onUse={(pw) => {
            onUse(pw);
            close();
          }}
        />
      )}
    </Popover>
  );
}

function GeneratorBody({ onUse, onCancel }: { onUse: (password: string) => void; onCancel: () => void }) {
  const [stored, setOpts] = usePersistedState<GeneratorOptions>("devboard.passwordGenerator", DEFAULT_GENERATOR, isGeneratorOptions);
  const opts = { ...stored, length: clampLength(stored.length) };
  const [nonce, setNonce] = useState(0);
  const [preview, setPreview] = useState(() => generatePassword(DEFAULT_GENERATOR));

  // Any change of settings, and the refresh button, produces a new candidate.
  useEffect(() => {
    setPreview(generatePassword(opts));
    // opts is derived from `stored`; depending on its primitives keeps this from looping
  }, [stored.length, stored.upper, stored.lower, stored.digits, stored.symbols, nonce]);

  const enabled = KEYS.filter((k) => opts[k]).length;

  return (
    <>
      <PopoverSection first>
        <div className="flex items-start gap-1 rounded-control border border-line bg-surface p-2">
          <code data-testid="generated-password" className="mono min-w-0 flex-1 select-all break-all py-0.5 text-body text-ink">
            {preview}
          </code>
          <IconButton size="sm" title="Generate another" onClick={() => setNonce((n) => n + 1)}>
            <RefreshCw size={14} />
          </IconButton>
        </div>
        <StrengthMeter value={preview} hint={false} />
      </PopoverSection>

      <PopoverSection title="Length">
        <div className="flex items-center gap-3">
          <input
            type="range"
            aria-label="Password length"
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={opts.length}
            onChange={(e) => setOpts({ ...opts, length: clampLength(Number(e.target.value)) })}
            className="h-2 min-w-0 flex-1 cursor-pointer accent-brand"
          />
          <span className="w-8 text-right text-body font-semibold tabular-nums text-ink" aria-hidden>
            {opts.length}
          </span>
        </div>
      </PopoverSection>

      <PopoverSection title="Include">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {KEYS.map((k) => (
            <Checkbox
              key={k}
              checked={opts[k]}
              disabled={opts[k] && enabled === 1}
              onCheckedChange={(c) => setOpts({ ...opts, [k]: c })}
              label={
                <>
                  {CLASS_LABEL[k].label} <span className="text-ink-muted">{CLASS_LABEL[k].sample}</span>
                </>
              }
            />
          ))}
        </div>
      </PopoverSection>

      <PopoverFooter>
        <Button type="button" variant="subtle" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" data-autofocus onClick={() => onUse(preview)}>
          Use password
        </Button>
      </PopoverFooter>
    </>
  );
}
