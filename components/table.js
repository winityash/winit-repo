'use client';

import { useState, useEffect } from 'react';
import { BsFiletypeXlsx, BsFiletypePdf } from 'react-icons/bs';
import { FaPaperclip } from 'react-icons/fa';
// Removed framer-motion import

export default function TableComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Removed loading state
        const controller = new AbortController();
        // Removed timeout

        const response = await fetch('/api/dashboard/performance?metric_type=processing_time&days=7&include_email_details=true', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        // Removed timeout clear
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Validate response structure
        if (!result || !Array.isArray(result.data)) {
          console.warn('Invalid response format, using empty data array');
          setData([]);
        } else {
          setData(result.data);
        }
        
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err.message || 'Failed to fetch data');
        }
        console.error('Error fetching table data:', err);
        // Keep existing data if available, otherwise set empty array
        if (!data || data.length === 0) {
          setData([]);
        }
      } finally {
        // Removed loading state
      }
    };

    fetchData();
    // Refresh data every 60 seconds (configurable via environment)
    // Removed auto-refresh interval
  }, []);

  const formatProcessingTime = (seconds) => {
    return `${parseFloat(seconds).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border border-green-400';
      case 'processing':
        return 'bg-[#3B82F6] text-white';
      case 'failed':
        return 'bg-red-50 text-red-700 border-2 border-red-400';
      case 'queued':
        return 'bg-yellow-50 text-yellow-700 border border-[#FCD34D]';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-300';
    }
  };

  const renderAttachments = (metadata) => {
    const attachmentCount = metadata?.attachment_count || 0;
    const pdfCount = metadata?.pdf_count || 0;
    const excelCount = metadata?.excel_count || 0;

    if (attachmentCount === 0) {
      return (
        <span className="text-xs text-gray-400">-</span>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2">
        {pdfCount > 0 && (
          <div className="flex items-center bg-red-50 px-2 py-1 rounded-lg border border-red-200">
            <BsFiletypePdf className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-red-600 ml-1">{pdfCount}</span>
          </div>
        )}
        {excelCount > 0 && (
          <div className="flex items-center bg-green-50 px-2 py-1 rounded-lg border border-green-200">
            <BsFiletypeXlsx className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-700 ml-1">{excelCount}</span>
          </div>
        )}
        {attachmentCount > pdfCount + excelCount && (
          <div className="flex items-center bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
            <FaPaperclip className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-blue-600 ml-1">{attachmentCount - pdfCount - excelCount}</span>
          </div>
        )}
      </div>
    );
  };

  const openModal = (item) => {
    setSelectedEmail(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmail(null);
  };

  const generateEmailContent = (item) => {
    // Mock content extraction for emails without attachments
    if ((item.metadata?.attachment_count || 0) === 0) {
      return `Email content extracted from: ${item.email_details?.subject}

This email was processed without attachments. The system extracted the following information:

- Processing started at: ${new Date(item.email_details?.processing_started_at).toLocaleString()}
- Processing completed at: ${new Date(item.email_details?.processing_completed_at).toLocaleString()}
- Total processing time: ${item.value} seconds

The email content was successfully parsed and relevant information was extracted for further processing.`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-white rounded-lg border-2 border-gray-200">
        <div className="text-center">
          <div className="h-12 w-12 border-b-2 border-[#070E42] mx-auto mb-4"></div>
          <div className="text-lg font-medium" style={{ color: '#070E42' }}>Loading performance data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 bg-white rounded-lg border-2 border-gray-200">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="#070E42" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-lg font-medium" style={{ color: '#070E42' }}>Error loading data</div>
          <div className="text-sm mt-1" style={{ color: '#070E42' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: 'none',
        borderRadius: '16px'
      }}
    >
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Order Extraction Processing KPI</h2>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600">Live Data Stream</span>
            </div>
            <div className="text-gray-700">
              <span className="font-medium">{data.length}</span>
              <span className="text-gray-500 ml-1">Total Records</span>
            </div>
            <div className="text-gray-700">
              <span className="font-medium">
                {data.length > 0 ? (data.reduce((sum, item) => sum + parseFloat(item.value), 0) / data.length).toFixed(2) + 's' : '0s'}
              </span>
              <span className="text-gray-500 ml-1">Avg Processing</span>
            </div>
            <div className="text-gray-700">
              <span className="font-medium">
                {data.reduce((sum, item) => sum + (item.metadata?.attachment_count || 0), 0)}
              </span>
              <span className="text-gray-500 ml-1">Total Attachments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="p-6 bg-white">
        <div
          className="overflow-hidden" 
          style={{ 
            backgroundColor: '#ffffff'
          }}
        >
          {/* Responsive Table Container with Fixed Height and Scrolling */}
          <div
            className="overflow-y-auto scrollable-table"
            style={{
              maxHeight: 'calc(100vh - 350px)',
              minHeight: '400px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#3B82F6 #f3f4f6'
            }}
          >
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky top-0 bg-gray-50 z-10">Email Address</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky top-0 bg-gray-50 z-10">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky top-0 bg-gray-50 z-10 whitespace-nowrap">Processing Time</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 sticky top-0 bg-gray-50 z-10">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 sticky top-0 bg-gray-50 z-10">Attachments</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky top-0 bg-gray-50 z-10">Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.map((item, index) => (
                  <tr
                    key={item.email_id || index}
                    className={`transition-all duration-200 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                    onClick={() => openModal(item)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate" title={item.email_details?.sender || item.email_id}>
                            {item.email_details?.sender || item.email_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[250px]" title={item.email_details?.subject}>
                          {item.email_details?.subject || 'No Subject'}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-1">
                          Received: {item.email_details?.received_at ? new Date(item.email_details.received_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900 bg-green-100 px-2 py-1 rounded-full">
                          {formatProcessingTime(item.value)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(item.email_details?.processing_status)}`}>
                        <span className="w-2 h-2 rounded-full mr-2 ${item.email_details?.processing_status === 'completed' ? 'bg-green-400' : item.email_details?.processing_status === 'processing' ? 'bg-blue-400' : item.email_details?.processing_status === 'failed' ? 'bg-red-400' : 'bg-gray-400'}"></span>
                        {item.email_details?.processing_status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center space-x-1">
                        {(item.metadata?.attachment_count || 0) > 0 ? (
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">{item.metadata.attachment_count}</span>
                            {renderAttachments(item.metadata)}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No files</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* No Data Message */}
      {data.length === 0 && !loading && (
        <div className="p-6 bg-white">
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
            </svg>
            <h3 className="text-lg font-medium mb-2 text-gray-700">No data available</h3>
            <p className="text-gray-500">There are no email processing records to display at the moment.</p>
          </div>
        </div>
      )}

    </div>

    {/* Modal */}
    {showModal && selectedEmail && (
      <div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
        onClick={closeModal}
      >
        <div
          className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Modal Header */}
            <div className="px-6 py-4 text-white flex items-center justify-between" style={{ backgroundColor: '#070E42' }}>
              <div>
                <h3 className="text-xl ">Email Details</h3>
                <p className="text-white opacity-70 text-sm mt-1">ID: {selectedEmail.email_id}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:text-white transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-gray-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Information Card */}
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <h4 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#070E42' }}>
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Email Information
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded p-3">
                      <h5 className="text-sm font-medium text-gray-600">Subject</h5>
                      <p className="mt-1 text-gray-900 font-medium">{selectedEmail.email_details?.subject || ''}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3">
                      <h5 className="text-sm font-medium text-gray-600">Sender</h5>
                      <p className="mt-1 text-gray-900">{selectedEmail.email_details?.sender || ''}</p>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="bg-gray-50 rounded-lg p-4 flex-1 mr-2">
                        <h5 className="text-sm font-medium text-gray-600">Status</h5>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(selectedEmail.email_details?.processing_status)}`}>
                          {selectedEmail.email_details?.processing_status || 'unknown'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 flex-1 ml-2">
                        <h5 className="text-sm font-medium text-gray-600">Processing Time</h5>
                        <p className="mt-2 text-lg  text-blue-600">{formatProcessingTime(selectedEmail.value)}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded p-3">
                      <h5 className="text-sm font-medium text-gray-600">Attachments</h5>
                      <div className="mt-2">
                        {renderAttachments(selectedEmail.metadata)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Processing Information Card */}
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <h4 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#070E42' }}>
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Processing Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                      <h5 className="text-sm font-medium text-green-800">Processing Started</h5>
                      <p className="mt-1 text-green-700 font-mono text-sm">
                        {selectedEmail.email_details?.processing_started_at 
                          ? new Date(selectedEmail.email_details.processing_started_at).toLocaleString()
                          : ''
                        }
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                      <h5 className="text-sm font-medium text-blue-800">Processing Completed</h5>
                      <p className="mt-1 text-blue-700 font-mono text-sm">
                        {selectedEmail.email_details?.processing_completed_at 
                          ? new Date(selectedEmail.email_details.processing_completed_at).toLocaleString()
                          : ''
                        }
                      </p>
                    </div>

                    {selectedEmail.email_details?.error_message && (
                      <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                        <h5 className="text-sm font-medium text-red-800">Error Message</h5>
                        <p className="mt-1 text-red-700">{selectedEmail.email_details.error_message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Extracted Content Section */}
              {generateEmailContent(selectedEmail) && (
                <div className="mt-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <h4 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#070E42' }}>
                      <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      Extracted Content
                    </h4>
                    <div className="rounded-lg p-6 border" style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }}>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {generateEmailContent(selectedEmail)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachment Details */}
              {(selectedEmail.metadata?.attachment_count || 0) > 0 && (
                <div className="mt-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <h4 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#070E42' }}>
                      <svg className="w-5 h-5 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      Attachment Summary
                    </h4>
                    <div className="rounded-lg p-6 border" style={{ backgroundColor: '#FFEAA7', borderColor: '#FCD34D' }}>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center bg-white rounded-lg p-4">
                          <div className="text-2xl  text-blue-600 mb-1">{selectedEmail.metadata?.attachment_count || 0}</div>
                          <div className="text-xs text-gray-600 font-medium">Total Attachments</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4">
                          <div className="text-2xl  text-red-600 mb-1">{selectedEmail.metadata?.pdf_count || 0}</div>
                          <div className="text-xs text-gray-600 font-medium">PDF Files</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4">
                          <div className="text-2xl  text-green-600 mb-1">{selectedEmail.metadata?.excel_count || 0}</div>
                          <div className="text-xs text-gray-600 font-medium">Excel Files</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4">
                          <div className="text-2xl  text-gray-600 mb-1">
                            {(selectedEmail.metadata?.attachment_count || 0) - (selectedEmail.metadata?.pdf_count || 0) - (selectedEmail.metadata?.excel_count || 0)}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Other Files</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-center">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 text-white rounded font-medium transition-all duration-200 hover:opacity-80" style={{ backgroundColor: '#070E42' }}
                >
                  Close Details
                </button>
              </div>
            </div>
        </div>
      </div>
    )}

    </>
  );
}