"use client"

import Link from 'next/link'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { useTheme } from '@/lib/useTheme'

const effectiveDate = 'March 1, 2026'

export default function PrivacyPage() {
  const { isDark, toggle } = useTheme()

  return (
    <main className="min-h-screen transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />

      <section className="mx-auto max-w-4xl px-6 py-10 md:py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          This policy explains how DocuLume handles data across document uploads, chat activity, account usage, and
          newsletter subscriptions.
        </p>
        <p className="mt-4 mb-8 text-sm text-slate-600 dark:text-slate-400">Effective date: {effectiveDate}</p>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">1) Information we collect</h2>
          <ul className="list-disc space-y-1 pl-6 text-slate-700 dark:text-slate-300">
            <li>Account information such as name, email, and authentication metadata.</li>
            <li>Content you upload, including documents and related extracted text/chunks.</li>
            <li>Conversation history and prompts used to generate AI responses.</li>
            <li>Operational data such as IP address, browser/device info, and error logs.</li>
            <li>Newsletter details if you submit your email through the landing form.</li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">2) How we use information</h2>
          <ul className="list-disc space-y-1 pl-6 text-slate-700 dark:text-slate-300">
            <li>Provide chat with documents, search/retrieval, and AI-generated answers.</li>
            <li>Secure accounts, prevent abuse, and enforce platform policies.</li>
            <li>Improve reliability, performance, and model quality of the service.</li>
            <li>Communicate product updates, support responses, and security notices.</li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">3) Data sharing</h2>
          <p className="text-slate-700 dark:text-slate-300">
            We share data only with trusted subprocessors needed to operate DocuLume (for example cloud hosting,
            database, and email providers), and only under contractual protections. We do not sell personal data.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">4) Data retention</h2>
          <p className="text-slate-700 dark:text-slate-300">
            We retain account and service data only as long as needed for product operation, legal compliance, and
            dispute resolution. You can request deletion of account-associated data by contacting us.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">5) Security</h2>
          <p className="text-slate-700 dark:text-slate-300">
            We use layered controls such as encryption in transit, access controls, and monitoring to protect data.
            No system can be guaranteed 100% secure, but we continuously improve safeguards.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-xl font-semibold">6) Your choices and rights</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Depending on your jurisdiction, you may request access, correction, deletion, or export of your personal
            data. You may also unsubscribe from newsletter emails at any time.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">7) Contact</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Questions about this policy can be sent through our{' '}
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
