"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function PageSearch({
  value,
  onChange,
  placeholder = "Type to filter this page…",
}: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        ref.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === ref.current) {
        onChange("");
        ref.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChange]);

  return (
    <div className="relative">
      <label htmlFor="page-search" className="sr-only">
        Filter page
      </label>
      <input
        ref={ref}
        id="page-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border-3 border-black bg-[#fffdf7] px-4 py-3 font-[family-name:var(--font-mono)] text-xs font-bold outline-none transition placeholder:text-[#6b645a] focus:bg-[#ffd52e] focus:shadow-[4px_4px_0_#000]"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 border-2 border-black bg-black px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-black text-white sm:inline">
        /
      </kbd>
    </div>
  );
}

export function matchesQuery(query: string, ...parts: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((p) => (p ?? "").toLowerCase().includes(q));
}
