"use client"

import { useState } from 'react'
import { useLandingTheme } from '../lib/useLandingTheme'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Book, Code, Shield, Video, FileText, Users, ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { Input } from '../components/ui/input'

const docSections = [
  {
    title: 'Getting Started',
    icon: Book,
    color: 'blue',
    links: [
      { title: 'Quick Start Guide', url: '/docs/quick-start', description: '5-minute setup' },
      { title: 'Platform Overview', url: '/docs/overview', description: 'Understand DocuLume' },
      { title: 'Video Tutorials', url: '/docs/videos', description: 'Watch and learn' },
    ]
  },
  {
    title: 'User Guide',
    icon: Users,
    color: 'green',
    links: [
      { title: 'Uploading Documents', url: '/docs/user/upload', description: 'Add your files' },
      { title: 'Asking Questions', url: '/docs/user/chat', description: 'Chat with your docs' },
      { title: 'Managing Conversations', url: '/docs/user/conversations', description: 'Organize chats' },
      { title: 'Platform Help (DocuBot)', url: '/docs/user/help', description: 'Get instant help' },
      { title: 'FAQs', url: '/docs/user/faqs', description: 'Common questions' },
    ]
  },
  {
    title: 'Developer Guide',
    icon: Code,
    color: 'purple',
    links: [
      { title: 'API Reference', url: '/docs/api', description: 'Complete API docs' },
      { title: 'LLM Configuration', url: '/docs/dev/llm-config', description: 'Setup any LLM' },
      { title: 'Local LLM Integration', url: '/docs/dev/local-llm', description: 'Ollama, LM Studio' },
      { title: 'Authentication', url: '/docs/dev/auth', description: 'JWT & OAuth2' },
      { title: 'Self-Hosting', url: '/docs/dev/self-host', description: 'Deploy yourself' },
      { title: 'Architecture', url: '/docs/dev/architecture', description: 'System design' },
    ]
  },
  {
    title: 'Admin Guide',
    icon: Shield,
    color: 'orange',
    links: [
      { title: 'Document Management', url: '/docs/admin/documents', description: 'Manage all docs' },
      { title: 'User Management', url: '/docs/admin/users', description: 'Control access' },
      { title: 'Security Configuration', url: '/docs/admin/security', description: 'Secure your instance' },
      { title: 'Monitoring & Analytics', url: '/docs/admin/monitoring', description: 'Track usage' },
    ]
  },
]

const quickLinks = [
  { title: 'Quick Start', icon: ArrowRight, url: '/docs/quick-start' },
  { title: 'API Docs', icon: Code, url: '/docs/api' },
  { title: 'Video Tutorials', icon: Video, url: '/docs/videos' },
  { title: 'LLM Setup', icon: FileText, url: '/docs/dev/llm-config' },
]

const colorClasses = {
  blue: { light: 'bg-blue-50 text-blue-700', dark: 'bg-blue-500/10 text-blue-400' },
  green: { light: 'bg-green-50 text-green-700', dark: 'bg-green-500/10 text-green-400' },
  purple: { light: 'bg-purple-50 text-purple-700', dark: 'bg-purple-500/10 text-purple-400' },
  orange: { light: 'bg-orange-50 text-orange-700', dark: 'bg-orange-500/10 text-orange-400' },
}

export default function DocsPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <main className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <SiteHeader
        isDark={isDark}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        appUrl={appUrl}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Documentation
            </h1>
            <p className={`mt-6 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Everything you need to get started with DocuLume
            </p>

            {/* Search */}
            <div className="mx-auto mt-8 max-w-2xl">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 size-5 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <Input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : ''}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className={`py-8 ${isDark ? 'bg-slate-900/30' : 'bg-white'}`}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 md:grid-cols-4">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.title} href={link.url}>
                  <Card className={`transition-all hover:shadow-lg ${isDark ? 'border-slate-800 bg-slate-900 hover:border-blue-700' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={`flex size-10 items-center justify-center rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                        <Icon className="size-5" />
                      </div>
                      <span className="font-semibold">{link.title}</span>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8">
            {docSections.map((section) => {
              const Icon = section.icon
              const colors = colorClasses[section.color as keyof typeof colorClasses]

              return (
                <Card key={section.title} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`flex size-12 items-center justify-center rounded-xl ${isDark ? colors.dark : colors.light}`}>
                        <Icon className="size-6" />
                      </div>
                      <CardTitle className="text-2xl">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {section.links.map((link) => (
                        <Link key={link.title} href={link.url}>
                          <div className={`group rounded-lg border p-4 transition-all hover:shadow-md ${
                            isDark ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                  {link.title}
                                </h3>
                                <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {link.description}
                                </p>
                              </div>
                              <ArrowRight className={`size-4 shrink-0 transition-transform group-hover:translate-x-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className={`py-16 ${isDark ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-semibold">Need help?</h2>
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Can't find what you're looking for? We're here to help.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={appUrl}>
              <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
                Ask DocuBot (In-App)
              </button>
            </a>
            <Link href="/contact">
              <button className={`rounded-lg px-6 py-3 font-semibold ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
                Contact Support
              </button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
