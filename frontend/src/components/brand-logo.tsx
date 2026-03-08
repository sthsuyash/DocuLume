import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  textClassName?: string;
  showText?: boolean;
};

export function BrandLogo({ className, textClassName, showText = true }: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" aria-hidden="true" className="size-8 shrink-0" role="img">
        <defs>
          <linearGradient id="doculume-gradient-frontend" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#doculume-gradient-frontend)" />
        <path
          d="M12 13.5a2.5 2.5 0 0 1 2.5-2.5h7.2a8.8 8.8 0 0 1 0 17.6h-7.2A2.5 2.5 0 0 1 12 26.1z"
          fill="white"
          opacity="0.95"
        />
        <circle cx="21.3" cy="19.8" r="2.5" fill="#7c3aed" />
        <path d="M24.2 22.4h3.3a2.1 2.1 0 0 0 0-4.2h-3.3z" fill="white" opacity="0.95" />
      </svg>
      {showText && <span className={cn("text-lg font-semibold tracking-tight", textClassName)}>DocuLume</span>}
    </div>
  );
}
