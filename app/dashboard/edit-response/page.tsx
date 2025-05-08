'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: '📺' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'facebook', name: 'Facebook', icon: '👥' },
  { id: 'x', name: 'X / Twitter', icon: '🐦' }
]

const paymentMethods = [
  { id: 'paypal', name: 'PayPal' },
  { id: 'wire', name: 'Wire Transfer' },
  { id: 'crypto', name: 'Cryptocurrency' }
]

export default function EditResponsePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const responseId = searchParams?.get('id')
  
  const [response, setResponse] = useState<any>(null)
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [quote, setQuote] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [message, setMessage] = useState('')
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  
  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    const fetchResponseDetails = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      if (!responseId) {
        router.push('/dashboard/responses')
        return
      }

      try {
        // Fetch response details
        const { data, error } = await supabase
          .from('responses')
          .select(`
            id,
            proposal_id,
            user_id,
            status,
            proposed_publish_date,
            quote,
            platforms,
            payment_method,
            message,
            disclaimer_accepted,
            created_at,
            proposal:proposals(
              title,
              company_name,
              disclaimer
            )
          `)
          .eq('id', responseId)
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching response:', error)
          router.push('/dashboard/responses')
          return
        }
        
        // Check if we have a valid response
        if (!data) {
          router.push('/dashboard/responses')
          return
        }
        
        // Set the response data
        setResponse(data)
        
        // Set form values from the response
        if (data.quote) setQuote(data.quote)
        if (data.proposed_publish_date) setPublishDate(data.proposed_publish_date.split('T')[0])
        if (data.platforms) setSelectedPlatforms(data.platforms)
        if (data.payment_method) setPaymentMethod(data.payment_method)
        if (data.message) setMessage(data.message)
        if (data.disclaimer_accepted) setDisclaimerAccepted(data.disclaimer_accepted)
        
        // Set the proposal information
        setProposal({
          id: data.proposal_id,
          title: data.proposal ? (data.proposal as any).title || '' : '',
          company_name: data.proposal ? (data.proposal as any).company_name || '' : '',
          disclaimer: data.proposal ? (data.proposal as any).disclaimer || '' : ''
        })
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!isLoading) {
      fetchResponseDetails()
    }
  }, [user, isLoading, router, responseId])

  const handlePlatformChange = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId)
      } else {
        return [...prev, platformId]
      }
    })
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!quote) newErrors.quote = 'Please enter a project quote'
    if (!publishDate) newErrors.publishDate = 'Please select a publish date'
    if (selectedPlatforms.length === 0) newErrors.platforms = 'Please select at least one platform'
    if (!paymentMethod) newErrors.paymentMethod = 'Please select a payment method'
    if (proposal?.disclaimer && !disclaimerAccepted) newErrors.disclaimer = 'You must accept the disclaimer to proceed'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)
    
    try {
      // Update response in database
      const responseData = {
        status: 'accepted',
        quote,
        proposed_publish_date: publishDate,
        platforms: selectedPlatforms,
        payment_method: paymentMethod,
        message,
        disclaimer_accepted: disclaimerAccepted
      }
      
      const { error } = await supabase
        .from('responses')
        .update(responseData)
        .eq('id', responseId)
        .eq('user_id', user!.id)
        
      if (error) throw error
      
      // Now, find and update any existing admin response to set it back to pending
      const { data: adminResponses, error: fetchError } = await supabase
        .from('admin_responses')
        .select('id')
        .eq('response_id', responseId)
      
      if (fetchError) {
        console.error('Error fetching admin responses:', fetchError)
      } else if (adminResponses && adminResponses.length > 0) {
        // Update the admin response to pending
        const { error: updateError } = await supabase
          .from('admin_responses')
          .update({ status: 'pending' })
          .eq('response_id', responseId)
        
        if (updateError) {
          console.error('Error updating admin response status:', updateError)
        }
      }
      
      // Redirect to view response page with success message
      router.push(`/dashboard/view-response?id=${responseId}&updated=true`)
      
    } catch (error: any) {
      console.error('Error updating response:', error.message)
      alert('Failed to update your response. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!response || !proposal) {
    return (
      <div className="p-8 min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center p-12 bg-[#121212] border border-white/5 text-center rounded-md">
          <p className="text-xl text-gray-300 mb-3">Response not found</p>
          <p className="text-gray-400">The response you are looking for doesn't exist</p>
          <Link
            href="/dashboard/responses"
            className="mt-8 inline-flex items-center justify-between px-8 py-4 bg-white rounded-full"
          >
            <span className="mr-4 text-black font-medium">Back to Responses</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href={`/dashboard/view-response?id=${responseId}`}
          className="text-[#FFB900] flex items-center space-x-2"
        >
          <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1L1 7L6 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back to Response</span>
        </Link>
      </div>

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Edit Your Response</h1>
        <p className="text-gray-400 mt-2">Update your response for the "{proposal.title}" opportunity</p>
      </div>

      {/* Application form */}
      <div className="bg-[#121212] border border-white/5 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quote */}
          <div className="space-y-2">
            <label htmlFor="quote" className="block text-sm text-[#FFB900]">
              Project Quote
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="text"
                id="quote"
                value={quote}
                onChange={(e) => {
                  // Allow only numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '')
                  setQuote(value)
                }}
                className="bg-[#080808] border border-white/10 rounded-lg py-3 px-10 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFB900] focus:border-[#FFB900]"
                placeholder="Enter amount"
              />
            </div>
            {errors.quote && <p className="text-red-500 text-sm">{errors.quote}</p>}
          </div>

          {/* Publish Date */}
          <div className="space-y-2">
            <label htmlFor="publishDate" className="block text-sm text-[#FFB900]">
              Proposed Publish Date
            </label>
            <input
              type="date"
              id="publishDate"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} // Set min date to today
              className="bg-[#080808] border border-white/10 rounded-lg py-3 px-4 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFB900] focus:border-[#FFB900]"
            />
            {errors.publishDate && <p className="text-red-500 text-sm">{errors.publishDate}</p>}
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <p className="block text-sm text-[#FFB900]">Platforms</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {platforms.map((platform) => (
                <label 
                  key={platform.id} 
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-colors ${
                    selectedPlatforms.includes(platform.id) 
                      ? 'bg-[#FFB900]/10 border-[#FFB900] text-white' 
                      : 'bg-[#080808] border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={() => handlePlatformChange(platform.id)}
                  />
                  <span className="text-2xl mb-2">{platform.icon}</span>
                  <span className="text-sm">{platform.name}</span>
                </label>
              ))}
            </div>
            {errors.platforms && <p className="text-red-500 text-sm">{errors.platforms}</p>}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label htmlFor="paymentMethod" className="block text-sm text-[#FFB900]">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="bg-[#080808] border border-white/10 rounded-lg py-3 px-4 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFB900] focus:border-[#FFB900]"
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
            {errors.paymentMethod && <p className="text-red-500 text-sm">{errors.paymentMethod}</p>}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm text-[#FFB900]">
              Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Add any additional information or questions..."
              className="bg-[#080808] border border-white/10 rounded-lg py-3 px-4 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFB900] focus:border-[#FFB900]"
            ></textarea>
          </div>

          {/* Disclaimer */}
          {proposal?.disclaimer && (
            <div className="space-y-4">
              <div className="p-4 bg-[#080808] border border-white/10 rounded-lg">
                <h3 className="text-[#FFB900] font-medium mb-2">Legal Disclaimer</h3>
                <p className="text-white text-sm whitespace-pre-line">{proposal.disclaimer}</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="disclaimerAccepted"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="disclaimerAccepted" className="text-white text-sm">
                  I have read and agree to the terms in the disclaimer
                </label>
              </div>
              {errors.disclaimer && <p className="text-red-500 text-sm">{errors.disclaimer}</p>}
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-[#FFB900] rounded-full hover:bg-[#E6A800] transition-colors text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update Response'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 