'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatPopup from '@/components/ChatPopup'
import { LoadingState } from '@/components/LoadingState'


interface IntroBackground {
  introduction: string
  background: string
}

interface BidSummary {
  client_name: string
  rfp_number: string
  services_required: string
  client_contact: string
  email: string
  incumbent: string
}

interface WorkPortfolio {
  experience: string
  case_studies: string
  case_studies_specifications: string
  integration_requirements: string
  other_requirements: string
  references: string
}

interface WebsiteDetails {
  web_address: string
  current_cms: StringIterator
  preferred_cms: string
}

interface KeyDates {
  [key: string]: string
}

interface Requirements {
  [key: string]: string
}

interface SubmissionDetails {
  submission_deadline: string
  submission_instructions: string
}

interface Checklist {
  [key: string]: boolean
}

interface Commercials {
  [key: string]: string
}

interface Flags {
  [key: string]: string
}

interface StrategicSummary {
  overview: string
  key_differentiators: string
  risks_and_challenges: string
  recommended_approach: string
  resource_needs: string
  competitive_landscape: string
}

interface RFPData {
  strategic_summary: StrategicSummary
  "introduction/background": IntroBackground
  bid_summary: BidSummary
  key_dates: KeyDates
  work_portfolio: WorkPortfolio
  submission_details: SubmissionDetails
  checklist: Checklist
  commercials: Commercials
  flags: Flags
  requirements: Requirements
  website_details: WebsiteDetails
}

const renderDataItem = (item: any, label: string, showInterpreted: boolean, confidenceThreshold: number) => {
  // Handle the new data structure with confidence
  if (item && typeof item === 'object' && 'value' in item) {
    const { value, confidence, is_interpreted } = item;
    
    // Apply filters
    if (confidence < confidenceThreshold) {
      return <dd className="mt-1 text-sm text-gray-400">Hidden (low confidence)</dd>;
    }
    
    if (is_interpreted && !showInterpreted) {
      return <dd className="mt-1 text-sm text-gray-400">Hidden (interpretation)</dd>;
    }
    
    // If no value, show "Not specified"
    if (!value) {
      return <dd className="mt-1 text-sm text-gray-400">Not specified</dd>;
    }
    
    // Determine color based on confidence
    let confidenceColor = "bg-gray-100";
    if (confidence > 0.8) {
      confidenceColor = "bg-green-100";
    } else if (confidence > 0.5) {
      confidenceColor = "bg-yellow-100";
    } else if (confidence > 0) {
      confidenceColor = "bg-red-100";
    }
    
    return (
      <div>
        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
        <div className="flex items-center mt-1 space-x-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${confidenceColor}`} 
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">{Math.round(confidence * 100)}%</span>
          {is_interpreted && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Interpreted
            </span>
          )}
        </div>
      </div>
    );
  }
  
  // Handle the old data structure (simple string)
  return <dd className="mt-1 text-sm text-gray-900">{item || 'Not specified'}</dd>;
};

export default function AnalysisPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [rfpData, setRfpData] = useState<RFPData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [similarityScore, setSimilarityScore] = useState<number | null>(null)
  const [showInterpreted, setShowInterpreted] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0)
  const params = useParams()

  const renderFilterControls = () => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
      <div className="bg-indigo-50 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Display Options</h2>
      </div>
      <div className="p-6 flex flex-wrap gap-6">
        <div className="flex items-center">
          <input
            id="show-interpreted"
            type="checkbox"
            checked={showInterpreted}
            onChange={(e) => setShowInterpreted(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="show-interpreted" className="ml-2 block text-sm text-gray-900">
            Show interpreted data
          </label>
        </div>
        
        <div className="w-64">
          <label htmlFor="confidence" className="block text-sm font-medium text-gray-700">
            Minimum confidence:
          </label>
          <select
            id="confidence"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value={0}>Show all</option>
            <option value={0.3}>Low confidence (30%+)</option>
            <option value={0.5}>Medium confidence (50%+)</option>
            <option value={0.7}>High confidence (70%+)</option>
          </select>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const sampleText = `Request for Proposal (RFP)
        Company: TechCorp Solutions
        Budget: $500,000
        Deadline: December 31, 2024
        
        We are seeking proposals for implementing an enterprise-wide CRM solution.
        Key requirements include Salesforce integration, data migration, and staff training.`

        // Log what we're sending
        console.log('Sending request with:', { text: sampleText });

        const response = await fetch('http://localhost:8000/api/rfp/analyze/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({ 
            rfp_text: sampleText  // Changed from 'text' to 'rfp_text'
          })
        });

        if (!response.ok) {
          // Log the error response
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch analysis: ${errorText}`);
        }

        const data = await response.json();
        console.log('Received data:', data);
        setRfpData(data.result);
      } catch (err) {
        console.error('Full error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalysis();
  }, [params.id]);

  useEffect(() => {
    const fetchSimilarityScore = async () => {
      try {
        console.log('Fetching similarity score...');
        const response = await fetch('http://localhost:8000/api/rfp/compare-indexes/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);
        
        if (data.success) {
          console.log('Setting similarity score:', data.similarity_score);
          setSimilarityScore(data.similarity_score);
        } else {
          console.error('Failed to fetch similarity score:', data.error);
        }
      } catch (err) {
        console.error('Error fetching similarity score:', err);
      }
    };
  
    fetchSimilarityScore();
  }, []);

  const handleDownloadReport = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/rfp/download-report/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rfpData }),
      });
      
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rfp_analysis_report.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!rfpData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">No analysis data found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleDownloadReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Download Report
          </button>
        </div>
        {isLoading ? (
          <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyzing Your RFP
              </h3>
              <p className="text-gray-500">
                This will just take a moment...
              </p>
            </div>
          </div>
        ) : (
          <>
            {renderFilterControls()}

            {/* Similarity Score Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="bg-green-100 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Similarity Score</h2>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-4xl font-bold text-green-600">
                    {similarityScore !== null ? `${(similarityScore * 100).toFixed(0)}%` : 'N/A'}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Match with your existing RFP repository</p>
                    <p className="text-xs text-gray-400 mt-1">Based on RFP requirements analysis with the existing RFP repository</p>
                  </div>
                </div>
                <div className="bg-green-50 rounded-full p-3">
                  <svg 
                    className="h-8 w-8 text-green-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Add this right after the similarity score section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Data Confidence Legend</h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                    <span className="text-sm">High confidence (80-100%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
                    <span className="text-sm">Medium confidence (50-80%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                    <span className="text-sm">Low confidence (1-50%)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                      Interpreted
                    </span>
                    <span className="text-sm">AI interpretation (not directly stated in RFP)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Summary Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="bg-blue-100 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Strategic Summary</h2>
              </div>
              <div className="p-6 space-y-6">
                {rfpData && rfpData.strategic_summary && Object.entries(rfpData.strategic_summary).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-4">
                    <dt className="text-sm font-medium text-gray-500 capitalize mb-2">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    {renderDataItem(value, key, showInterpreted, confidenceThreshold)}
                  </div>
                ))}
              </div>
            </div>

            {/* Introduction/Background Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Introduction/Background</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {rfpData && rfpData["introduction/background"] && Object.entries(rfpData["introduction/background"]).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-2">
                    <dt className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    {renderDataItem(value, key, showInterpreted, confidenceThreshold)}
                  </div>
                ))}
              </div>
            </div>

            {/* Bid Summary Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Bid Summary</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(rfpData.bid_summary || {}).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-200 pb-4">
                      <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                      {renderDataItem(value, key, showInterpreted, confidenceThreshold)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Dates Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Key Dates</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(rfpData.key_dates || {}).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-200 pb-4">
                      <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                      {renderDataItem(value, key, showInterpreted, confidenceThreshold)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Work Portfolio Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Work Portfolio</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {rfpData && rfpData.work_portfolio && Object.entries(rfpData.work_portfolio).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-2">
                    <dt className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    {renderDataItem(value, key, showInterpreted, confidenceThreshold)}
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Requirements</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(rfpData.requirements || {}).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-200 pb-4">
                      <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                      {renderDataItem(value, key, showInterpreted, confidenceThreshold)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Website Details Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-pink-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Website Details</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {rfpData && rfpData.website_details && Object.entries(rfpData.website_details).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-2">
                    <dt className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    {renderDataItem(value, key, showInterpreted, confidenceThreshold)}
                  </div>
                ))}
              </div>
            </div>

            {/* Commercials Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Commercials</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(rfpData.commercials || {}).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-200 pb-4">
                      <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                      {renderDataItem(value, key, showInterpreted, confidenceThreshold)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Flags Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Flags</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(rfpData.flags || {}).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-200 pb-4">
                      <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                      {renderDataItem(value, key, showInterpreted, confidenceThreshold)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
        <ChatPopup />
      </div>
    </div>
  )
}