import { Menu, Moon, Sun, X } from 'lucide-react'

import { BrandLogo } from './BrandLogo'
import { Button } from './ui/button'

type SiteHeaderProps = {
  isDark: boolean
  mobileOpen: boolean
  setMobileOpen: (value: boolean) => void
  onToggleTheme: () => void
  appUrl: string
}

const navLinks = [
  { href: '/features', label: 'Features' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/customers', label: 'Customers' },
  { href: '/demo', label: 'Demo' },
]

export function SiteHeader({ isDark, mobileOpen, setMobileOpen, onToggleTheme, appUrl }: SiteHeaderProps) {
  const navbarTheme = isDark
    ? 'border-slate-800/80 bg-slate-950/70 text-slate-200'
    : 'border-slate-200/80 bg-white/80 text-slate-700'

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${navbarTheme}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" aria-label="DocuLume home">
          <BrandLogo />
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium transition-opacity hover:opacity-80">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className={isDark ? 'text-amber-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <a href={appUrl}>
            <Button>Start free</Button>
          </a>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className={`border-t px-6 pb-5 pt-3 md:hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium transition-opacity hover:opacity-80"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onToggleTheme}
                aria-label="Toggle theme"
                className={isDark ? 'text-amber-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </Button>
              <a href={appUrl} className="grow">
                <Button className="w-full">Start free</Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
