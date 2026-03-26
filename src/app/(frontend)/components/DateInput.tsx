"use client";

import { useState, useEffect } from "react";

function maskDate(val: string): string {
  const d = val.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function toISO(display: string): string {
  const parts = display.split("/");
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return "";
}

function toDisplay(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return "";
}

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export function DateInput({ value, onChange, className, placeholder = "DD/MM/AAAA", required }: DateInputProps) {
  const [display, setDisplay] = useState(toDisplay(value));

  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      required={required}
      onChange={(e) => {
        const masked = maskDate(e.target.value);
        setDisplay(masked);
        if (masked === "") {
          onChange("");
        } else {
          const iso = toISO(masked);
          if (iso) onChange(iso);
        }
      }}
      className={className}
    />
  );
}
