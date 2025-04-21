'use client';

import React from 'react';
import SystemMessages from '../../components/SystemMessages';

export default function SystemMessagesDemo() {
  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">System Messages Examples</h1>
      
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Authentication Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => SystemMessages.auth.loginSuccess()}
            className="bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/20 text-blue-400 rounded-lg p-4 transition"
          >
            Login Success
          </button>
          
          <button
            onClick={() => SystemMessages.auth.logoutSuccess()}
            className="bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/20 text-blue-400 rounded-lg p-4 transition"
          >
            Logout Success
          </button>
          
          <button
            onClick={() => SystemMessages.auth.registrationSuccess()}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            Registration Success
          </button>
          
          <button
            onClick={() => SystemMessages.auth.passwordResetEmailSent()}
            className="bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/20 text-blue-400 rounded-lg p-4 transition"
          >
            Password Reset Email Sent
          </button>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Proposal Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => SystemMessages.proposal.createSuccess()}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            Proposal Created
          </button>
          
          <button
            onClick={() => SystemMessages.proposal.updateSuccess()}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            Proposal Updated
          </button>
          
          <button
            onClick={() => SystemMessages.proposal.deleteSuccess()}
            className="bg-amber-900/20 hover:bg-amber-900/30 border border-[#FFB900]/20 text-[#FFB900] rounded-lg p-4 transition"
          >
            Proposal Deleted
          </button>
          
          <button
            onClick={() => SystemMessages.proposal.publishSuccess()}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            Proposal Published
          </button>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Response Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => SystemMessages.response.submitSuccess()}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            Response Submitted
          </button>
          
          <button
            onClick={() => SystemMessages.response.saveSuccess()}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            Response Saved
          </button>
          
          <button
            onClick={() => SystemMessages.response.updateSuccess()}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            Response Updated
          </button>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Generic System Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => SystemMessages.system.operationSuccess()}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            Generic Success
          </button>
          
          <button
            onClick={() => SystemMessages.system.operationFailed()}
            className="bg-red-900/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 rounded-lg p-4 transition"
          >
            Generic Error
          </button>
          
          <button
            onClick={() => SystemMessages.system.saveSuccess('Document')}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            Document Saved
          </button>
          
          <button
            onClick={() => SystemMessages.system.deleteSuccess('File')}
            className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/20 text-green-400 rounded-lg p-4 transition"
          >
            File Deleted
          </button>
        </div>
      </div>
      
      <div className="mt-10">
        <h2 className="text-xl font-bold text-white mb-4">How to Use System Messages</h2>
        <div className="bg-[#121212] border border-white/10 rounded-lg p-6">
          <p className="text-gray-300 mb-4">Import SystemMessages in your component:</p>
          <pre className="bg-black/50 p-3 rounded text-sm text-gray-300 overflow-x-auto">
            {`import SystemMessages from '../components/SystemMessages';`}
          </pre>
          
          <p className="text-gray-300 mt-6 mb-4">Then use it to show different types of messages:</p>
          <pre className="bg-black/50 p-3 rounded text-sm text-gray-300 overflow-x-auto">
            {`// Auth messages
SystemMessages.auth.loginSuccess();
SystemMessages.auth.logoutSuccess();

// Proposal messages
SystemMessages.proposal.createSuccess();
SystemMessages.proposal.updateSuccess();

// Response messages
SystemMessages.response.submitSuccess();
SystemMessages.response.saveSuccess();

// Generic system messages
SystemMessages.system.operationSuccess('Custom success message');
SystemMessages.system.operationFailed('Something went wrong');
SystemMessages.system.saveSuccess('Document');
SystemMessages.system.updateSuccess('Profile');`}
          </pre>
        </div>
      </div>
    </div>
  );
} 