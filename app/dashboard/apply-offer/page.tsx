'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { v4 as uuidv4 } from 'uuid'

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

export default function ApplyOfferPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const proposalId = searchParams.get('proposalId')
  
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  
  // Form state
  const [quote, setQuote] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [message, setMessage] = useState('')
  
  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    const fetchProposalDetails = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      if (!proposalId) {
        router.push('/dashboard')
        return
      }

      try {
        // Fetch proposal details
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', proposalId)
          .single()
        
        if (error) {
          console.error('Error fetching proposal:', error)
          router.push('/dashboard')
          return
        }
        
        setProposal(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!isLoading) {
      fetchProposalDetails()
    }
  }, [user, isLoading, router, proposalId])

  const handlePlatformChange = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId)
      } else {
        return [...prev, platformId]
      }
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    
    if (files && files.length > 0) {
      const file = files[0]
      
      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        setUploadError('Please upload a video file')
        return
      }
      
      // Check if file is not too large (100MB)
      if (file.size > 100 * 1024 * 1024) {
        setUploadError('Video file is too large (max 100MB)')
        return
      }
      
      setVideoFile(file)
      setUploadError('')
    }
  }

  const uploadVideo = async (): Promise<string> => {
    if (!videoFile) return ''
    
    const fileExt = videoFile.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${user!.id}/${fileName}`
    
    try {
      // Upload the file without using onUploadProgress
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, videoFile, {
          cacheControl: '3600',
          upsert: false
        })
        
      if (uploadError) throw uploadError
      
      // Get public URL for the uploaded video
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)
        
      setUploadProgress(100) // Set to 100% when complete
      return publicUrl
    } catch (error: any) {
      console.error('Error uploading video:', error.message)
      setUploadError('Failed to upload video. Please try again.')
      return ''
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!quote) newErrors.quote = 'Please enter a project quote'
    if (!publishDate) newErrors.publishDate = 'Please select a publish date'
    if (selectedPlatforms.length === 0) newErrors.platforms = 'Please select at least one platform'
    if (!paymentMethod) newErrors.paymentMethod = 'Please select a payment method'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)
    
    try {
      // Upload video if provided
      let uploadedVideoUrl = ''
      if (videoFile) {
        uploadedVideoUrl = await uploadVideo()
        if (!uploadedVideoUrl && videoFile) {
          setSubmitting(false)
          return
        }
      }
      
      // Create response in database
      const responseData = {
        proposal_id: proposalId,
        user_id: user!.id,
        status: 'accepted',
        quote: quote,
        proposed_publish_date: publishDate,
        platforms: selectedPlatforms,
        payment_method: paymentMethod,
        uploaded_video_url: uploadedVideoUrl,
        video_link: videoUrl,
        message: message
      }
      
      const { error } = await supabase
        .from('responses')
        .insert(responseData)
        
      if (error) throw error
      
      // Redirect to dashboard with success message
      router.push('/dashboard?success=true')
      
    } catch (error: any) {
      console.error('Error submitting response:', error.message)
      alert('Failed to submit your response. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="p-8 min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center p-12 bg-[#121212] border border-white/5 text-center rounded-md">
          <p className="text-xl text-gray-300 mb-3">Proposal not found</p>
          <p className="text-gray-400">The proposal you are looking for doesn't exist</p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center justify-between px-8 py-4 bg-white rounded-full"
          >
            <span className="mr-4 text-black font-medium">Back to Dashboard</span>
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
          href={`/dashboard/proposal/${proposalId}`}
          className="text-[#FFB900] flex items-center space-x-2"
        >
          <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1L1 7L6 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back to Proposal</span>
        </Link>
      </div>

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Apply to Offer</h1>
        <p className="text-gray-400 mt-2">Complete the form below to apply for the "{proposal.title}" opportunity</p>
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

          {/* Video Upload */}
          <div className="space-y-2">
            <p className="block text-sm text-[#FFB900]">Upload Video</p>
            <div className="bg-[#080808] border border-dashed border-white/20 rounded-lg p-6 text-center">
              <input
                type="file"
                id="video"
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
              <label htmlFor="video" className="cursor-pointer block">
                {videoFile ? (
                  <div className="space-y-2">
                    <p className="text-white">{videoFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 bg-[#1E1E1E] rounded-full flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-gray-400">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">MP4, MOV, AVI (max. 100MB)</p>
                  </div>
                )}
              </label>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#FFB900]" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Uploading: {uploadProgress}%</p>
                </div>
              )}
              {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
            </div>
          </div>

          {/* Video Link */}
          <div className="space-y-2">
            <label htmlFor="videoLink" className="block text-sm text-[#FFB900]">
              Or provide a video link
            </label>
            <input
              type="url"
              id="videoLink"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="bg-[#080808] border border-white/10 rounded-lg py-3 px-4 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFB900] focus:border-[#FFB900]"
            />
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

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-[#FFB900] rounded-full hover:bg-[#E6A800] transition-colors text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 