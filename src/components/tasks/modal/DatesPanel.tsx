"use client";

import { useState } from "react";
import { toDateInput } from "@/lib/client";
import { Button, Field, Input } from "@/components/ui";
import { dateInputFromToday } from "./meta";

function isValidDay(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const y = Number(v.slice(0, 4));
  return y >= 1970 && y <= 2100 && !Number.isNaN(new Date(v).getTime());
}

/**
 * Dates popover body. Nothing is applied until Save: a native date input emits intermediate values
 * while the year is being typed, and those must never reach the API.
 */
export function DatesPanel({ dueDate, onSave, onRemove }: { dueDate: string | null; onSave: (iso: string) => void; onRemove: () => void }) {
  const [value, setValue] = useState(toDateInput(dueDate));
  const [touched, setTouched] = useState(false);
  const valid = isValidDay(value);
  const showError = touched && value !== "" && !valid;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) onSave(new Date(value).toISOString());
      }}
    >
      <Field label="Due date" error={showError ? "Enter a valid date." : undefined}>
        <Input type="date" size="sm" value={value} onChange={(e) => setValue(e.target.value)} onBlur={() => setTouched(true)} />
      </Field>
      <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Quick dates">
        {[
          { label: "Today", d: 0 },
          { label: "Tomorrow", d: 1 },
          { label: "Next week", d: 7 },
        ].map((q) => (
          <Button key={q.label} type="button" variant="secondary" size="sm" onClick={() => setValue(dateInputFromToday(q.d))}>
            {q.label}
          </Button>
        ))}
      </div>
      <Button type="submit" fullWidth className="mt-4" disabled={!valid}>
        Save
      </Button>
      {dueDate ? (
        <Button type="button" variant="secondary" fullWidth className="mt-2" onClick={onRemove}>
          Remove
        </Button>
      ) : null}
    </form>
  );
}
