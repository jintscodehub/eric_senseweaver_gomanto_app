"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NodeTypeKey } from "@/lib/types";

type TypePickerProps = {
  value: NodeTypeKey;
  options: NodeTypeKey[];
  disabled?: (type: NodeTypeKey) => boolean;
  onChange: (type: NodeTypeKey) => void;
  onCreate: (type: NodeTypeKey) => void;
};

export function TypePicker({
  value,
  options,
  disabled,
  onChange,
  onCreate,
}: TypePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openUpward, setOpenUpward] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((t) =>
    t.toLowerCase().includes(query.toLowerCase())
  );

  const existsExact = options.some(
    (t) => t.toLowerCase() === query.toLowerCase()
  );

  const hasQuery = query.trim().length > 0;
  const hasMatches = filtered.length > 0;
  const canCreate =
    hasQuery && !existsExact && !disabled?.(query as NodeTypeKey);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setOpenUpward(rect.bottom > window.innerHeight * 0.7);
          }
          setOpen((v) => !v);
        }}
      >
        {value}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {open && (
        <div
          className={cn(
            "absolute z-50",
            openUpward ? "bottom-full mb-2" : "top-full mt-2",
            "w-full rounded-md border bg-popover shadow-md max-h-64 overflow-auto"
          )}
        >
          <div className="flex gap-2 p-2 border-b">
            <Input
              autoFocus
              placeholder="Search or create type..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8"
            />
            {/* {query && !existsExact && !disabled?.(query as NodeTypeKey) && (
              <button
                type="button"
                className="w-[40%] px-3 py-2 text-left text-sm flex items-center gap-2 bg-muted"
                onClick={() => {
                  onCreate(query as NodeTypeKey);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <Plus className="h-4 w-4" />
                Create “{query}”
              </button>
            )} */}
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filtered.map((opt) => {
              const isDisabled = disabled?.(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(opt);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {opt}
                </button>
              );
            })}

            {!hasMatches && canCreate && (
              <div className="px-3 py-2 text-sm text-muted-foreground space-y-2">
                <div>
                  No node type matches the entered value, add as a new type
                  instead.
                </div>

                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 rounded-md bg-muted hover:bg-muted/80 text-foreground"
                  onClick={() => {
                    onCreate(query as NodeTypeKey);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add “{query}”
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
