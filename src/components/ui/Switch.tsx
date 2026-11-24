"use client";

import React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  name?: string;
  className?: string;
}

export default function Switch({
  checked,
  onChange,
  disabled = false,
  id,
  ariaLabel,
  name,
  className = "",
}: SwitchProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      id={id}
      name={name}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-40 select-none ${
        checked
          ? "bg-accent shadow-[0_0_14px_rgba(212,248,45,0.45)] border border-accent/70"
          : "bg-surface border border-border hover:border-muted/60"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow-md transition-transform duration-200 ease-in-out ${
          checked
            ? "translate-x-5 bg-black shadow-black/40"
            : "translate-x-0 bg-muted/60 shadow-black/30"
        }`}
      />
    </button>
  );
}
