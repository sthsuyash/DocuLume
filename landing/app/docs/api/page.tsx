"use client"

import { useTheme } from '@/lib/useTheme'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Code, Key, Upload, MessageSquare, Users, Settings } from 'lucide-react'
import Link from 'next/link'

export default function APIReferencePage() {
  const { isDark, toggle } = useTheme()

  const endpoints = [
    {
      category: 'Authentication',
      icon: Key,
      routes: [
        { method: 'POST', path: '/api/v1/auth/register', description: 'Register a new user account', requestBody: '{ "email": "user@example.com", "password": "secure_password", "full_name": "John Doe" }' },
        { method: 'POST', path: '/api/v1/auth/login', description: 'Login and set httpOnly authentication cookie', requestBody: '{ "email": "user@example.com", "password": "secure_password" }\n\n// Response sets httpOnly cookie automatically' },
        { method: 'POST', path: '/api/v1/auth/refresh', description: 'Refresh access token (cookie automatically updated)', requestBody: 'No body needed - refresh token sent via httpOnly cookie' }
      ]
    },
    {
      category: 'Documents',
      icon: Upload,
      routes: [
        { method: 'POST', path: '/api/v1/documents/upload', description: 'Upload a new document', requestBody: 'multipart/form-data: { "file": <file> }' },
        { method: 'GET', path: '/api/v1/documents/', description: 'List all user documents (paginated)', params: '?page=1&page_size=20' },
        { method: 'GET', path: '/api/v1/documents/{id}', description: 'Get document details', params: 'id: Document ID' },
        { method: 'DELETE', path: '/api/v1/documents/{id}', description: 'Delete a document', params: 'id: Document ID' }
      ]
    },
    {
      category: 'Chat',
      icon: MessageSquare,
      routes: [
        { method: 'POST', path: '/api/v1/chat/ask', description: 'Ask a question (with or without RAG)', requestBody: '{ "question": "What is this about?", "conversation_id": 1, "use_rag": true, "top_k": 5 }' },
        { method: 'GET', path: '/api/v1/chat/conversations', description: 'List all conversations (paginated)', params: '?page=1&page_size=20' },
        { method: 'GET', path: '/api/v1/chat/conversations/{id}', description: 'Get conversation with messages', params: 'id: Conversation ID' },
        { method: 'DELETE', path: '/api/v1/chat/conversations/{id}', description: 'Delete a conversation', params: 'id: Conversation ID' },
        { method: 'GET', path: '/api/v1/chat/conversations/{id}/export', description: 'Export conversation to JSON or PDF', params: 'id: Conversation ID, format: json|pdf' }
      ]
    },
    {
      category: 'LLM Settings',
      icon: Settings,
      routes: [
        { method: 'GET', path: '/api/v1/settings/llm', description: 'Get user LLM configuration', requestBody: null },
        { method: 'POST', path: '/api/v1/settings/llm/provider', description: 'Add or update LLM provider', requestBody: '{ "provider_name": "ollama", "config": { "type": "ollama", "base_url": "http://localhost:11434/v1", "model": "llama2" } }' },
        { method: 'DELETE', path: '/api/v1/settings/llm/provider/{name}', description: 'Delete LLM provider', params: 'name: Provider name' },
        { method: 'POST', path: '/api/v1/settings/llm/test', description: 'Test LLM provider connection', requestBody: '{ "provider_name": "test", "config": {...} }' }
      ]
    },
    {
      category: 'Users',
      icon: Users,
      routes: [
        { method: 'GET', path: '/api/v1/users/me', description: 'Get current user profile', requestBody: null },
        { method: 'PATCH', path: '/api/v1/users/me', description: 'Update user profile', requestBody: '{ "full_name": "New Name", "email": "newemail@example.com" }' }
      ]
    }
  ]

  return (
    <main className="min-h-screen transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <Link href="/docs" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300">
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          <div className="mb-12">
            <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight md:text-5xl">
              <Code className="size-10" />
              API Reference
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Complete REST API documentation for DocuLume
            </p>
          </div>

          <Card className="mb-12 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <h2 className="mb-3 text-xl font-semibold">Base URL</h2>
              <code className="block rounded-lg bg-white p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-300">
                https://api.doculume.com
              </code>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                All API requests should be made to this base URL with the appropriate endpoint path.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-12 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-semibold">Authentication</h2>
              <p className="mb-4 text-slate-600 dark:text-slate-400">
                DocuLume uses JWT (JSON Web Tokens) stored in <strong>httpOnly cookies</strong> for secure authentication.
                Cookies are automatically included in requests - no manual headers needed!
              </p>

              <div className="mt-6">
                <h3 className="mb-2 font-semibold">Login to Get Cookie</h3>
                <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-300">
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
                <h3 className="mb-2 font-semibold">Making Authenticated Requests</h3>
                <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <code>{`# Cookie is automatically sent with subsequent requests
curl -X GET https://api.doculume.com/api/v1/documents/ \\
  -b cookies.txt

# Or in browser/JavaScript - cookies sent automatically:
fetch('/api/v1/documents/', {
  credentials: 'include'  // Important: include cookies
})`}</code>
                </pre>
              </div>

              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>🔒 Security Note:</strong> httpOnly cookies cannot be accessed by JavaScript,
                  protecting against XSS attacks. Cookies are also marked as secure and sameSite for additional protection.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-12 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-semibold">Rate Limits</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <h4 className="mb-1 font-semibold">Free Tier</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">60</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">requests/minute</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <h4 className="mb-1 font-semibold">Pro Tier</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">300</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">requests/minute</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <h4 className="mb-1 font-semibold">Enterprise</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Custom</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">negotiable limits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            {endpoints.map((category) => {
              const Icon = category.icon
              return (
                <div key={category.category}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-500/10">
                      <Icon className="size-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-semibold">{category.category}</h2>
                  </div>

                  <div className="space-y-4">
                    {category.routes.map((route, index) => (
                      <Card key={index} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <CardContent className="p-6">
                          <div className="mb-3 flex items-start gap-4">
                            <span className={`rounded px-3 py-1 font-mono text-sm font-bold text-white ${
                              route.method === 'GET' ? 'bg-blue-600' :
                              route.method === 'POST' ? 'bg-green-600' :
                              route.method === 'PATCH' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}>
                              {route.method}
                            </span>
                            <code className="flex-1 font-mono text-sm text-slate-700 dark:text-slate-300">
                              {route.path}
                            </code>
                          </div>

                          <p className="mb-3 text-slate-600 dark:text-slate-400">
                            {route.description}
                          </p>

                          {route.params && (
                            <div className="mb-3">
                              <h4 className="mb-1 text-sm font-semibold">Parameters:</h4>
                              <code className="text-sm text-slate-600 dark:text-slate-400">
                                {route.params}
                              </code>
                            </div>
                          )}

                          {route.requestBody && (
                            <div>
                              <h4 className="mb-2 text-sm font-semibold">Request Body:</h4>
                              <pre className="overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-300">
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

          <Card className="mt-12 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-semibold">HTTP Status Codes</h2>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <code className="rounded bg-green-600 px-2 py-1 font-mono text-sm text-white">200</code>
                  <span>Success - Request completed successfully</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="rounded bg-green-600 px-2 py-1 font-mono text-sm text-white">201</code>
                  <span>Created - Resource created successfully</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="rounded bg-orange-600 px-2 py-1 font-mono text-sm text-white">400</code>
                  <span>Bad Request - Invalid request parameters</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="rounded bg-orange-600 px-2 py-1 font-mono text-sm text-white">401</code>
                  <span>Unauthorized - Missing or invalid authentication token</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="rounded bg-orange-600 px-2 py-1 font-mono text-sm text-white">404</code>
                  <span>Not Found - Resource not found</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="rounded bg-orange-600 px-2 py-1 font-mono text-sm text-white">429</code>
                  <span>Too Many Requests - Rate limit exceeded</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="rounded bg-red-600 px-2 py-1 font-mono text-sm text-white">500</code>
                  <span>Internal Server Error - Server error occurred</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-12 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-semibold">SDKs & Code Examples</h2>
              <p className="mb-4 text-slate-700 dark:text-slate-300">
                We provide official SDKs and code examples to make integration easier:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-white p-4 dark:bg-slate-950">
                  <h4 className="mb-2 font-semibold">🐍 Python</h4>
                  <code className="text-sm">pip install doculume-sdk</code>
                </div>
                <div className="rounded-lg bg-white p-4 dark:bg-slate-950">
                  <h4 className="mb-2 font-semibold">📦 JavaScript/TypeScript</h4>
                  <code className="text-sm">npm install doculume-js</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
