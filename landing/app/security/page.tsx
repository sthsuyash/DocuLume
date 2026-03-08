"use client"

import { useLandingTheme } from '../lib/useLandingTheme'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { TrustBadges } from '../components/TrustBadges'
import { Comparison } from '../components/Comparison'
import { ArrowLeft, Shield, Lock, Eye, Database, Server, FileCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export default function SecurityPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  const securityFeatures = [
    {
      icon: Shield,
      title: 'Data Encryption',
      items: [
        'AES-256 encryption at rest',
        'TLS 1.3 for data in transit',
        'End-to-end encryption option',
        'Key management with HSM',
      ],
    },
    {
      icon: Lock,
      title: 'Access Control',
      items: [
        'Role-based access control (RBAC)',
        'Multi-factor authentication (MFA)',
        'Single sign-on (SSO) support',
        'Granular permissions',
      ],
    },
    {
      icon: Eye,
      title: 'Audit & Monitoring',
      items: [
        'Complete audit logs',
        'Real-time threat detection',
        'Anomaly detection',
        'Compliance reporting',
      ],
    },
    {
      icon: Database,
      title: 'Data Privacy',
      items: [
        'GDPR compliant',
        'CCPA compliant',
        'Data residency options',
        'Right to deletion',
      ],
    },
    {
      icon: Server,
      title: 'Infrastructure',
      items: [
        'SOC 2 Type II certified',
        'ISO 27001 certified',
        'Regular penetration testing',
        'DDoS protection',
      ],
    },
    {
      icon: FileCheck,
      title: 'Compliance',
      items: [
        'HIPAA ready',
        'PCI DSS compliant',
        'FedRAMP moderate (planned)',
        'Industry certifications',
      ],
    },
  ]

  return (
    <main className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <SiteHeader
        isDark={isDark}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        appUrl={appUrl}
      />

      <section className="relative overflow-hidden py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Link href="/" className={`mb-6 inline-flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Enterprise-grade security
            </h1>
            <p className={`mt-6 max-w-2xl text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Your data security is our top priority. DocuLume is built with multiple layers of protection to keep your documents safe.
            </p>
          </motion.div>
        </div>
      </section>

      <TrustBadges isDark={isDark} />

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card className={`h-full ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    <CardHeader>
                      <div className={`mb-3 inline-flex size-12 items-center justify-center rounded-lg ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'}`}>
                        <Icon className="size-6" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.items.map((item, i) => (
                          <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <Comparison isDark={isDark} />

      <SiteFooter isDark={isDark} />
    </main>
  )
}
