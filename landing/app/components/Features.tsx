export default function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16">Enterprise Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-xl hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Multi-Format Support</h3>
            <p className="text-gray-600">PDF, DOCX, TXT, Markdown - process multiple documents</p>
          </div>
          <div className="p-6 border rounded-xl hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Advanced RAG</h3>
            <p className="text-gray-600">Context-aware AI responses using vector embeddings</p>
          </div>
          <div className="p-6 border rounded-xl hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
            <p className="text-gray-600">JWT auth, OAuth2, rate limiting, encryption</p>
          </div>
        </div>
      </div>
    </section>
  )
}
