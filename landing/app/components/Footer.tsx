export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="mb-4">© 2026 DocuLume. All rights reserved.</p>
        <div className="space-x-6">
          <a href="/privacy" className="hover:text-white">Privacy</a>
          <a href="/terms" className="hover:text-white">Terms</a>
          <a href="/contact" className="hover:text-white">Contact</a>
        </div>
      </div>
    </footer>
  )
}
