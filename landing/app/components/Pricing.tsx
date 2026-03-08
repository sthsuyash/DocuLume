export default function Pricing() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border-2">
            <h3 className="text-2xl font-bold mb-4">Starter</h3>
            <div className="text-5xl font-bold mb-6">$29<span className="text-lg">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li>✓ 100 documents/month</li>
              <li>✓ 1,000 questions</li>
              <li>✓ 5GB storage</li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">Get Started</button>
          </div>
          <div className="bg-blue-600 text-white p-8 rounded-2xl scale-105 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Professional</h3>
            <div className="text-5xl font-bold mb-6">$99<span className="text-lg">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li>✓ Unlimited documents</li>
              <li>✓ 10,000 questions</li>
              <li>✓ 50GB storage</li>
              <li>✓ All LLM models</li>
            </ul>
            <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold">Get Started</button>
          </div>
          <div className="bg-white p-8 rounded-2xl border-2">
            <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
            <div className="text-5xl font-bold mb-6">Custom</div>
            <ul className="space-y-3 mb-8">
              <li>✓ Unlimited everything</li>
              <li>✓ Dedicated infrastructure</li>
              <li>✓ SLA guarantee</li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">Contact Sales</button>
          </div>
        </div>
      </div>
    </section>
  )
}
