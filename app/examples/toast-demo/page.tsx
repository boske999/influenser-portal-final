'use client';

import React from 'react';
import AlertUtils from '../../components/AlertUtils';

export default function ToastDemo() {
  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Toast Alert Examples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => AlertUtils.info('Information', 'This is an information message')}
          className="bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/20 text-blue-400 rounded-lg p-4 transition"
        >
          Show Info Alert
        </button>
        
        <button
          onClick={() => AlertUtils.success('Success', 'Operation completed successfully!')}
          className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
        >
          Show Success Alert
        </button>
        
        <button
          onClick={() => AlertUtils.warning('Warning', 'This action cannot be undone')}
          className="bg-amber-900/20 hover:bg-amber-900/30 border border-[#FFB900]/20 text-[#FFB900] rounded-lg p-4 transition"
        >
          Show Warning Alert
        </button>
        
        <button
          onClick={() => AlertUtils.error('Error', 'Something went wrong. Please try again.')}
          className="bg-red-900/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 rounded-lg p-4 transition"
        >
          Show Error Alert
        </button>
      </div>
      
      <div className="mt-10">
        <h2 className="text-xl font-bold text-white mb-4">How to Use Alerts</h2>
        <div className="bg-[#121212] border border-white/10 rounded-lg p-6">
          <p className="text-gray-300 mb-4">Import the AlertUtils in your component:</p>
          <pre className="bg-black/50 p-3 rounded text-sm text-gray-300 overflow-x-auto">
            {`import AlertUtils from '../components/AlertUtils';`}
          </pre>
          
          <p className="text-gray-300 mt-6 mb-4">Then use it to show different types of alerts:</p>
          <pre className="bg-black/50 p-3 rounded text-sm text-gray-300 overflow-x-auto">
            {`// Information alert
AlertUtils.info('Title', 'Message');

// Success alert
AlertUtils.success('Title', 'Message');

// Warning alert
AlertUtils.warning('Title', 'Message');

// Error alert
AlertUtils.error('Title', 'Message');`}
          </pre>
        </div>
      </div>
    </div>
  );
} 