"use client"

import { useState } from 'react'
import { useLandingTheme } from '../../../lib/useLandingTheme'
import { SiteHeader } from '../../../components/SiteHeader'
import { SiteFooter } from '../../../components/SiteFooter'
import { Card, CardContent } from '../../../components/ui/card'
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function FAQsPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is DocuLume?',
          a: 'DocuLume is an AI-powered document intelligence platform that lets you chat with your documents using natural language. Upload any document, ask questions, and get instant answers with source citations.'
        },
        {
          q: 'How does DocuLume work?',
          a: 'DocuLume uses Retrieval-Augmented Generation (RAG) technology. When you ask a question, it searches your documents for relevant information, then uses AI to generate accurate answers based on that context.'
        },
        {
          q: 'What makes DocuLume different from ChatGPT?',
          a: 'Unlike ChatGPT which uses general knowledge, DocuLume specifically searches YOUR documents to provide answers. Every response includes source citations, so you can verify the information. You also have full control over which AI model to use (OpenAI, Anthropic, Google, or local LLMs).'
        },
        {
          q: 'Is my data secure?',
          a: 'Yes! We use bank-level encryption (AES-256) for data at rest and in transit. All API keys are encrypted before storage. We\'re SOC 2 compliant and offer self-hosted options for maximum data control.'
        }
      ]
    },
    {
      category: 'Documents',
      questions: [
        {
          q: 'What file formats are supported?',
          a: 'We support PDF, DOCX, TXT, Markdown, HTML, CSV, and more. PDFs with images are processed using OCR to extract text.'
        },
        {
          q: 'What is the maximum file size?',
          a: 'Individual files can be up to 50MB. For larger documents, consider splitting them or compressing PDFs before upload.'
        },
        {
          q: 'How long does document processing take?',
          a: 'Most documents process in under 1 minute. Large documents or scanned PDFs requiring OCR may take 3-5 minutes. You can monitor processing status on the Documents page.'
        },
        {
          q: 'Can I upload multiple documents at once?',
          a: 'Yes! You can select and upload multiple files simultaneously via drag-and-drop or the file picker.'
        },
        {
          q: 'How do I delete a document?',
          a: 'Go to the Documents page, find the document you want to delete, click the three-dot menu, and select "Delete". This will remove the document and all associated chat history.'
        }
      ]
    },
    {
      category: 'Chat & Questions',
      questions: [
        {
          q: 'How do I get better answers?',
          a: 'Be specific in your questions, provide context when needed, and use natural language. Instead of "Tell me about revenue", ask "What was the total revenue in Q3 2024?". Check our Chat guide for more tips.'
        },
        {
          q: 'What is RAG mode vs Direct mode?',
          a: 'RAG mode (default) searches your documents for relevant context before answering. Direct mode queries the AI without document search, using only general knowledge. Use RAG for document-specific questions, Direct for general queries.'
        },
        {
          q: 'Why am I not getting accurate answers?',
          a: 'Common reasons: (1) The information isn\'t in your documents, (2) Question is too vague, (3) Document quality is poor (e.g., scanned PDF with bad OCR). Try rephrasing your question or check if the document contains the information.'
        },
        {
          q: 'Can I export my conversations?',
          a: 'Yes! Each conversation can be exported to JSON or PDF format. Go to the conversation, click the menu, and select "Export".'
        }
      ]
    },
    {
      category: 'LLM Providers',
      questions: [
        {
          q: 'Which AI models can I use?',
          a: 'You can use OpenAI (GPT-3.5, GPT-4), Anthropic (Claude 3), Google (Gemini), or local models via Ollama/LM Studio. You can even use custom OpenAI-compatible APIs.'
        },
        {
          q: 'How do I use local LLMs like Ollama?',
          a: 'Install Ollama, pull a model (e.g., llama2), start the Ollama server, then configure it in DocuLume Settings → LLM. See our Ollama guide for detailed instructions.'
        },
        {
          q: 'Do I need to provide my own API keys?',
          a: 'For cloud providers (OpenAI, Anthropic, Google), yes - you need your own API keys. For local providers (Ollama, LM Studio), no API key is needed. Keys are encrypted before storage.'
        },
        {
          q: 'Can I switch between different AI models?',
          a: 'Yes! You can configure multiple providers and switch between them anytime. You can also set up automatic fallback if your primary provider fails.'
        },
        {
          q: 'How much do AI API calls cost?',
          a: 'Costs vary by provider. OpenAI GPT-3.5-turbo is ~$0.002 per 1K tokens, GPT-4 is ~$0.03-0.06 per 1K tokens. Anthropic and Google have similar pricing. Local models (Ollama) are free but require local compute resources.'
        }
      ]
    },
    {
      category: 'API & Integration',
      questions: [
        {
          q: 'Does DocuLume have an API?',
          a: 'Yes! We provide a comprehensive REST API for document upload, chat, user management, and more. Check our API documentation for details.'
        },
        {
          q: 'How do I authenticate API requests?',
          a: 'Use JWT tokens obtained via the /auth/login endpoint. Include the token in the Authorization header: "Bearer YOUR_TOKEN".'
        },
        {
          q: 'What are the API rate limits?',
          a: 'Free tier: 60 requests/minute. Pro tier: 300 requests/minute. Enterprise: Custom limits. Rate limits apply per user.'
        },
        {
          q: 'Can I integrate DocuLume into my application?',
          a: 'Absolutely! Use our REST API to integrate document intelligence into your web or mobile apps. We provide code examples in Python, JavaScript, and cURL.'
        }
      ]
    },
    {
      category: 'Pricing & Plans',
      questions: [
        {
          q: 'Is there a free tier?',
          a: 'Yes! The free tier includes 10 document uploads per month, unlimited conversations, and access to all LLM providers (you provide API keys for cloud providers).'
        },
        {
          q: 'What\'s included in Pro?',
          a: 'Pro tier ($29/month) includes: unlimited documents, priority processing, API access, team collaboration, advanced analytics, and priority support.'
        },
        {
          q: 'Can I self-host DocuLume?',
          a: 'Yes! We offer self-hosted options for Enterprise customers. This gives you complete data control and the ability to deploy on your own infrastructure.'
        },
        {
          q: 'Do you offer educational discounts?',
          a: 'Yes! Students and educators get 50% off Pro plans. Contact support with your .edu email for verification.'
        }
      ]
    },
    {
      category: 'Troubleshooting',
      questions: [
        {
          q: 'Upload fails with "File too large" error',
          a: 'Files must be under 50MB. Compress your PDF using a tool like Smallpdf, or split large documents into smaller parts.'
        },
        {
          q: 'Getting "Rate limit exceeded" errors',
          a: 'You\'ve hit the API rate limit. Wait a minute and try again, or upgrade to Pro for higher limits.'
        },
        {
          q: 'Document stuck in "Processing" status',
          a: 'Large documents (especially scanned PDFs) can take 3-5 minutes. If it\'s been over 10 minutes, refresh the page. If still stuck, contact support.'
        },
        {
          q: 'Chat responses are very slow',
          a: 'This is usually due to slow API response from your LLM provider. Try using a faster model (e.g., GPT-3.5-turbo instead of GPT-4), or switch to a local LLM like Ollama.'
        },
        {
          q: 'How do I report a bug?',
          a: 'Email support@doculume.com or use the in-app feedback button. Include: what you were trying to do, what happened, and any error messages.'
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
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/docs" className={`mb-6 inline-flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl flex items-center gap-3">
              <HelpCircle className="size-10" />
              Frequently Asked Questions
            </h1>
            <p className={`mt-4 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Find answers to common questions about DocuLume
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={category.category}>
                <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((faq, faqIndex) => {
                    const globalIndex = categoryIndex * 100 + faqIndex
                    const isOpen = openIndex === globalIndex

                    return (
                      <Card
                        key={faqIndex}
                        className={`${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-semibold text-lg flex-1">{faq.q}</h3>
                            {isOpen ? (
                              <ChevronUp className={`size-5 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                            ) : (
                              <ChevronDown className={`size-5 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                            )}
                          </div>
                          {isOpen && (
                            <p className={`mt-3 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {faq.a}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Still have questions? */}
          <Card className={`mt-12 ${isDark ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Still have questions?</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Can't find what you're looking for? Here are more ways to get help:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/docs/user/help" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Ask DocuBot
                </Link>
                <Link href="/contact" className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
                  Contact Support
                </Link>
                <Link href="/docs" className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
                  Browse Docs
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
