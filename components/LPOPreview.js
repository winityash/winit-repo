'use client';

import { useState, useEffect } from 'react';
import { Eye, ArrowRight, FileText, FileSpreadsheet, Clock, AlertCircle, ChevronLeft, ChevronRight, Download, RefreshCw, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import Dialog from './Dialog';

export default function LPOPreview({ onNavigate }) {
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 5
  });
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [currentLPO, setCurrentLPO] = useState(null);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [excelData, setExcelData] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    fetchPreviewData(1);
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPreviewData(pagination.current_page);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPreviewData = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '5',
        urgency_level: 'all',
        sla_status: 'all',
        channel: 'all',
        sort_by: 'urgency',
        sort_order: 'desc'
      });

      const response = await fetch(`/api/lpo/queue?${queryParams}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          const { lpos, pagination: paginationData } = result.data;

          // Transform the real LPO data
          const transformedData = lpos.map(lpo => {
            // Handle both attachment_extractions and attachments
            let attachmentExtractions = [];

            if (lpo.attachment_extractions && lpo.attachment_extractions.length > 0) {
              attachmentExtractions = lpo.attachment_extractions;
            } else if (lpo.attachments && lpo.attachments.length > 0) {
              attachmentExtractions = lpo.attachments.map(att => ({
                attachment: {
                  name: att.name,
                  url: att.url,
                  exists: true
                },
                extraction: {
                  name: att.name.replace(/\.[^/.]+$/, '.json'),
                  url: `/processed/${lpo.lpo_id}.json`,
                  exists: true
                }
              }));
            }

            return {
              id: lpo.lpo_id,
              customer: lpo.customer,
              channel: lpo.channel,
              amount: lpo.amount.formatted || `${lpo.amount.currency} ${lpo.amount.value}`,
              urgency: lpo.urgency.score,
              urgencyLevel: lpo.urgency.level,
              status: lpo.status,
              processingTime: lpo.processing_time,
              attachments: lpo.attachments || [],
              attachmentExtractions: attachmentExtractions,
              timestamp: lpo.timestamp,
              slaDeadline: lpo.sla_deadline
            };
          });

          setPreviewData(transformedData);
          setPagination(paginationData || {
            current_page: page,
            total_pages: 1,
            total_items: transformedData.length,
            items_per_page: 5
          });
        }
      } else {
        throw new Error('Failed to fetch LPO data');
      }
    } catch (err) {
      console.error('Error fetching LPO preview data:', err);
      // Show empty state instead of mock data
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchPreviewData(newPage);
    }
  };

  const handleViewDetails = async (lpo) => {
    if (!lpo.attachmentExtractions || lpo.attachmentExtractions.length === 0) {
      setDialogConfig({
        isOpen: true,
        message: 'This LPO has no documents attached.',
        type: 'info',
        title: 'No Documents'
      });
      return;
    }

    setCurrentLPO(lpo);
    setCurrentDocumentIndex(0);
    setExcelData(null);
    setShowDocumentViewer(true);

    // Load Excel file if it's an Excel file
    const attachment = lpo.attachmentExtractions[0].attachment;
    const fileExtension = attachment.name.split('.').pop().toLowerCase();
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      await loadExcelFile(attachment);
    }
  };

  const loadExcelFile = async (attachment) => {
    try {
      setExcelLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://248e92713d99.ngrok-free.app';
      const response = await fetch(`${baseUrl}${attachment.url}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Excel file');
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const sheetNames = workbook.SheetNames;
      const sheets = {};

      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        sheets[sheetName] = jsonData;
      });

      setExcelData({ sheetNames, sheets });
    } catch (err) {
      console.error('Error loading Excel file:', err);
      setExcelData(null);
    } finally {
      setExcelLoading(false);
    }
  };

  const handleNextDocument = async () => {
    if (currentLPO && currentDocumentIndex < currentLPO.attachmentExtractions.length - 1) {
      const newIndex = currentDocumentIndex + 1;
      setCurrentDocumentIndex(newIndex);
      setExcelData(null);

      // Load Excel file if it's an Excel file
      const attachment = currentLPO.attachmentExtractions[newIndex].attachment;
      const fileExtension = attachment.name.split('.').pop().toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        await loadExcelFile(attachment);
      }
    }
  };

  const handlePreviousDocument = async () => {
    if (currentDocumentIndex > 0) {
      const newIndex = currentDocumentIndex - 1;
      setCurrentDocumentIndex(newIndex);
      setExcelData(null);

      // Load Excel file if it's an Excel file
      const attachment = currentLPO.attachmentExtractions[newIndex].attachment;
      const fileExtension = attachment.name.split('.').pop().toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        await loadExcelFile(attachment);
      }
    }
  };

  const getUrgencyBadge = (urgency, level) => {
    const classes = {
      critical: 'badge-danger urgency-critical',
      high: 'badge-warning urgency-high',
      medium: 'badge-warning',
      low: 'badge-success'
    };

    const labels = {
      critical: urgency,
      high: urgency,
      medium: 'Medium',
      low: 'Low'
    };

    return <span className={`badge ${classes[level]}`}>{labels[level]}</span>;
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    let badgeClass = 'badge-secondary';

    if (statusLower === 'completed') badgeClass = 'badge-success';
    else if (statusLower === 'processing' || statusLower === 'in progress') badgeClass = 'badge-warning';
    else if (statusLower === 'pending') badgeClass = 'badge-info';
    else if (statusLower === 'failed') badgeClass = 'badge-danger';

    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  const getSLAStatus = (deadline) => {
    if (!deadline) return { text: 'N/A', class: 'badge-secondary' };

    const now = new Date();
    const slaDeadline = new Date(deadline);
    const hoursRemaining = (slaDeadline - now) / (1000 * 60 * 60);

    if (hoursRemaining < 0) return { text: 'Breached', class: 'badge-danger' };
    if (hoursRemaining < 2) return { text: 'Critical', class: 'badge-danger' };
    if (hoursRemaining < 6) return { text: 'Near Breach', class: 'badge-warning' };
    return { text: 'On Track', class: 'badge-success' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="text-sm text-gray-600">Loading LPO preview...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        {previewData.length === 0 && !loading ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No LPO data available</p>
            <button
              onClick={() => fetchPreviewData(1)}
              className="btn btn-primary mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Timestamp</th>
                  <th>LPO ID</th>
                  <th>Customer</th>
                  <th>Channel</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Processing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {previewData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((row) => {
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewDetails(row)}
                    >
                      <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                      <td>{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="font-semibold">{row.id.substring(0, 8)}</td>
                      <td>{row.customer}</td>
                      <td>{row.channel}</td>
                      <td>{getUrgencyBadge(row.urgency, row.urgencyLevel)}</td>
                      <td>{getStatusBadge(row.status)}</td>
                      <td>{row.processingTime}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => handleViewDetails(row)}
                            title="View Details"
                          >
                            <Eye className="w-[14px] h-[14px]" />
                          </button>
                          {row.attachments && row.attachments.length > 0 && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem' }}
                              title="Download Attachments"
                              onClick={(e) => {
                                e.stopPropagation();
                                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';
                                const link = document.createElement('a');
                                link.href = `${baseUrl}${row.attachments[0].url}?ngrok-skip-browser-warning=true`;
                                link.download = row.attachments[0].name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="w-[14px] h-[14px]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 px-4">
              <div className="text-sm text-gray-600">
                Showing {((pagination.current_page - 1) * pagination.items_per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of{' '}
                {pagination.total_items} entries
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="flex items-center px-3">
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.total_pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Document Viewer Modal */}
      {showDocumentViewer && currentLPO && currentLPO.attachmentExtractions && currentLPO.attachmentExtractions.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setShowDocumentViewer(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '98vw',
              height: '98vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              color: 'white',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                  <FileText className="w-6 h-6" style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  LPO: {currentLPO.customer} - {currentLPO.id.substring(0, 12)}
                </h3>
                {currentLPO.attachmentExtractions.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={handlePreviousDocument}
                      disabled={currentDocumentIndex === 0}
                      style={{
                        backgroundColor: currentDocumentIndex === 0 ? '#666' : 'white',
                        color: currentDocumentIndex === 0 ? '#999' : 'black',
                        border: 'none',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        cursor: currentDocumentIndex === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span style={{ fontSize: '0.875rem', color: 'white' }}>
                      {currentDocumentIndex + 1} / {currentLPO.attachmentExtractions.length}
                    </span>
                    <button
                      onClick={handleNextDocument}
                      disabled={currentDocumentIndex === currentLPO.attachmentExtractions.length - 1}
                      style={{
                        backgroundColor: currentDocumentIndex === currentLPO.attachmentExtractions.length - 1 ? '#666' : 'white',
                        color: currentDocumentIndex === currentLPO.attachmentExtractions.length - 1 ? '#999' : 'black',
                        border: 'none',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        cursor: currentDocumentIndex === currentLPO.attachmentExtractions.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => {
                    const attachment = currentLPO.attachmentExtractions[currentDocumentIndex].attachment;
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://248e92713d99.ngrok-free.app';
                    const link = document.createElement('a');
                    link.href = `${baseUrl}${attachment.url}?ngrok-skip-browser-warning=true`;
                    link.download = attachment.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setShowDocumentViewer(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid white',
                    borderRadius: '50%',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = 'black';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split View Content */}
            <div style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              gap: '1rem',
              padding: '0.5rem',
              backgroundColor: '#f0f0f0',
              minHeight: 0
            }}>
              {/* Left Side - Original File */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                minHeight: 0,
                height: '100%'
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #dee2e6',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>Original Document</span>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                    {currentLPO.attachmentExtractions[currentDocumentIndex].attachment.name}
                  </span>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {(() => {
                    const attachment = currentLPO.attachmentExtractions[currentDocumentIndex].attachment;
                    const fileExtension = attachment.name.split('.').pop().toLowerCase();
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://248e92713d99.ngrok-free.app';

                    if (fileExtension === 'pdf') {
                      return (
                        <iframe
                          src={`${baseUrl}${attachment.url}?ngrok-skip-browser-warning=true`}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                          }}
                          title={attachment.name}
                        />
                      );
                    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                      if (excelLoading) {
                        return (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Clock className="w-12 h-12 animate-spin mb-4" style={{ color: '#007bff' }} />
                            <p style={{ color: '#666' }}>Loading Excel file...</p>
                          </div>
                        );
                      } else if (excelData) {
                        return (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {excelData.sheetNames.length > 1 && (
                              <div style={{ display: 'flex', gap: '5px', padding: '10px', borderBottom: '2px solid #e0e0e0', flexWrap: 'wrap', backgroundColor: '#f8f9fa' }}>
                                {excelData.sheetNames.map((name, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      document.querySelectorAll('.excel-sheet-tab').forEach(tab => tab.classList.remove('active'));
                                      document.querySelectorAll('.excel-sheet-content').forEach(content => content.style.display = 'none');
                                      document.getElementById(`sheet-tab-${index}`).classList.add('active');
                                      document.getElementById(`sheet-content-${index}`).style.display = 'block';
                                    }}
                                    id={`sheet-tab-${index}`}
                                    className="excel-sheet-tab"
                                    style={{
                                      padding: '8px 16px',
                                      background: index === 0 ? '#007bff' : '#e9ecef',
                                      color: index === 0 ? 'white' : '#333',
                                      border: '1px solid #dee2e6',
                                      borderRadius: '4px 4px 0 0',
                                      cursor: 'pointer',
                                      fontSize: '13px',
                                      fontWeight: index === 0 ? '600' : '400',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    {name}
                                  </button>
                                ))}
                              </div>
                            )}
                            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
                              {excelData.sheetNames.map((sheetName, sheetIndex) => (
                                <div
                                  key={sheetIndex}
                                  id={`sheet-content-${sheetIndex}`}
                                  className="excel-sheet-content"
                                  style={{ display: sheetIndex === 0 ? 'block' : 'none', padding: '10px' }}
                                >
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                      <tr>
                                        {excelData.sheets[sheetName][0]?.map((header, colIndex) => (
                                          <th key={colIndex} style={{
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            padding: '10px',
                                            textAlign: 'left',
                                            border: '1px solid #dee2e6',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 10,
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {header}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {excelData.sheets[sheetName].slice(1).map((row, rowIndex) => (
                                        <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                          {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} style={{
                                              border: '1px solid #dee2e6',
                                              padding: '8px 10px',
                                              textAlign: 'left'
                                            }}>
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem'
                          }}>
                            <AlertCircle className="w-16 h-16 mb-4" style={{ color: '#dc3545' }} />
                            <p style={{ color: '#666', fontSize: '14px', marginBottom: '1rem' }}>
                              Failed to load Excel file
                            </p>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `${baseUrl}${attachment.url}?ngrok-skip-browser-warning=true`;
                                link.download = attachment.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              style={{
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <Download className="w-4 h-4" />
                              Download to View
                            </button>
                          </div>
                        );
                      }
                    } else {
                      return (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2rem'
                        }}>
                          <FileText className="w-16 h-16 mb-4" style={{ color: '#6c757d' }} />
                          <p style={{ color: '#666', fontSize: '14px', marginBottom: '1rem' }}>
                            Preview not available for .{fileExtension} files
                          </p>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `${baseUrl}${attachment.url}?ngrok-skip-browser-warning=true`;
                              link.download = attachment.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            style={{
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Download to View
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Right Side - Extracted Content */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                minHeight: 0,
                height: '100%'
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #dee2e6',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>Extracted Content (JSON)</span>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                    {currentLPO.attachmentExtractions[currentDocumentIndex].extraction.name}
                  </span>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {(() => {
                    const extraction = currentLPO.attachmentExtractions[currentDocumentIndex].extraction;
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://248e92713d99.ngrok-free.app';

                    if (extraction.exists) {
                      return (
                        <iframe
                          src={`${baseUrl}${extraction.url}?ngrok-skip-browser-warning=true`}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                          }}
                          title={extraction.name}
                        />
                      );
                    } else {
                      return (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2rem'
                        }}>
                          <AlertCircle className="w-16 h-16 mb-4" style={{ color: '#ffc107' }} />
                          <p style={{ color: '#666', fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem' }}>
                            No Extracted Content Available
                          </p>
                          <p style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>
                            This document has not been processed yet or extraction failed.
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig({ isOpen: false, message: '' })}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type || 'info'}
      />
    </div>
  );
}