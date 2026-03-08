"use client"

import { useLandingTheme } from '../../../lib/useLandingTheme'
import { SiteHeader } from '../../../components/SiteHeader'
import { SiteFooter } from '../../../components/SiteFooter'
import { Card, CardContent } from '../../../components/ui/card'
import { ArrowLeft, MessageSquare, Sparkles, BookOpen, Lightbulb } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  const questionTypes = [
    {
      type: 'Factual Questions',
      icon: BookOpen,
      examples: [
        '"What is the main conclusion of this research paper?"',
        '"What is the company\'s revenue for Q3 2024?"',
        '"Who are the parties involved in this contract?"'
      ],
      tip: 'Best for extracting specific information from documents'
    },
    {
      type: 'Analytical Questions',
      icon: Sparkles,
      examples: [
        '"Compare the findings across all quarterly reports"',
        '"What are the key differences between these two contracts?"',
        '"Summarize the main arguments in these papers"'
      ],
      tip: 'AI synthesizes information from multiple sources'
    },
    {
      type: 'Clarification Questions',
      icon: Lightbulb,
      examples: [
        '"Explain this technical term in simple language"',
        '"What does this clause mean in practical terms?"',
        '"Can you elaborate on the methodology used?"'
      ],
      tip: 'Get explanations in plain language'
    }
  ]

  const tips = [
    {
      title: 'Be Specific',
      description: 'Instead of "Tell me about revenue", ask "What was the total revenue in Q3 2024?"',
      good: 'What was the total revenue in Q3 2024?',
      bad: 'Tell me about revenue'
    },
    {
      title: 'Provide Context',
      description: 'Reference specific documents or sections when possible',
      good: 'What does section 5 of the employment contract say about termination?',
      bad: 'What about termination?'
    },
    {
      title: 'Ask Follow-ups',
      description: 'Conversations maintain context, so you can ask follow-up questions',
      good: 'Can you explain that in simpler terms?',
      bad: 'Start a new conversation for every question'
    },
    {
      title: 'Use Natural Language',
      description: 'Write questions as you would ask a colleague',
      good: 'How does this compare to last year?',
      bad: 'Compare data current year previous year'
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
            Asking Questions
          </h1>
          <p className={`mt-4 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Chat with your documents using natural language
          </p>

          {/* Getting Started */}
          <Card className={`mt-12 ${isDark ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <MessageSquare className="size-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-2">How to Start Chatting</h2>
                  <ol className={`space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li>1. Navigate to the Chat page</li>
                    <li>2. Start a new conversation or continue an existing one</li>
                    <li>3. Type your question in natural language</li>
                    <li>4. Hit Enter or click Send</li>
                    <li>5. Get instant answers with source citations!</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Types */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Types of Questions</h2>
            <div className="space-y-6">
              {questionTypes.map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.type} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                          <Icon className={`size-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{item.type}</h3>
                          <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.tip}</p>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold">Examples:</p>
                            {item.examples.map((example) => (
                              <div key={example} className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                <p className={`text-sm italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{example}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Tips for Better Answers */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Tips for Better Answers</h2>
            <div className="space-y-4">
              {tips.map((tip, index) => (
                <Card key={index} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">{tip.title}</h3>
                    <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{tip.description}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                        <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-green-400' : 'text-green-700'}`}>✓ Good</p>
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{tip.good}"</p>
                      </div>
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>✗ Not Ideal</p>
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{tip.bad}"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Understanding Sources */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Understanding Source Citations</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Every answer includes source citations showing where the information came from:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>1</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Document Name</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Which document the information came from</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>2</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Page/Section</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Specific location within the document</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>3</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Relevance Score</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>How relevant this source is to your question</p>
                  </div>
                </div>
              </div>
              <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  💡 Click on any source citation to view the original text in context
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RAG vs Direct Mode */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">RAG vs Direct Mode</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                  <h3 className="font-semibold mb-2">RAG Mode (Default)</h3>
                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Uses Retrieval-Augmented Generation to search your documents and provide answers based on your data.
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Best for: Questions about your documents
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
                  <h3 className="font-semibold mb-2">Direct Mode</h3>
                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Directly queries the AI without searching documents. Uses the AI's general knowledge.
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Best for: General questions, brainstorming
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Keyboard Shortcuts</h2>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <span>Send message</span>
                  <kbd className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-300'}`}>Enter</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>New line</span>
                  <kbd className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-300'}`}>Shift + Enter</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>New conversation</span>
                  <kbd className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-300'}`}>Ctrl/Cmd + N</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Focus input</span>
                  <kbd className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-300'}`}>Ctrl/Cmd + K</kbd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
              <ul className={`space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li>• <Link href="/docs/user/conversations" className="text-blue-500 hover:underline">Learn about managing conversations</Link></li>
                <li>• <Link href="/docs/dev/llm-config" className="text-blue-500 hover:underline">Configure your preferred LLM provider</Link></li>
                <li>• <Link href="/docs/user/help" className="text-blue-500 hover:underline">Get help from DocuBot</Link></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
