'use client'

import { useState, forwardRef, useImperativeHandle } from 'react'
import { ChatBubbleLeftIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface ChatMessage {
  type: 'user' | 'bot'
  content: string
}

interface ChatPopupProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

const ChatPopup = forwardRef(function ChatPopup(
  { isOpen: propIsOpen, setIsOpen: propSetIsOpen }: ChatPopupProps, 
  ref
) {
  const [isOpen, setIsOpenState] = useState(propIsOpen || false)
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    // Welcome message with example prompts below it
    {
      type: 'bot',
      content: `Welcome! I'm your RFP assistant. I can help answer any questions you have about this specific RFP. Feel free to ask me anything about the requirements, deadlines, or clarifications needed.

Example questions you can ask:
• What clarification questions should I ask to this response?
• What key deadlines should I be aware of?`
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  // Use either the prop state or local state
  const chatIsOpen = propIsOpen !== undefined ? propIsOpen : isOpen;
  const setChatIsOpen = propSetIsOpen || setIsOpenState;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    open: () => setChatIsOpen(true),
    close: () => setChatIsOpen(false),
    toggle: () => setChatIsOpen(!chatIsOpen)
  }));

  // Add preset prompts
  const presetPrompts = [
    {
      label: "❓ Clarification Questions",
      query: "What clarification questions should I ask to this response?"
    },
    {
      label: "⏰ Key Deadlines",
      query: "What key deadlines should I be aware of?"
    }
  ]

  // Function to fill input with preset prompt
  const fillPrompt = (query: string) => {
    setMessage(query)
  }

  const ThinkingDots = () => (
    <div className="flex space-x-2 p-2 bg-gray-100 rounded-lg">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
    </div>
  )

  const handleSend = async (prompt: string) => {
    if (!message.trim()) return

    setIsLoading(true)
    setChatHistory(prev => [...prev, { type: 'user', content: message }])

    try {
      setChatHistory(prev => [...prev, { type: 'bot', content: '...' }])

      const response = await fetch('http://127.0.0.1:8000/api/rfp/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message
        }),
      })

      const data = await response.json()
      
      setChatHistory(prev => [...prev.slice(0, -1), { 
        type: 'bot', 
        content: data.answer.answer || data.answer // Handle both possible response formats
      }])
    } catch (error) {
      console.error('Error:', error)
      setChatHistory(prev => [...prev.slice(0, -1), { 
        type: 'bot', 
        content: 'Sorry, I encountered an error.' 
      }])
    }

    setIsLoading(false)
    setMessage('')
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${chatIsOpen ? 'w-96' : 'w-auto'}`}>
      {/* Chat Icon Button with Loading Spinner */}
      <button
        onClick={() => setChatIsOpen(true)}
        className="fixed bottom-5 right-5 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : (
          <ChatBubbleLeftIcon className="h-6 w-6" />
        )}
      </button>

      {/* Chat Popup */}
      {chatIsOpen && (
        <div className="fixed bottom-20 right-5 w-[350px] h-[500px] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-blue-500 text-white flex justify-between items-center">
            <h3 className="font-semibold">RFP Assistant</h3>
            <button onClick={() => setChatIsOpen(false)} className="text-white hover:text-gray-200">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-2">
            {/* Moved preset prompts to be clickable suggestions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {presetPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => fillPrompt(prompt.query)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-sm font-medium transition-colors duration-150"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-2 max-w-[80%] rounded-lg ${
                    msg.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content === '...' && msg.type === 'bot' ? (
                    <ThinkingDots />
                  ) : (
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSend(message)
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Ask a question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={isLoading || !message.trim()}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

ChatPopup.displayName = 'ChatPopup'

export default ChatPopup 