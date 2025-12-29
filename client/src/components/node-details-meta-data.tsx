"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export type NodeDetailsValueType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date";

export type NodeDetailsEntry = {
  key: string;
  value: string | number | boolean;
  type: NodeDetailsValueType;
};

type Props = {
  value: NodeDetailsEntry[];
  onChange: (next: NodeDetailsEntry[]) => void;
};

export function NodeDetailsMetadataEditor({ value, onChange }: Props) {
  const [open, setOpen] = useState(true);

  const duplicateKeys = useMemo(() => {
    const keys = value.map((v) => v.key.trim()).filter(Boolean);
    return keys.filter((k, i) => keys.indexOf(k) !== i);
  }, [value]);

  function update(index: number, patch: Partial<NodeDetailsEntry>) {
    const next = [...value];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([...value, { key: "", value: "", type: "text" }]);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-md border">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
      >
        Add More Details (e.g website, founded, etc.):
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="space-y-2 p-3 pt-1">
          {value.map((entry, i) => {
            const isDuplicate = duplicateKeys.includes(entry.key.trim());

            return (
              <div
                key={i}
                className={cn(
                  "grid gap-2 rounded-md border p-2",
                  isDuplicate && "border-destructive"
                )}
              >
                <div className="flex gap-2">
                  <Input
                    placeholder="Key (e.g. author)"
                    value={entry.key}
                    onChange={(e) => update(i, { key: e.target.value })}
                  />

                  <Select
                    value={entry.type}
                    onValueChange={(v) =>
                      update(i, { type: v as NodeDetailsValueType, value: "" })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button size="icon" variant="ghost" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Value input */}
                {entry.type === "text" && (
                  <Input
                    placeholder="Value"
                    value={entry.value as string}
                    onChange={(e) => update(i, { value: e.target.value })}
                  />
                )}

                {entry.type === "textarea" && (
                  <textarea
                    className="min-h-[80px] rounded-md border p-2 text-sm"
                    value={entry.value as string}
                    onChange={(e) => update(i, { value: e.target.value })}
                  />
                )}

                {entry.type === "number" && (
                  <Input
                    type="number"
                    value={entry.value as number | ""}
                    onChange={(e) =>
                      update(i, {
                        value:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                )}

                {entry.type === "date" && (
                  <Input
                    type="date"
                    value={entry.value as string}
                    onChange={(e) => update(i, { value: e.target.value })}
                  />
                )}

                {entry.type === "boolean" && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(entry.value)}
                      onCheckedChange={(v) => update(i, { value: v })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {entry.value ? "True" : "False"}
                    </span>
                  </div>
                )}

                {isDuplicate && (
                  <p className="text-xs text-destructive">Duplicate key</p>
                )}
              </div>
            );
          })}

          <Button size="sm" variant="outline" onClick={add} className="w-fit">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
