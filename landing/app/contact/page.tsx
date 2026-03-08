"use client"

import Link from 'next/link'
import { Mail, MessageSquare, ShieldAlert } from 'lucide-react'

import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { useLandingTheme } from '../lib/useLandingTheme'

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@doculume.com'
const salesEmail = process.env.NEXT_PUBLIC_SALES_EMAIL ?? 'sales@doculume.com'
const securityEmail = process.env.NEXT_PUBLIC_SECURITY_EMAIL ?? 'security@doculume.com'

export default function ContactPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()
  const muted = isDark ? 'text-slate-400' : 'text-slate-600'

  return (
    <main className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <SiteHeader
        isDark={isDark}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        appUrl={appUrl}
      />

      <section className="mx-auto max-w-4xl px-6 py-10 md:py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Contact DocuLume</h1>
        <p className={`mt-3 text-sm ${muted}`}>Need help with onboarding, pricing, API usage, or security? Reach us through the channels below.</p>

        <div className="mt-8 space-y-8">
          <div>
            <h2 className="mb-2 inline-flex items-center gap-2 text-lg font-semibold"><Mail className="size-4" /> Support</h2>
            <p className={`mb-2 text-sm ${muted}`}>Product help and technical questions.</p>
            <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">{supportEmail}</a>
          </div>

          <div>
            <h2 className="mb-2 inline-flex items-center gap-2 text-lg font-semibold"><MessageSquare className="size-4" /> Sales</h2>
            <p className={`mb-2 text-sm ${muted}`}>Plan guidance, enterprise setup, and demos.</p>
            <a href={`mailto:${salesEmail}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">{salesEmail}</a>
          </div>

          <div>
            <h2 className="mb-2 inline-flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="size-4" /> Security</h2>
            <p className={`mb-2 text-sm ${muted}`}>Report vulnerabilities or urgent incidents.</p>
            <a href={`mailto:${securityEmail}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">{securityEmail}</a>
          </div>
        </div>

        <p className={`mt-10 text-sm ${muted}`}>
          By contacting us, you agree that we may process your message to respond and improve support quality. For more
          details, review our{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Privacy Policy</Link>{' '}
          and{' '}
          <Link href="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Terms of Service</Link>.
        </p>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
