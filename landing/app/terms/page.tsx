"use client"

import Link from 'next/link'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { useTheme } from '@/lib/useTheme'

const effectiveDate = 'March 1, 2026'

export default function TermsPage() {
  const { isDark, toggle } = useTheme()

  return (
    <main className="min-h-screen transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />

      <section className="mx-auto max-w-4xl px-6 py-10 md:py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          These terms govern your use of DocuLume, including our website, APIs, and AI document chat services.
        </p>
        <p className="mt-4 mb-8 text-sm text-slate-600 dark:text-slate-400">Effective date: {effectiveDate}</p>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">1) Using the service</h2>
          <p className="text-slate-700 dark:text-slate-300">
            You agree to use DocuLume lawfully and only for authorized business or personal workflows. You are
            responsible for activity performed through your account credentials.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">2) Uploaded content and responsibility</h2>
          <p className="text-slate-700 dark:text-slate-300">
            You retain rights to your uploaded documents and prompts. You confirm you have lawful rights to upload and
            process that content and that it does not violate any third-party rights or applicable law.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">3) Acceptable use</h2>
          <ul className="list-disc space-y-1 pl-6 text-slate-700 dark:text-slate-300">
            <li>No abuse, reverse engineering, or unauthorized access attempts.</li>
            <li>No use that violates laws, regulations, or third-party rights.</li>
            <li>No submission of malware, harmful payloads, or deceptive content.</li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">4) Availability and changes</h2>
          <p className="text-slate-700 dark:text-slate-300">
            We may update, improve, or discontinue features to maintain service quality and security. We aim for high
            reliability but cannot guarantee uninterrupted availability.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">5) Billing and plans</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Paid features are subject to plan terms shown at purchase time. Fees are generally non-refundable unless
            required by law or explicitly stated otherwise.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">6) Warranty disclaimer and limitation</h2>
          <p className="text-slate-700 dark:text-slate-300">
            DocuLume is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the maximum extent permitted by law, we are
            not liable for indirect, incidental, or consequential damages from use of the service.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">7) Termination</h2>
          <p className="text-slate-700 dark:text-slate-300">
            We may suspend or terminate access for serious violations of these terms, security concerns, or legal
            obligations.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">8) Contact</h2>
          <p className="text-slate-700 dark:text-slate-300">
            For terms-related questions, use our{' '}
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              contact page
            </Link>
            .
          </p>
        </section>
      </section>

      <SiteFooter />
    </main>
  )
}
