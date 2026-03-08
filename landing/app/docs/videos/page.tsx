"use client"

import { useLandingTheme } from '../../lib/useLandingTheme'
import { SiteHeader } from '../../components/SiteHeader'
import { SiteFooter } from '../../components/SiteFooter'
import { Card, CardContent } from '../../components/ui/card'
import { ArrowLeft, Play, Clock, Video } from 'lucide-react'
import Link from 'next/link'

export default function VideosPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  const videos = [
    {
      title: 'Getting Started with DocuLume',
      description: 'Complete walkthrough from account creation to your first conversation',
      duration: '5:30',
      thumbnail: '/videos/thumbnails/getting-started.jpg',
      level: 'Beginner',
      topics: ['Account Setup', 'First Upload', 'First Chat']
    },
    {
      title: 'Uploading and Managing Documents',
      description: 'Learn best practices for document upload, organization, and management',
      duration: '8:15',
      thumbnail: '/videos/thumbnails/upload-docs.jpg',
      level: 'Beginner',
      topics: ['File Formats', 'Batch Upload', 'Organization']
    },
    {
      title: 'Mastering Chat: Tips for Better Answers',
      description: 'Advanced techniques for getting accurate, relevant answers from your documents',
      duration: '10:20',
      thumbnail: '/videos/thumbnails/master-chat.jpg',
      level: 'Intermediate',
      topics: ['Question Techniques', 'RAG Mode', 'Source Citations']
    },
    {
      title: 'Configuring LLM Providers',
      description: 'Complete guide to setting up OpenAI, Anthropic, Google, and Ollama',
      duration: '12:45',
      thumbnail: '/videos/thumbnails/llm-config.jpg',
      level: 'Intermediate',
      topics: ['Cloud Providers', 'Local LLMs', 'Fallback Setup']
    },
    {
      title: 'Using Ollama for Local LLMs',
      description: 'Step-by-step guide to installing Ollama and using local models',
      duration: '9:30',
      thumbnail: '/videos/thumbnails/ollama.jpg',
      level: 'Intermediate',
      topics: ['Ollama Installation', 'Model Selection', 'Performance Tips']
    },
    {
      title: 'API Integration Tutorial',
      description: 'Integrate DocuLume into your applications using the REST API',
      duration: '15:00',
      thumbnail: '/videos/thumbnails/api.jpg',
      level: 'Advanced',
      topics: ['Authentication', 'API Endpoints', 'Code Examples']
    },
    {
      title: 'Self-Hosting DocuLume',
      description: 'Deploy DocuLume on your own infrastructure with Docker and Kubernetes',
      duration: '18:20',
      thumbnail: '/videos/thumbnails/self-host.jpg',
      level: 'Advanced',
      topics: ['Docker Setup', 'Kubernetes', 'Configuration']
    },
    {
      title: 'Admin Panel Walkthrough',
      description: 'Managing users, documents, and monitoring your DocuLume instance',
      duration: '11:40',
      thumbnail: '/videos/thumbnails/admin.jpg',
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
    <main className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <SiteHeader
        isDark={isDark}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        appUrl={appUrl}
      />

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <Link href="/docs" className={`mb-6 inline-flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl flex items-center gap-3">
              <Video className="size-10" />
              Video Tutorials
            </h1>
            <p className={`mt-4 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Learn DocuLume through step-by-step video guides
            </p>
          </div>

          {/* Playlists */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Learning Paths</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {playlists.map((playlist) => (
                <Card key={playlist.name} className={`${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} hover:shadow-lg transition-shadow cursor-pointer`}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{playlist.name}</h3>
                    <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {playlist.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>
                        {playlist.videos} videos
                      </span>
                      <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>
                        {playlist.duration}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Video Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">All Videos</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <Card key={video.title} className={`${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} hover:shadow-lg transition-shadow cursor-pointer overflow-hidden`}>
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <Play className="size-16 text-white opacity-80" />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Clock className="size-3" />
                      {video.duration}
                    </div>
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold ${
                      video.level === 'Beginner' ? 'bg-green-600 text-white' :
                      video.level === 'Intermediate' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {video.level}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                    <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {video.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {video.topics.map((topic) => (
                        <span
                          key={topic}
                          className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
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

          {/* Coming Soon */}
          <Card className={`${isDark ? 'border-purple-800 bg-purple-900/20' : 'border-purple-200 bg-purple-50'}`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">More Videos Coming Soon!</h2>
              <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                We're constantly creating new video tutorials. Subscribe to our YouTube channel to get notified:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Play className="size-5 mr-2" />
                  Subscribe on YouTube
                </button>
                <Link href="/docs" className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
                  Browse Text Docs
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          <div className={`mt-8 p-4 rounded-lg ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <strong>Note:</strong> Videos are placeholders for demonstration purposes. In production, these would link to actual video content on YouTube or a video hosting platform.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
