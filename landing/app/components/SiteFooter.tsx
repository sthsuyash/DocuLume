import { Github, Linkedin } from 'lucide-react'

import { BrandLogo } from './BrandLogo'

type SiteFooterProps = {
  isDark: boolean
}

export function SiteFooter({ isDark }: SiteFooterProps) {
  const footerLinkClass = isDark
    ? 'text-slate-400 transition-colors duration-200 hover:text-slate-200'
    : 'text-slate-600 transition-colors duration-200 hover:text-slate-900'

  return (
    <footer className={`border-t ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
      <div className="mx-auto max-w-6xl px-6 pb-7 pt-10">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6">
            <BrandLogo textClassName={isDark ? 'text-slate-100' : 'text-slate-900'} />
            <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              AI-powered document intelligence platform for teams that move fast and need answers they can trust.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com"
                aria-label="GitHub"
                className={`rounded-md border p-2 transition-colors ${
                  isDark
                    ? 'border-slate-700 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Github className="size-4" />
              </a>
              <a
                href="https://linkedin.com"
                aria-label="LinkedIn"
                className={`rounded-md border p-2 transition-colors ${
                  isDark
                    ? 'border-slate-700 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Linkedin className="size-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className={`mb-4 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Product</p>
            <div className="flex flex-col gap-3 text-sm">
              <a href="/features" className={footerLinkClass}>
                Features
              </a>
              <a href="/solutions" className={footerLinkClass}>
                Solutions
              </a>
              <a href="/pricing" className={footerLinkClass}>
                Pricing
              </a>
              <a href="/demo" className={footerLinkClass}>
                Demo
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className={`mb-4 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Company</p>
            <div className="flex flex-col gap-3 text-sm">
              <a href="/customers" className={footerLinkClass}>
                Customers
              </a>
              <a href="/security" className={footerLinkClass}>
                Security
              </a>
              <a href="/contact" className={footerLinkClass}>
                Contact
              </a>
              <a href="/faq" className={footerLinkClass}>
                FAQ
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className={`mb-4 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Legal</p>
            <div className="flex flex-col gap-3 text-sm">
              <a href="/privacy" className={footerLinkClass}>
                Privacy
              </a>
              <a href="/terms" className={footerLinkClass}>
                Terms
              </a>
            </div>
          </div>
        </div>

        <div
          className={`mt-10 flex flex-col gap-2 border-t pt-5 text-sm md:flex-row md:items-center md:justify-between ${
            isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
          }`}
        >
          <span>© 2026 DocuLume. All rights reserved.</span>
          <span>Built for high-trust AI document workflows.</span>
        </div>
      </div>
    </footer>
  )
}
