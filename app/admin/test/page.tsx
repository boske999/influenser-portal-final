'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>
})

// Import Quill styles
import 'react-quill/dist/quill.snow.css'

export default function TestQuill() {
  const [content, setContent] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const quillRef = useRef<any>(null)
  
  useEffect(() => {
    try {
      setIsMounted(true)
      console.log('Component mounted')
    } catch (err) {
      console.error('Error in mounting:', err)
      setError(`Error in mounting: ${err}`)
    }
    
    return () => {
      setIsMounted(false)
    }
  }, [])
  
  const handleChange = (value: string) => {
    console.log('Content changed:', value)
    setContent(value)
  }
  
  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()
    
    input.onchange = async () => {
      if (!input.files || !input.files[0]) return
      
      const file = input.files[0]
      
      try {
        const editor = quillRef.current?.getEditor()
        if (editor) {
          // Get cursor position
          const range = editor.getSelection()
          const position = range ? range.index : 0
          
          // Insert a placeholder
          editor.insertText(position, 'Uploading image...')
          
          // Simulate upload delay
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Remove placeholder
          editor.deleteText(position, 'Uploading image...'.length)
          
          // Create a fake URL for testing
          const imageUrl = URL.createObjectURL(file)
          
          // Insert image at cursor position
          editor.insertEmbed(position, 'image', imageUrl)
          
          // Update content state
          setContent(editor.root.innerHTML)
        }
      } catch (err) {
        console.error('Error uploading image:', err)
        setError(`Error uploading image: ${err}`)
      }
    }
  }
  
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    }
  }
  
  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">React Quill Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}
      
      <div className="p-6 bg-white rounded shadow">
        <p className="mb-4">Editor mounting state: {isMounted ? 'Mounted' : 'Not mounted'}</p>
        
        {isMounted ? (
          <>
            <div className="mb-4">
              <ReactQuill 
                value={content} 
                onChange={handleChange}
                theme="snow"
                modules={modules}
                ref={(el) => { quillRef.current = el }}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Editor Value:</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-40">{content}</pre>
            </div>
          </>
        ) : (
          <div className="p-4 border border-gray-300 rounded">
            <p>Loading editor...</p>
          </div>
        )}
      </div>
    </div>
  )
} 