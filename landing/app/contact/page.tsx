"use client"

import Link from 'next/link'
import { Mail, MessageSquare, ShieldAlert } from 'lucide-react'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { useTheme } from '@/lib/useTheme'
import { SUPPORT_EMAIL, SALES_EMAIL, SECURITY_EMAIL } from '@/lib/config'

export default function ContactPage() {
  const { isDark, toggle } = useTheme()

  return (
    <main className="min-h-screen transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />

      <section className="mx-auto max-w-4xl px-6 py-10 md:py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Contact DocuLume</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Need help with onboarding, pricing, API usage, or security? Reach us through the channels below.
        </p>

        <div className="mt-8 space-y-8">
          <div>
            <h2 className="mb-2 inline-flex items-center gap-2 text-lg font-semibold">
              <Mail className="size-4" /> Support
            </h2>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">Product help and technical questions.</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              {SUPPORT_EMAIL}
            </a>
          </div>

          <div>
            <h2 className="mb-2 inline-flex items-center gap-2 text-lg font-semibold">
              <MessageSquare className="size-4" /> Sales
            </h2>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">Plan guidance, enterprise setup, and demos.</p>
            <a href={`mailto:${SALES_EMAIL}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              {SALES_EMAIL}
            </a>
          </div>

          <div>
            <h2 className="mb-2 inline-flex items-center gap-2 text-lg font-semibold">
              <ShieldAlert className="size-4" /> Security
            </h2>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">Report vulnerabilities or urgent incidents.</p>
            <a href={`mailto:${SECURITY_EMAIL}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              {SECURITY_EMAIL}
            </a>
          </div>
        </div>

        <p className="mt-10 text-sm text-slate-600 dark:text-slate-400">
          By contacting us, you agree that we may process your message to respond and improve support quality. For more
          details, review our{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Terms of Service
          </Link>.
        </p>
      </section>

      <SiteFooter />
    </main>
  )
}
