"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{label}</p>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${checked ? "bg-primary" : "bg-input"}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform
          ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
