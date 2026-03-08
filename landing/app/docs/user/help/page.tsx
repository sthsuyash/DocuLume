"use client"

import { useLandingTheme } from '../../../lib/useLandingTheme'
import { SiteHeader } from '../../../components/SiteHeader'
import { SiteFooter } from '../../../components/SiteFooter'
import { Card, CardContent } from '../../../components/ui/card'
import { ArrowLeft, Bot, MessageCircle, Sparkles, HelpCircle, Zap, Book } from 'lucide-react'
import Link from 'next/link'

export default function DocuBotHelpPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  const features = [
    {
      icon: MessageCircle,
      title: 'Instant Answers',
      description: 'Get immediate help with platform features, troubleshooting, and best practices'
    },
    {
      icon: Book,
      title: 'Knowledge Base',
      description: 'Access comprehensive information about uploads, chat, LLM configuration, API usage, and more'
    },
    {
      icon: Sparkles,
      title: 'Smart Suggestions',
      description: 'Receive contextual suggestions based on your current activity and common questions'
    },
    {
      icon: Zap,
      title: '24/7 Available',
      description: 'DocuBot is always available to help, no waiting for support hours'
    }
  ]

  const exampleQuestions = [
    {
      category: 'Getting Started',
      questions: [
        'How do I upload my first document?',
        'What file formats are supported?',
        'How do I start a conversation?'
      ]
    },
    {
      category: 'Document Upload',
      questions: [
        'Why is my PDF not processing?',
        'What is the maximum file size?',
        'How do I upload multiple files at once?'
      ]
    },
    {
      category: 'Chat & Questions',
      questions: [
        'How do I get better answers?',
        'What is RAG mode vs Direct mode?',
        'How do I view source citations?'
      ]
    },
    {
      category: 'LLM Configuration',
      questions: [
        'How do I use Ollama for local LLMs?',
        'How do I add my OpenAI API key?',
        'What LLM providers are supported?'
      ]
    },
    {
      category: 'API Usage',
      questions: [
        'How do I get an API token?',
        'What are the rate limits?',
        'How do I upload via API?'
      ]
    },
    {
      category: 'Troubleshooting',
      questions: [
        'Why am I getting rate limited?',
        'Why are my answers not accurate?',
        'How do I report a bug?'
      ]
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

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <Bot className={`size-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                DocuBot Help
              </h1>
            </div>
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Your AI-powered platform assistant
            </p>
          </div>

          {/* What is DocuBot */}
          <Card className={`mb-12 ${isDark ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">What is DocuBot?</h2>
              <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                DocuBot is your intelligent platform assistant, available 24/7 to help you with any questions about using DocuLume.
                Whether you're uploading your first document, configuring LLM providers, or troubleshooting issues, DocuBot provides
                instant, accurate answers powered by AI.
              </p>
            </CardContent>
          </Card>

          {/* How to Access */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">How to Access DocuBot</h2>
            <div className="space-y-4">
              <Card className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 size-10 rounded-full flex items-center justify-center text-lg font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>1</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">From the Main App</h3>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        Click the <strong className={isDark ? 'text-blue-400' : 'text-blue-600'}>Help</strong> icon (❓) in the top right corner of any page
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 size-10 rounded-full flex items-center justify-center text-lg font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>2</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Via API</h3>
                      <p className={`mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Access DocuBot programmatically via the Help API endpoint (requires authentication via httpOnly cookie):
                      </p>
                      <pre className={`overflow-x-auto rounded-lg p-4 text-sm ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                        <code>{`POST /api/v1/help/ask
Content-Type: application/json

{
  "question": "How do I upload a document?",
  "context": "upload" // optional
}

// JavaScript example
fetch('/api/v1/help/ask', {
  method: 'POST',
  credentials: 'include',  // Include httpOnly cookie
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "How do I upload a document?",
    context: "upload"
  })
})`}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 size-10 rounded-full flex items-center justify-center text-lg font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>3</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Keyboard Shortcut</h3>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        Press <kbd className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-300'}`}>Ctrl/Cmd + ?</kbd> from anywhere in the app
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Features</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                          <Icon className={`size-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
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
          </div>

          {/* Example Questions */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">What Can You Ask?</h2>
            <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              DocuBot can help with questions across all aspects of the platform. Here are some examples:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {exampleQuestions.map((category) => (
                <Card key={category.category} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">{category.category}</h3>
                    <ul className="space-y-2">
                      {category.questions.map((question) => (
                        <li key={question} className={`text-sm flex items-start gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          <HelpCircle className="size-4 flex-shrink-0 mt-0.5" />
                          <span>"{question}"</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <Card className={`mb-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">How DocuBot Works</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-8 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>1</div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Knowledge Base Search</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Your question is matched against our comprehensive knowledge base covering all platform features
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-8 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>2</div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">AI-Powered Response</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Using RAG (Retrieval-Augmented Generation), DocuBot generates accurate, context-aware answers
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-8 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>3</div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Related Suggestions</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Get suggestions for related topics and follow-up questions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topics Covered */}
          <Card className={`mb-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Topics Covered</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                DocuBot has in-depth knowledge about:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-2">📤 Document Upload</h4>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>• Supported formats</li>
                    <li>• File size limits</li>
                    <li>• Processing status</li>
                    <li>• Troubleshooting uploads</li>
                  </ul>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-2">💬 Chat & Questions</h4>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>• Asking effective questions</li>
                    <li>• Understanding sources</li>
                    <li>• RAG vs Direct mode</li>
                    <li>• Conversation management</li>
                  </ul>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-2">🤖 LLM Configuration</h4>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>• Adding providers</li>
                    <li>• Using local LLMs (Ollama)</li>
                    <li>• API key management</li>
                    <li>• Provider comparison</li>
                  </ul>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-2">🔌 API Usage</h4>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>• Authentication</li>
                    <li>• API endpoints</li>
                    <li>• Rate limits</li>
                    <li>• Error handling</li>
                  </ul>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-2">🔒 Security</h4>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>• Data encryption</li>
                    <li>• Access control</li>
                    <li>• Compliance</li>
                    <li>• Best practices</li>
                  </ul>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-2">🛠️ Troubleshooting</h4>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>• Common errors</li>
                    <li>• Performance issues</li>
                    <li>• Debug tips</li>
                    <li>• Getting support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className={`mb-12 ${isDark ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Tips for Using DocuBot</h2>
              <ul className={`space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Be specific:</strong> "How do I configure Ollama?" is better than "Help with LLMs"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Include context:</strong> Mention what you're trying to do and what's not working</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Follow suggestions:</strong> DocuBot provides related topics that might help</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Try different phrasings:</strong> If you don't get the answer you need, rephrase your question</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* When DocuBot Can't Help */}
          <Card className={`mb-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">When DocuBot Can't Help</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                If DocuBot can't answer your question, you have these options:
              </p>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-1">📖 Browse Documentation</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Check our <Link href="/docs" className="text-blue-500 hover:underline">comprehensive documentation</Link> for detailed guides
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-1">💬 Contact Support</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Reach out to our support team via email or live chat for personalized help
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-1">👥 Community Forum</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Join our community to ask questions and share knowledge with other users
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Try DocuBot Now */}
          <Card className={`${isDark ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-6 text-center">
              <Bot className={`size-12 mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className="text-lg font-semibold mb-2">Ready to try DocuBot?</h3>
              <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Log in to your account and click the Help icon to start chatting with DocuBot!
              </p>
              <a href={appUrl} className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Go to App
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
