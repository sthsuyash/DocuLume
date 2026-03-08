export default function Hero() {
  return (
    <section className="bg-linear-to-br from-blue-50 to-indigo-100 py-32 text-center px-4">
      <h1 className="text-5xl md:text-7xl font-bold mb-6">
        Chat with Your <span className="text-blue-600">Documents</span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
        Enterprise AI-powered document intelligence using advanced RAG
      </p>
      <a href="https://app.doculume.com" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold inline-block">
        Start Free Trial
      </a>
    </section>
  )
}
