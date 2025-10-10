"use client"

import { useTheme } from '@/lib/useTheme'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Play, Clock, Video } from 'lucide-react'
import Link from 'next/link'

export default function VideosPage() {
  const { isDark, toggle } = useTheme()

  const videos = [
    {
      title: 'Getting Started with DocuLume',
      description: 'Complete walkthrough from account creation to your first conversation',
      duration: '5:30',
      level: 'Beginner',
      topics: ['Account Setup', 'First Upload', 'First Chat']
    },
    {
      title: 'Uploading and Managing Documents',
      description: 'Learn best practices for document upload, organization, and management',
      duration: '8:15',
      level: 'Beginner',
      topics: ['File Formats', 'Batch Upload', 'Organization']
    },
    {
      title: 'Mastering Chat: Tips for Better Answers',
      description: 'Advanced techniques for getting accurate, relevant answers from your documents',
      duration: '10:20',
      level: 'Intermediate',
      topics: ['Question Techniques', 'RAG Mode', 'Source Citations']
    },
    {
      title: 'Configuring LLM Providers',
      description: 'Complete guide to setting up OpenAI, Anthropic, Google, and Ollama',
      duration: '12:45',
      level: 'Intermediate',
      topics: ['Cloud Providers', 'Local LLMs', 'Fallback Setup']
    },
    {
      title: 'Using Ollama for Local LLMs',
      description: 'Step-by-step guide to installing Ollama and using local models',
      duration: '9:30',
      level: 'Intermediate',
      topics: ['Ollama Installation', 'Model Selection', 'Performance Tips']
    },
    {
      title: 'API Integration Tutorial',
      description: 'Integrate DocuLume into your applications using the REST API',
      duration: '15:00',
      level: 'Advanced',
      topics: ['Authentication', 'API Endpoints', 'Code Examples']
    },
    {
      title: 'Self-Hosting DocuLume',
      description: 'Deploy DocuLume on your own infrastructure with Docker and Kubernetes',
      duration: '18:20',
      level: 'Advanced',
      topics: ['Docker Setup', 'Kubernetes', 'Configuration']
    },
    {
      title: 'Admin Panel Walkthrough',
      description: 'Managing users, documents, and monitoring your DocuLume instance',
      duration: '11:40',
      level: 'Advanced',
      topics: ['User Management', 'Analytics', 'Security Settings']
    }
  ]

  const playlists = [
    {
      name: 'Quick Start Series',
      videos: 3,
      duration: '24 min',
      description: 'Everything you need to get started with DocuLume'
    },
    {
      name: 'LLM Configuration',
      videos: 4,
      duration: '45 min',
      description: 'Master LLM provider configuration and optimization'
    },
    {
      name: 'Developer Track',
      videos: 5,
      duration: '1.5 hours',
      description: 'API integration, self-hosting, and advanced customization'
    }
  ]

  return (
    <main className="min-h-screen transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <Link href="/docs" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300">
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          <div className="mb-12">
            <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight md:text-5xl">
              <Video className="size-10" />
              Video Tutorials
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Learn DocuLume through step-by-step video guides
            </p>
          </div>

          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">Learning Paths</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {playlists.map((playlist) => (
                <Card key={playlist.name} className="cursor-pointer border-slate-200 bg-white transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <CardContent className="p-6">
                    <h3 className="mb-2 text-lg font-semibold">{playlist.name}</h3>
                    <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                      {playlist.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{playlist.videos} videos</span>
                      <span>{playlist.duration}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">All Videos</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <Card key={video.title} className="cursor-pointer overflow-hidden border-slate-200 bg-white transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                    <Play className="size-16 text-white opacity-80" />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs text-white">
                      <Clock className="size-3" />
                      {video.duration}
                    </div>
                    <div className={`absolute left-2 top-2 rounded px-2 py-1 text-xs font-semibold ${
                      video.level === 'Beginner' ? 'bg-green-600 text-white' :
                      video.level === 'Intermediate' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {video.level}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="mb-2 line-clamp-2 font-semibold">{video.title}</h3>
                    <p className="mb-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                      {video.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {video.topics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-semibold">More Videos Coming Soon!</h2>
              <p className="mb-4 text-slate-700 dark:text-slate-300">
                {"We're constantly creating new video tutorials. Subscribe to our YouTube channel to get notified:"}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700">
                  <Play className="mr-2 size-5" />
                  Subscribe on YouTube
                </button>
                <Link href="/docs" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-slate-900 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  Browse Text Docs
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Note:</strong> Videos are placeholders for demonstration purposes. In production, these would link to actual video content on YouTube or a video hosting platform.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
