'use client'

import { useState } from 'react'

export default function SendInvitePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [registrationUrl, setRegistrationUrl] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState<boolean | null>(null)

  const addLog = (log: string) => {
    setLogs(prev => [...prev, log]);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }
    
    setLoading(true)
    setError(null)
    setMessage(null)
    setRegistrationUrl(null)
    setEmailSent(null)
    setLogs([])
    
    try {
      addLog(`Sending invitation to ${email}...`);
      
      // Koristimo serversku API rutu za slanje pozivnica
      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }
      
      addLog(`Server response: ${JSON.stringify(result)}`);
      
      if (result.success) {
        if (result.data?.registration_url) {
          // Prikazujemo link za registraciju ako je dostupan
          setRegistrationUrl(result.data.registration_url);
          addLog(`Registration URL: ${result.data.registration_url}`);
          
          // Kopiramo link u clipboard
          await navigator.clipboard.writeText(result.data.registration_url);
          addLog('Registration URL copied to clipboard');

          // Beležimo da li je email uspešno poslat
          setEmailSent(result.data.email_sent === true);
          addLog(`Email sent: ${result.data.email_sent ? 'Yes' : 'No'}`);
        }
        
        setMessage(result.message || 'Invitation created successfully!');
      } else {
        throw new Error('Unknown error when sending invitation');
      }
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'Failed to send invitation');
      addLog(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-[90svh] flex items-center justify-center bg-background px-4">
      <div className="max-w-xl w-full rounded-lg bg-inputBg p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-textPrimary mb-6">Send Invitation</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-md text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-500/30 rounded-md text-green-200 text-sm">
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-textSecondary mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-4 py-2 bg-inputBg border border-white/20 rounded-md text-textPrimary placeholder-textTertiary focus:outline-none focus:ring-2 focus:ring-[#FFB900] focus:border-transparent"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 bg-[#FFB900] text-buttonText font-medium rounded-md transition-colors hover:bg-[#FFC933] focus:outline-none focus:ring-2 focus:ring-[#FFB900] focus:ring-offset-2 focus:ring-offset-background ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
        
        {registrationUrl && (
          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-md">
            <p className="text-sm text-blue-200 mb-2">Registration URL:</p>
            <div className="flex">
              <input 
                type="text" 
                value={registrationUrl} 
                readOnly
                className="flex-1 px-3 py-2 bg-inputBg border border-white/20 rounded-l-md text-textPrimary text-sm overflow-hidden text-ellipsis"
              />
              <button
                onClick={() => navigator.clipboard.writeText(registrationUrl)}
                className="px-4 py-2 bg-[#FFB900] text-buttonText font-medium rounded-r-md hover:bg-[#FFC933] transition-colors"
              >
                Copy
              </button>
            </div>
            
            <div className="mt-2 flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${emailSent ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-xs text-blue-200">
                {emailSent 
                  ? 'Email sa linkom je uspešno poslat korisniku.' 
                  : 'Email nije poslat automatski. Molimo vas da ručno pošaljete link korisniku.'}
              </p>
            </div>
          </div>
        )}
        
        {logs.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-textPrimary mb-2">Logs</h3>
            <div className="bg-background p-4 rounded-md h-60 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="mb-1 text-textSecondary text-sm font-mono">
                  <span className="text-textTertiary">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 