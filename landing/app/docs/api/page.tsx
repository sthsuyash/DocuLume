"use client"

import { useLandingTheme } from '../../lib/useLandingTheme'
import { SiteHeader } from '../../components/SiteHeader'
import { SiteFooter } from '../../components/SiteFooter'
import { Card, CardContent } from '../../components/ui/card'
import { ArrowLeft, Code, Key, Upload, MessageSquare, Users, Settings } from 'lucide-react'
import Link from 'next/link'

export default function APIReferencePage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  const endpoints = [
    {
      category: 'Authentication',
      icon: Key,
      routes: [
        {
          method: 'POST',
          path: '/api/v1/auth/register',
          description: 'Register a new user account',
          requestBody: '{ "email": "user@example.com", "password": "secure_password", "full_name": "John Doe" }'
        },
        {
          method: 'POST',
          path: '/api/v1/auth/login',
          description: 'Login and set httpOnly authentication cookie',
          requestBody: '{ "email": "user@example.com", "password": "secure_password" }\n\n// Response sets httpOnly cookie automatically'
        },
        {
          method: 'POST',
          path: '/api/v1/auth/refresh',
          description: 'Refresh access token (cookie automatically updated)',
          requestBody: 'No body needed - refresh token sent via httpOnly cookie'
        }
      ]
    },
    {
      category: 'Documents',
      icon: Upload,
      routes: [
        {
          method: 'POST',
          path: '/api/v1/documents/upload',
          description: 'Upload a new document',
          requestBody: 'multipart/form-data: { "file": <file> }'
        },
        {
          method: 'GET',
          path: '/api/v1/documents/',
          description: 'List all user documents (paginated)',
          params: '?page=1&page_size=20'
        },
        {
          method: 'GET',
          path: '/api/v1/documents/{id}',
          description: 'Get document details',
          params: 'id: Document ID'
        },
        {
          method: 'DELETE',
          path: '/api/v1/documents/{id}',
          description: 'Delete a document',
          params: 'id: Document ID'
        }
      ]
    },
    {
      category: 'Chat',
      icon: MessageSquare,
      routes: [
        {
          method: 'POST',
          path: '/api/v1/chat/ask',
          description: 'Ask a question (with or without RAG)',
          requestBody: '{ "question": "What is this about?", "conversation_id": 1, "use_rag": true, "top_k": 5 }'
        },
        {
          method: 'GET',
          path: '/api/v1/chat/conversations',
          description: 'List all conversations (paginated)',
          params: '?page=1&page_size=20'
        },
        {
          method: 'GET',
          path: '/api/v1/chat/conversations/{id}',
          description: 'Get conversation with messages',
          params: 'id: Conversation ID'
        },
        {
          method: 'DELETE',
          path: '/api/v1/chat/conversations/{id}',
          description: 'Delete a conversation',
          params: 'id: Conversation ID'
        },
        {
          method: 'GET',
          path: '/api/v1/chat/conversations/{id}/export',
          description: 'Export conversation to JSON or PDF',
          params: 'id: Conversation ID, format: json|pdf'
        }
      ]
    },
    {
      category: 'LLM Settings',
      icon: Settings,
      routes: [
        {
          method: 'GET',
          path: '/api/v1/settings/llm',
          description: 'Get user LLM configuration',
          requestBody: null
        },
        {
          method: 'POST',
          path: '/api/v1/settings/llm/provider',
          description: 'Add or update LLM provider',
          requestBody: '{ "provider_name": "ollama", "config": { "type": "ollama", "base_url": "http://localhost:11434/v1", "model": "llama2" } }'
        },
        {
          method: 'DELETE',
          path: '/api/v1/settings/llm/provider/{name}',
          description: 'Delete LLM provider',
          params: 'name: Provider name'
        },
        {
          method: 'POST',
          path: '/api/v1/settings/llm/test',
          description: 'Test LLM provider connection',
          requestBody: '{ "provider_name": "test", "config": {...} }'
        }
      ]
    },
    {
      category: 'Users',
      icon: Users,
      routes: [
        {
          method: 'GET',
          path: '/api/v1/users/me',
          description: 'Get current user profile',
          requestBody: null
        },
        {
          method: 'PATCH',
          path: '/api/v1/users/me',
          description: 'Update user profile',
          requestBody: '{ "full_name": "New Name", "email": "newemail@example.com" }'
        }
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
        <div className="mx-auto max-w-5xl px-6">
          <Link href="/docs" className={`mb-6 inline-flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl flex items-center gap-3">
              <Code className="size-10" />
              API Reference
            </h1>
            <p className={`mt-4 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Complete REST API documentation for DocuLume
            </p>
          </div>

          {/* Base URL */}
          <Card className={`mb-12 ${isDark ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Base URL</h2>
              <code className={`block p-3 rounded-lg ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-white text-slate-800'}`}>
                https://api.doculume.com
              </code>
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                All API requests should be made to this base URL with the appropriate endpoint path.
              </p>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card className={`mb-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                DocuLume uses JWT (JSON Web Tokens) stored in <strong>httpOnly cookies</strong> for secure authentication.
                Cookies are automatically included in requests - no manual headers needed!
              </p>

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Login to Get Cookie</h3>
                <pre className={`overflow-x-auto rounded-lg p-4 text-sm ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                  <code>{`curl -X POST https://api.doculume.com/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'

# Cookie is automatically set in response (httpOnly, secure)`}</code>
                </pre>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Making Authenticated Requests</h3>
                <pre className={`overflow-x-auto rounded-lg p-4 text-sm ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                  <code>{`# Cookie is automatically sent with subsequent requests
curl -X GET https://api.doculume.com/api/v1/documents/ \\
  -b cookies.txt

# Or in browser/JavaScript - cookies sent automatically:
fetch('/api/v1/documents/', {
  credentials: 'include'  // Important: include cookies
})`}</code>
                </pre>
              </div>

              <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <strong>🔒 Security Note:</strong> httpOnly cookies cannot be accessed by JavaScript,
                  protecting against XSS attacks. Cookies are also marked as secure and sameSite for additional protection.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card className={`mb-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Rate Limits</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-1">Free Tier</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">60</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>requests/minute</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-1">Pro Tier</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">300</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>requests/minute</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h4 className="font-semibold mb-1">Enterprise</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Custom</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>negotiable limits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <div className="space-y-8">
            {endpoints.map((category) => {
              const Icon = category.icon
              return (
                <div key={category.category}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                      <Icon className={`size-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <h2 className="text-2xl font-semibold">{category.category}</h2>
                  </div>

                  <div className="space-y-4">
                    {category.routes.map((route, index) => (
                      <Card key={index} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-3">
                            <span className={`px-3 py-1 rounded font-mono text-sm font-bold ${
                              route.method === 'GET' ? 'bg-blue-600 text-white' :
                              route.method === 'POST' ? 'bg-green-600 text-white' :
                              route.method === 'PATCH' ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {route.method}
                            </span>
                            <code className={`flex-1 font-mono text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {route.path}
                            </code>
                          </div>

                          <p className={`mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {route.description}
                          </p>

                          {route.params && (
                            <div className="mb-3">
                              <h4 className="text-sm font-semibold mb-1">Parameters:</h4>
                              <code className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {route.params}
                              </code>
                            </div>
                          )}

                          {route.requestBody && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Request Body:</h4>
                              <pre className={`overflow-x-auto rounded-lg p-3 text-xs ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                                <code>{route.requestBody}</code>
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Error Codes */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">HTTP Status Codes</h2>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 rounded bg-green-600 text-white text-sm font-mono">200</code>
                  <span>Success - Request completed successfully</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 rounded bg-green-600 text-white text-sm font-mono">201</code>
                  <span>Created - Resource created successfully</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 rounded bg-orange-600 text-white text-sm font-mono">400</code>
                  <span>Bad Request - Invalid request parameters</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 rounded bg-orange-600 text-white text-sm font-mono">401</code>
                  <span>Unauthorized - Missing or invalid authentication token</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 rounded bg-orange-600 text-white text-sm font-mono">404</code>
                  <span>Not Found - Resource not found</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 rounded bg-orange-600 text-white text-sm font-mono">429</code>
                  <span>Too Many Requests - Rate limit exceeded</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="px-2 py-1 rounded bg-red-600 text-white text-sm font-mono">500</code>
                  <span>Internal Server Error - Server error occurred</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SDKs */}
          <Card className={`mt-12 ${isDark ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">SDKs & Code Examples</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                We provide official SDKs and code examples to make integration easier:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                  <h4 className="font-semibold mb-2">🐍 Python</h4>
                  <code className="text-sm">pip install doculume-sdk</code>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                  <h4 className="font-semibold mb-2">📦 JavaScript/TypeScript</h4>
                  <code className="text-sm">npm install doculume-js</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
