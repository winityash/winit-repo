'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Settings as SettingsIcon, FileText, Mail, ChevronLeft, ChevronRight, Download, Clock, AlertCircle, ArrowUp, ArrowDown, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import DateFilter from './DateFilter';
import Dialog from './Dialog';

export default function LPOQueue() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    urgency_level: 'all',
    customer: '',
    sla_status: 'all',
    channel: 'all'
  });

  const [sorting, setSorting] = useState({
    sort_by: 'urgency',
    sort_order: 'desc'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20
  });

  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [currentLPO, setCurrentLPO] = useState(null);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    fetchQueueData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQueueData();
    }, 30000);
    return () => clearInterval(interval);
  }, [filters, sorting, pagination.page, selectedDate]);

  useEffect(() => {
    // Extract unique customers for filter dropdown
    const uniqueCustomers = [...new Set(queueData.map(item => item.customer))].filter(Boolean);
    setAvailableCustomers(uniqueCustomers);
  }, [queueData]);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        urgency_level: filters.urgency_level,
        sla_status: filters.sla_status,
        channel: filters.channel,
        sort_by: sorting.sort_by,
        sort_order: sorting.sort_order
      });

      if (filters.customer) {
        queryParams.append('customer', filters.customer);
      }

      if (selectedDate) {
        queryParams.append('date', selectedDate);
      }

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
              // Use attachment_extractions if available
              attachmentExtractions = lpo.attachment_extractions;
            } else if (lpo.attachments && lpo.attachments.length > 0) {
              // Fallback: create attachment_extractions from attachments
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
              slaDeadline: lpo.sla_deadline,
              rawData: lpo // Keep raw data for details
            };
          });

          setQueueData(transformedData);
          setPagination(prev => ({
            ...prev,
            ...paginationData,
            page: paginationData.current_page
          }));
        }
      } else {
        throw new Error('Failed to fetch LPO queue data');
      }
    } catch (err) {
      console.error('Error fetching LPO queue data:', err);
      setError(err.message);
      setQueueData([]);
    } finally {
      setLoading(false);
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

  const handleDownloadFile = (attachment) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';
    const link = document.createElement('a');
    link.href = `${baseUrl}${attachment.url}?ngrok-skip-browser-warning=true`;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (column) => {
    setSorting(prev => ({
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };


  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchQueueData();
  };

  const resetFilters = () => {
    setFilters({
      urgency_level: 'all',
      customer: '',
      sla_status: 'all',
      channel: 'all'
    });
    setSorting({
      sort_by: 'urgency',
      sort_order: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
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

  const getSortIcon = (column) => {
    if (sorting.sort_by !== column) return null;
    return sorting.sort_order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <DateFilter
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          label="Created Date"
        />
        <div className="filter-group" style={{ minWidth: 'auto', flex: '1 1 auto' }}>
          <label className="filter-label" style={{ fontSize: '0.75rem' }}>URGENCY LEVEL</label>
          <select
            className="filter-select"
            value={filters.urgency_level}
            onChange={(e) => handleFilterChange('urgency_level', e.target.value)}
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.5rem' }}
          >
            <option value="all">All Urgency Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="filter-group" style={{ minWidth: 'auto', flex: '1 1 auto' }}>
          <label className="filter-label" style={{ fontSize: '0.75rem' }}>CUSTOMER</label>
          <select
            className="filter-select"
            value={filters.customer}
            onChange={(e) => handleFilterChange('customer', e.target.value)}
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.5rem' }}
          >
            <option value="">All Customers</option>
            {availableCustomers.map(customer => (
              <option key={customer} value={customer}>{customer}</option>
            ))}
          </select>
        </div>
        <div className="filter-group" style={{ minWidth: 'auto', flex: '1 1 auto' }}>
          <label className="filter-label" style={{ fontSize: '0.75rem' }}>SLA STATUS</label>
          <select
            className="filter-select"
            value={filters.sla_status}
            onChange={(e) => handleFilterChange('sla_status', e.target.value)}
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.5rem' }}
          >
            <option value="all">All SLA Status</option>
            <option value="breached">Breached</option>
            <option value="near_breach">Near Breach</option>
            <option value="on_track">On Track</option>
          </select>
        </div>
        <div className="filter-group" style={{ minWidth: 'auto', flex: '1 1 auto' }}>
          <label className="filter-label" style={{ fontSize: '0.75rem' }}>CHANNEL</label>
          <select
            className="filter-select"
            value={filters.channel}
            onChange={(e) => handleFilterChange('channel', e.target.value)}
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.5rem' }}
          >
            <option value="all">All Channels</option>
            <option value="Email">Email</option>
            <option value="EDI">EDI</option>
            <option value="Portal">Portal</option>
            <option value="API">API</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={applyFilters} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>Apply Filters</button>
        <button className="btn btn-secondary" onClick={resetFilters} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>Reset</button>
      </div>

      {/* Queue Management Controls */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <h3>LPO Processing Queue</h3>
            <p>Sortable queue with bulk actions and real-time updates</p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={fetchQueueData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="btn-text">{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <div className="card-content">
          {error && (
            <div className="alert alert-danger mb-4">
              <span>Error loading LPO queue: {error}</span>
            </div>
          )}
          {loading && queueData.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p>Loading LPO queue data...</p>
            </div>
          ) : queueData.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No LPO items found</h3>
              <p className="text-gray-500">There are currently no items in the LPO processing queue.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>
                    <div
                      className="sortable-header"
                      onClick={() => handleSortChange('timestamp')}
                    >
                      TIMESTAMP {getSortIcon('timestamp')}
                    </div>
                  </th>
                  <th>
                    <div
                      className="sortable-header"
                      onClick={() => handleSortChange('lpo_id')}
                    >
                      LPO ID {getSortIcon('lpo_id')}
                    </div>
                  </th>
                  <th>
                    <div
                      className="sortable-header"
                      onClick={() => handleSortChange('customer')}
                    >
                      CUSTOMER {getSortIcon('customer')}
                    </div>
                  </th>
                  <th>
                    <div
                      className="sortable-header"
                      onClick={() => handleSortChange('processing_time')}
                    >
                      PROCESSING TIME {getSortIcon('processing_time')}
                    </div>
                  </th>
                  <th>
                    <div
                      className="sortable-header"
                      onClick={() => handleSortChange('status')}
                    >
                      STATUS {getSortIcon('status')}
                    </div>
                  </th>
                  <th>DOCUMENTS</th>
                </tr>
              </thead>
              <tbody>
                {queueData.map((row) => {
                  return (
                    <tr
                      key={row.id}
                      className="clickable-row"
                      onClick={() => handleViewDetails(row)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                      <td>{row.timestamp ? new Date(row.timestamp).toLocaleString() : 'N/A'}</td>
                      <td className="font-semibold" title={row.id}>{row.id.substring(0, 12)}</td>
                      <td title={row.customer}>{row.customer}</td>
                      <td>{row.processingTime}</td>
                      <td>{getStatusBadge(row.status)}</td>
                      <td>
                        <span className="badge badge-info">
                          {row.attachmentExtractions?.length || 0} {row.attachmentExtractions?.length === 1 ? 'doc' : 'docs'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-container">
                <div className="pagination-info">
                  <span>
                    Showing {((pagination.current_page - 1) * pagination.items_per_page) + 1} to{' '}
                    {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of{' '}
                    {pagination.total_items} entries
                  </span>
                </div>
                <div className="pagination-controls">
                  <button
                    className={`pagination-btn ${pagination.current_page === 1 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.current_page === 1}
                    title="First page"
                  >
                    ««
                  </button>
                  <button
                    className={`pagination-btn ${pagination.current_page === 1 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="page-numbers">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.total_pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.current_page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.current_page >= pagination.total_pages - 2) {
                        pageNum = pagination.total_pages - 4 + i;
                      } else {
                        pageNum = pagination.current_page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`page-number ${pageNum === pagination.current_page ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    className={`pagination-btn ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.total_pages}
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    className={`pagination-btn ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(pagination.total_pages)}
                    disabled={pagination.current_page === pagination.total_pages}
                    title="Last page"
                  >
                    »»
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';
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
                                    onMouseEnter={(e) => {
                                      if (!e.currentTarget.classList.contains('active')) {
                                        e.currentTarget.style.backgroundColor = '#007bff';
                                        e.currentTarget.style.color = 'white';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!e.currentTarget.classList.contains('active')) {
                                        e.currentTarget.style.backgroundColor = '#e9ecef';
                                        e.currentTarget.style.color = '#333';
                                      }
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
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';

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
    </>
  );
}