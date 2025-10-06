import { Github, Linkedin } from 'lucide-react'
import { BrandLogo } from './BrandLogo'

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 pb-7 pt-10">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6">
            <BrandLogo textClassName="text-slate-900 dark:text-slate-100" />
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              AI-powered document intelligence platform for teams that move fast and need answers they can trust.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com"
                aria-label="GitHub"
                className="rounded-md border border-slate-200 p-2 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
              >
                <Github className="size-4" />
              </a>
              <a
                href="https://linkedin.com"
                aria-label="LinkedIn"
                className="rounded-md border border-slate-200 p-2 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
              >
                <Linkedin className="size-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-200">Product</p>
            <div className="flex flex-col gap-3 text-sm">
              {['/features', '/solutions', '/pricing', '/demo'].map((href) => (
                <a key={href} href={href} className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                  {href.slice(1).charAt(0).toUpperCase() + href.slice(2)}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-200">Company</p>
            <div className="flex flex-col gap-3 text-sm">
              {['/customers', '/security', '/contact', '/faq'].map((href) => (
                <a key={href} href={href} className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                  {href.slice(1).charAt(0).toUpperCase() + href.slice(2)}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-200">Legal</p>
            <div className="flex flex-col gap-3 text-sm">
              {['/privacy', '/terms'].map((href) => (
                <a key={href} href={href} className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                  {href.slice(1).charAt(0).toUpperCase() + href.slice(2)}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-5 text-sm text-slate-500 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <span>© 2026 DocuLume. All rights reserved.</span>
          <span>Built for high-trust AI document workflows.</span>
        </div>
      </div>
    </footer>
  )
}
