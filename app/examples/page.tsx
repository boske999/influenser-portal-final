'use client';

import Link from 'next/link';

export default function ExamplesPage() {
  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Examples</h1>
      
      <div className="space-y-4">
        <div className="bg-[#121212] border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <Link href="/examples/toast-demo" className="block">
            <h2 className="text-xl font-bold text-white mb-2">Toast Alerts Demo</h2>
            <p className="text-gray-400">Examples of different alert styles using AlertUtils</p>
          </Link>
        </div>
        
        <div className="bg-[#121212] border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <Link href="/examples/system-messages" className="block">
            <h2 className="text-xl font-bold text-white mb-2">System Messages Demo</h2>
            <p className="text-gray-400">Examples of predefined system messages for common actions</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 