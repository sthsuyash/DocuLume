"use client"

import { useLandingTheme } from '../../../lib/useLandingTheme'
import { SiteHeader } from '../../../components/SiteHeader'
import { SiteFooter } from '../../../components/SiteFooter'
import { Card, CardContent } from '../../../components/ui/card'
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function UploadDocsPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  const supportedFormats = [
    { format: 'PDF', extensions: '.pdf', details: 'Including scanned PDFs with OCR support' },
    { format: 'Word', extensions: '.docx, .doc', details: 'Microsoft Word documents' },
    { format: 'Text', extensions: '.txt', details: 'Plain text files' },
    { format: 'Markdown', extensions: '.md', details: 'Markdown formatted documents' },
    { format: 'HTML', extensions: '.html, .htm', details: 'Web pages and HTML documents' },
    { format: 'CSV', extensions: '.csv', details: 'Comma-separated values' },
  ]

  const bestPractices = [
    {
      title: 'File Size',
      tip: 'Keep individual files under 50MB for optimal processing',
      icon: FileText
    },
    {
      title: 'File Names',
      tip: 'Use descriptive names like "Q3-Report-2024.pdf" instead of "document1.pdf"',
      icon: CheckCircle
    },
    {
      title: 'Batch Uploads',
      tip: 'Upload multiple files at once by selecting them together',
      icon: Upload
    },
    {
      title: 'OCR Quality',
      tip: 'For scanned PDFs, ensure text is readable (300+ DPI recommended)',
      icon: AlertCircle
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
            Uploading Documents
          </h1>
          <p className={`mt-4 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Learn how to upload and manage your documents
          </p>

          {/* Upload Methods */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Upload Methods</h2>

            <div className="space-y-6">
              {/* Web UI */}
              <Card className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-3">1. Web Interface (Drag & Drop)</h3>
                  <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    The easiest way to upload documents is through the web interface:
                  </p>
                  <ol className={`space-y-2 ml-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>1. Navigate to the Documents page</li>
                    <li>2. Click "Upload" or drag files directly into the upload area</li>
                    <li>3. Select one or more files from your computer</li>
                    <li>4. Wait for processing to complete (you'll see a progress indicator)</li>
                    <li>5. Your documents are now ready for chatting!</li>
                  </ol>
                </CardContent>
              </Card>

              {/* API */}
              <Card className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-3">2. API Upload</h3>
                  <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    For programmatic uploads, use the REST API:
                  </p>
                  <pre className={`overflow-x-auto rounded-lg p-4 text-sm ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                    <code>{`curl -X POST https://api.doculume.com/api/v1/documents/upload \\
  -b cookies.txt \\
  -F "file=@document.pdf"

# Authentication via httpOnly cookie (set during login)`}</code>
                  </pre>
                  <p className={`mt-3 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    See the <Link href="/docs/api" className="text-blue-500 hover:underline">API Reference</Link> for more details.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Supported Formats */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Supported File Formats</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {supportedFormats.map((item) => (
                <Card key={item.format} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FileText className={`size-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.format}</h3>
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.extensions}</p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.details}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Best Practices</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {bestPractices.map((practice) => {
                const Icon = practice.icon
                return (
                  <Card key={practice.title} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                          <Icon className={`size-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{practice.title}</h3>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{practice.tip}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Processing */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Document Processing</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                After upload, your documents go through several processing steps:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>1</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Text Extraction</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Content is extracted from the document (with OCR for scanned PDFs)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>2</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Chunking</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Text is split into semantic chunks for better retrieval</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>3</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Vectorization</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Chunks are converted to embeddings and stored in the vector database</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>4</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Ready</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Document is ready for intelligent search and chat</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card className={`mt-12 ${isDark ? 'border-orange-800 bg-orange-900/20' : 'border-orange-200 bg-orange-50'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="size-6 text-orange-600 dark:text-orange-400" />
                Troubleshooting
              </h2>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">Upload fails with "File too large"</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Files must be under 50MB. Split large documents or compress PDFs before uploading.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Processing takes a long time</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Large documents (especially scanned PDFs requiring OCR) can take several minutes. Check the processing status in the Documents page.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Text not extracted correctly</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Ensure scanned PDFs have good quality (300+ DPI). Try converting to text-based PDF first.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className={`mt-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
              <ul className={`space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li>• <Link href="/docs/user/chat" className="text-blue-500 hover:underline">Learn how to chat with your documents</Link></li>
                <li>• <Link href="/docs/api" className="text-blue-500 hover:underline">Explore the API for programmatic uploads</Link></li>
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
