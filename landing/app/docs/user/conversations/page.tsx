"use client"

import { useLandingTheme } from '../../../lib/useLandingTheme'
import { SiteHeader } from '../../../components/SiteHeader'
import { SiteFooter } from '../../../components/SiteFooter'
import { Card, CardContent } from '../../../components/ui/card'
import { ArrowLeft, MessageSquare, Star, Download, Share2, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'

export default function ConversationsPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  const features = [
    {
      icon: MessageSquare,
      title: 'View All Conversations',
      description: 'Access all your past conversations in one place with searchable history'
    },
    {
      icon: Star,
      title: 'Star Important Chats',
      description: 'Mark important conversations for quick access later'
    },
    {
      icon: Download,
      title: 'Export Conversations',
      description: 'Download conversations as JSON or PDF for offline reference'
    },
    {
      icon: Share2,
      title: 'Share with Team',
      description: 'Share conversations with team members (Pro feature)'
    }
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

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/docs" className={`mb-6 inline-flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Managing Conversations
          </h1>
          <p className={`mt-4 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Organize, search, and export your chat history
          </p>

          {/* Features */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                        <Icon className={`size-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Viewing Conversations */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Viewing Conversations</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Access your conversations from the main navigation:
              </p>
              <ol className={`space-y-2 ml-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li>1. Click "Conversations" in the sidebar</li>
                <li>2. Browse your conversation history (sorted by most recent)</li>
                <li>3. Click any conversation to view full chat history</li>
                <li>4. Use the search bar to find specific conversations</li>
              </ol>
            </CardContent>
          </Card>

          {/* Creating Conversations */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Creating New Conversations</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Start a new conversation in several ways:
              </p>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-1">From Chat Page</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Click the "New Chat" button or press <kbd className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-slate-300'}`}>Ctrl/Cmd + N</kbd>
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-1">Automatic Creation</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Simply ask a question without selecting a conversation - a new one will be created automatically
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Managing Conversations */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Managing Conversations</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Each conversation has a menu (⋮) with these options:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Edit className={`size-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">Rename</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Change the conversation title to something descriptive
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className={`size-5 mt-0.5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">Star/Unstar</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Mark important conversations for easy access
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className={`size-5 mt-0.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">Export</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Download as JSON (for data) or PDF (for sharing)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Share2 className={`size-5 mt-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">Share <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Pro</span></h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Share with team members (requires Pro plan)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trash2 className={`size-5 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">Delete</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Permanently delete the conversation
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exporting */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Exporting Conversations</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Export conversations for offline reference or sharing:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-2">📄 JSON Format</h4>
                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Machine-readable format for data processing
                  </p>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    <li>✓ Full message history</li>
                    <li>✓ Source citations</li>
                    <li>✓ Timestamps</li>
                  </ul>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-2">📋 PDF Format</h4>
                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Formatted document for easy sharing
                  </p>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    <li>✓ Clean formatting</li>
                    <li>✓ Source links</li>
                    <li>✓ Print-ready</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Access */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">API Access</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Manage conversations programmatically via API:
              </p>
              <pre className={`overflow-x-auto rounded-lg p-4 text-sm ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                <code>{`# List conversations (authenticated via httpOnly cookie)
curl -b cookies.txt \\
  https://api.doculume.com/api/v1/chat/conversations?page=1&page_size=20

# Get specific conversation
curl -b cookies.txt \\
  https://api.doculume.com/api/v1/chat/conversations/{id}

# Delete conversation
curl -X DELETE -b cookies.txt \\
  https://api.doculume.com/api/v1/chat/conversations/{id}

# Export conversation
curl -b cookies.txt \\
  https://api.doculume.com/api/v1/chat/conversations/{id}/export?format=json`}</code>
              </pre>
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                See the <Link href="/docs/api" className="text-blue-500 hover:underline">API Reference</Link> for full documentation
              </p>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className={`mt-12 ${isDark ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Pro Tips</h2>
              <ul className={`space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Name your conversations:</strong> Descriptive titles make it easier to find what you need</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Star important chats:</strong> Quick access to frequently referenced conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Export regularly:</strong> Keep offline backups of critical conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Use search:</strong> Find conversations by keyword instead of scrolling</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
              <ul className={`space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li>• <Link href="/docs/user/chat" className="text-blue-500 hover:underline">Learn how to ask better questions</Link></li>
                <li>• <Link href="/docs/api" className="text-blue-500 hover:underline">Explore the Conversations API</Link></li>
                <li>• <Link href="/pricing" className="text-blue-500 hover:underline">Upgrade to Pro for team sharing</Link></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
