'use client'
import { useState } from 'react'
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation' // Updated for Next.js 13+
import {
  ArrowRightIcon,
  DocumentArrowUpIcon,
  TableCellsIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { LoadingState } from '@/components/LoadingState'


export default function BidQualifierPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rfpData, setRfpData] = useState<RFPData | null>(null)
  const [text, setText] = useState<string>('')
  const [analysisId, setAnalysisId] = useState<number | null>(null)
  const [isFileUploaded, setIsFileUploaded] = useState(false)
  const bidTypes = [
    'US Web Bids',
    'UK Web Bids',
    'Canada Web Bids',
    'US Paid Media Bids',
    'UK Paid Media Bids'
  ];
  const [selectedBidType, setSelectedBidType] = useState(bidTypes[0]);

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/rfp/upload_pdf/', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      
      if (data.success) {
        setIsFileUploaded(true)
        setFile(file)
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile)
    }
  }

  const handleTextAnalysis = async (text: string) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/rfp/analyze/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        mode: 'cors'
      })

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to analyze text')
      }

      const analysisData = await response.json()
      console.log('Received analysis data:', analysisData)
      
      // Transform the analysis data to match your RFPData interface
      const transformedData: RFPData = {
        ...analysisData.result,
        sections: [] // Add empty sections array to match interface
      }

      setRfpData(transformedData)
    } catch (err) {
      console.error('Error during analysis:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAnalysis = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/rfp/analyze/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      if (data.success) {
        router.push('/analysis');
      }
    } catch (err) {
      console.error('Error during analysis:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to safely get nested values
  const getValue = (obj: any, path: string, defaultValue: string = "Not specified"): string => {
    try {
      return path.split('.').reduce((acc, part) => acc?.[part] ?? defaultValue, obj)
    } catch (e) {
      console.error(`Error getting value for path ${path}:`, e)
      return defaultValue
    }
  }

  const sections = rfpData ? [
    {
      title: "Bid Summary",
      items: [
        { label: "Client Name", value: getValue(rfpData, 'bid_summary.client_name') },
        { label: "Services Required", value: getValue(rfpData, 'bid_summary.services_required') },
        { label: "Client Contact", value: getValue(rfpData, 'bid_summary.client_contact') },
        { label: "Who is the incumbent?", value: getValue(rfpData, 'bid_summary.incumbent') }
      ],
      bgColor: "bg-green-50"
    },
    // ... other sections remain the same as your original code ...
  ] : []

  const handleDecline = () => {
    setRfpData(null)
  }

  const handleProceedWithBid = () => {
    if (rfpData?.analysis_id) {
      router.push(`/bids/${rfpData.analysis_id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Bid Qualifier</h1>
          <p className="text-lg text-gray-600">
            Streamline your Bid RFP analysis process with our intelligent workflow
          </p>
        </div>

        {/* Process Flow Diagram First */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12">
          {/* Step 1 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow w-64">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <DocumentArrowUpIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload RFP</h3>
            <p className="text-sm text-gray-600 text-center">Upload your RFP document to begin analysis</p>
          </div>
          <ArrowRightIcon className="hidden md:block h-6 w-6 text-gray-400" />
          {/* Step 2 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow w-64">
            <div className="bg-purple-100 p-4 rounded-full mb-4">
              <TableCellsIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Matrix View</h3>
            <p className="text-sm text-gray-600 text-center">Review structured data in matrix format</p>
          </div>
          <ArrowRightIcon className="hidden md:block h-6 w-6 text-gray-400" />
          {/* Step 3 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow w-64">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Chat</h3>
            <p className="text-sm text-gray-600 text-center">Ask questions and get instant insights</p>
          </div>
          <ArrowRightIcon className="hidden md:block h-6 w-6 text-gray-400" />
          {/* Step 4 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow w-64">
            <div className="bg-orange-100 p-4 rounded-full mb-4">
              <ArrowDownTrayIcon className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export</h3>
            <p className="text-sm text-gray-600 text-center">Download analysis results to Excel</p>
          </div>
        </div>

        {/* Bid Type Dropdown moved below the flow */}
        <div className="max-w-md mx-auto mb-12">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <label htmlFor="bid-type" className="block text-lg font-semibold text-gray-900 mb-3">
              Select Your Bid Type
            </label>
            <div className="relative">
              <select
                id="bid-type"
                value={selectedBidType}
                onChange={(e) => setSelectedBidType(e.target.value)}
                className="block w-full px-4 py-3 text-base border-2 border-gray-200 
                  rounded-lg bg-white hover:border-blue-500 focus:outline-none 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  transition-all duration-200 ease-in-out appearance-none
                  text-gray-700 font-medium"
              >
                {bidTypes.map((type) => (
                  <option 
                    key={type} 
                    value={type}
                    className="py-2"
                  >
                    {type}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                <div className="bg-blue-50 rounded-full p-1">
                  <svg 
                    className="h-5 w-5 text-blue-500" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Choose the appropriate bid type for your RFP analysis
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 ${!text ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setText('')}
              >
                Upload PDF
              </button>
              <button
                className={`px-4 py-2 ${text ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setFile(null)}
              >
                Enter Text
              </button>
            </div>
          </div>

          {!text ? (
            <div className="space-y-4 flex flex-col items-center">
              <label className="inline-block w-40">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile?.type === 'application/pdf') {
                      handleUpload(selectedFile)
                    }
                  }}
                />
                <span className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm transition-all duration-150 ease-in-out cursor-pointer w-full
                  ${isFileUploaded 
                    ? 'bg-green-100 text-green-900' 
                    : 'bg-purple-100 hover:bg-purple-200 text-gray-900'}`}>
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      Uploading...
                    </span>
                  ) : isFileUploaded ? (
                    'PDF Uploaded ✓'
                  ) : (
                    'Upload PDF'
                  )}
                </span>
              </label>

              <button
                className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm transition-all duration-150 ease-in-out w-40
                  ${!isFileUploaded 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-orange-100 hover:bg-orange-200 text-gray-900'}`}
                onClick={handleAnalysis}
                disabled={!isFileUploaded || isAnalyzing}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    Analyzing...
                  </span>
                ) : (
                  'Start Analysis'
                )}
              </button>
            </div>
          ) : null}

          {error && (
            <div className="mt-4 text-center text-red-500">
              Error: {error}
            </div>
          )}

          {rfpData && (
            <div className="mt-8 text-center">
              <button
                onClick={handleProceedWithBid}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg"
              >
                Proceed with Bid
              </button>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-white bg-opacity-90 z-50">
            <LoadingState />
          </div>
        )}
      </div>
    </div>
  )
}
