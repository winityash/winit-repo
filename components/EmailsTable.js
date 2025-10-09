'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Mail, Paperclip, AlertTriangle, Search, Shield, Clock, X } from 'lucide-react';
import DateFilter from './DateFilter';

export default function EmailsTable() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsEmail, setDetailsEmail] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    limit: 100,
    include_spam: true,
    mailbox_folder: '',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'date_received', direction: 'asc' });

  useEffect(() => {
    fetchEmails();
  }, [filters.limit, filters.include_spam, filters.mailbox_folder, selectedDate]);

  useEffect(() => {
    console.log('Modal state changed:', showDetailsModal);
    console.log('Details email:', detailsEmail);
  }, [showDetailsModal, detailsEmail]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: filters.limit.toString(),
        include_spam: filters.include_spam.toString()
      });

      if (filters.mailbox_folder) {
        params.append('mailbox_folder', filters.mailbox_folder);
      }

      if (selectedDate) {
        params.append('date', selectedDate);
      }

      const response = await fetch(`/api/emails/all?${params.toString()}`);
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        setEmails(result.data);
      } else {
        setEmails([]);
        if (result.status === 'error') {
          setError(result.message);
        }
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err.message);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEmails = [...emails].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Handle date sorting
    if (sortConfig.key === 'date_received') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredEmails = sortedEmails.filter(email => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(searchLower) ||
      email.sender?.toLowerCase().includes(searchLower) ||
      email.recipient?.toLowerCase().includes(searchLower) ||
      email.email_id?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (email) => {
    if (email.is_spam) {
      return <span className="badge badge-danger">Spam</span>;
    }
    if (email.lpo_extracted) {
      return <span className="badge badge-success">LPO Extracted</span>;
    }
    if (email.has_lpo_data) {
      return <span className="badge badge-warning">LPO Pending</span>;
    }
    return <span className="badge badge-info">Normal</span>;
  };

  const getFilterCategoryBadge = (category) => {
    const colors = {
      'LPO': 'badge-primary',
      'SPAM': 'badge-danger',
      'NORMAL': 'badge-secondary'
    };
    return <span className={`badge ${colors[category] || 'badge-secondary'}`}>{category}</span>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };



  const renderAttachments = (email) => {
    if (!email.attachment_count || email.attachment_count === 0) {
      return <span className="text-gray-400">-</span>;
    }
    
    let attachmentNames = [];
    try {
      attachmentNames = email.attachment_names ? JSON.parse(email.attachment_names) : [];
    } catch (e) {
      console.error("Failed to parse attachment_names:", e);
      attachmentNames = [];
    }
    
    return (
      <div className="flex items-center space-x-1">
        <Paperclip className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium">{email.attachment_count}</span>
        {attachmentNames.length > 0 && (
          <div className="text-xs text-gray-500 truncate max-w-[100px]" title={attachmentNames.join(', ')}>
            {attachmentNames[0]}
            {attachmentNames.length > 1 && ` +${attachmentNames.length - 1}`}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <div className="text-lg font-medium text-gray-700">Loading emails...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="filter-bar">
        <DateFilter
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          label="Date"
        />
        <div className="filter-group">
          <label className="filter-label">Search</label>
          <div className="relative" style={{ position: 'relative' }}>
            <Search className="w-4 h-4 text-gray-400" style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              zIndex: 1
            }} />
            <input
              type="text"
              className="filter-select"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search emails..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">Mailbox Folder</label>
          <select
            className="filter-select"
            value={filters.mailbox_folder}
            onChange={(e) => setFilters({...filters, mailbox_folder: e.target.value})}
          >
            <option value="">All Folders</option>
            <option value="INBOX">INBOX</option>
            <option value="SENT">SENT</option>
            <option value="SPAM">SPAM</option>
            <option value="TRASH">TRASH</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Include Spam</label>
          <select
            className="filter-select"
            value={filters.include_spam.toString()}
            onChange={(e) => setFilters({...filters, include_spam: e.target.value === 'true'})}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Limit</label>
          <select
            className="filter-select"
            value={filters.limit}
            onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={fetchEmails}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <h3>All Stored Emails</h3>
            <p>Complete email repository with filtering and detailed view</p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.375rem',
              fontWeight: 500
            }}>
              Total: <span className="font-medium" style={{ color: '#1f2937', fontWeight: 600 }}>{filteredEmails.length}</span> emails
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dbeafe',
              borderRadius: '0.375rem',
              fontWeight: 500,
              color: '#1e40af'
            }}>
              LPO: <span className="font-medium" style={{ fontWeight: 600 }}>{filteredEmails.filter(e => e.filter_category === 'LPO').length}</span>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fef3c7',
              borderRadius: '0.375rem',
              fontWeight: 500,
              color: '#92400e'
            }}>
              Attachments: <span className="font-medium" style={{ fontWeight: 600 }}>{filteredEmails.filter(e => e.attachment_count > 0).length}</span>
            </div>
          </div>
        </div>
        
        <div className="card-content">
          {error && (
            <div className="alert alert-danger mb-4">
              <AlertTriangle className="w-4 h-4" />
              Error: {error}
            </div>
          )}
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('date_received')} className="cursor-pointer hover:bg-gray-50">
                    Timestamp {sortConfig.key === 'date_received' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email_id')} className="cursor-pointer hover:bg-gray-50">
                    Email ID {sortConfig.key === 'email_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('subject')} className="cursor-pointer hover:bg-gray-50">
                    Subject {sortConfig.key === 'subject' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('sender')} className="cursor-pointer hover:bg-gray-50">
                    Sender {sortConfig.key === 'sender' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Attachments</th>
                  <th style={{ width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmails.map((email) => {
                  const dateTime = formatDate(email.date_received);
                  return (
                    <tr
                      key={email.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        console.log('Row clicked for email:', email);
                        setDetailsEmail(email);
                        setShowDetailsModal(true);
                      }}
                    >
                      <td>
                        <div className="text-sm">
                          <div>{dateTime.date}</div>
                          <div className="text-xs text-gray-500">{dateTime.time}</div>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{email.email_id}</td>
                      <td>
                        <div className="max-w-[300px] truncate" title={email.subject}>
                          <div className="font-medium">{email.subject || 'No Subject'}</div>
                          <div className="text-xs text-gray-500 truncate">
                            To: {email.recipient}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="max-w-[200px] truncate" title={email.sender}>
                          {email.sender}
                        </div>
                      </td>
                      <td>{getStatusBadge(email)}</td>
                      <td>{getFilterCategoryBadge(email.filter_category)}</td>
                      <td>{renderAttachments(email)}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Details button clicked for email:', email);
                            setDetailsEmail(email);
                            setShowDetailsModal(true);
                            console.log('Modal state set to:', true);
                            console.log('Email set to:', email);
                          }}
                          title="Show Details"
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredEmails.length === 0 && !loading && (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No emails found</h3>
                <p className="text-gray-500">Try adjusting your filters or check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal === true && (
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
          onClick={() => {
            setShowDetailsModal(false);
            setDetailsEmail(null);
          }}
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
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#000000',
              color: 'white',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail className="w-6 h-6" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'white' }}>Email Details</h3>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setDetailsEmail(null);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid white',
                    borderRadius: '50%',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.querySelector('svg').style.color = 'black';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.querySelector('svg').style.color = 'white';
                  }}
                >
                  <X className="w-5 h-5" style={{ color: 'white' }} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#f9fafb',
              minHeight: 0
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Three Column Details */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Shield className="w-5 h-5 text-blue-600" />
                    Email Processing Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {/* Filter Reason */}
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h5 style={{
                        fontWeight: '600',
                        color: '#4b5563',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem'
                      }}>
                        <Shield className="w-4 h-4 mr-2 text-blue-600" />
                        Filter Reason
                      </h5>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        lineHeight: '1.5'
                      }}>
                        {detailsEmail?.filter_reason || 'No filter reason available'}
                      </p>
                    </div>

                    {/* Created At */}
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h5 style={{
                        fontWeight: '600',
                        color: '#4b5563',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem'
                      }}>
                        <Clock className="w-4 h-4 mr-2 text-green-600" />
                        Created At
                      </h5>
                      <div className="text-sm">
                        <div className="font-medium text-gray-800">
                          {detailsEmail?.created_at ? formatDate(detailsEmail.created_at).date :
                           detailsEmail?.date_received ? formatDate(detailsEmail.date_received).date : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {detailsEmail?.created_at ? formatDate(detailsEmail.created_at).time :
                           detailsEmail?.date_received ? formatDate(detailsEmail.date_received).time : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h5 style={{
                        fontWeight: '600',
                        color: '#4b5563',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem'
                      }}>
                        <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                        Confidence
                      </h5>
                      <div className="text-center">
                        <div className={`text-2xl font-bold mb-2 ${
                          (detailsEmail?.spam_confidence || 0) > 80 ? 'text-red-600' :
                          (detailsEmail?.spam_confidence || 0) > 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {detailsEmail?.spam_confidence || 0}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              (detailsEmail?.spam_confidence || 0) > 80 ? 'bg-red-500' :
                              (detailsEmail?.spam_confidence || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{width: `${detailsEmail?.spam_confidence || 0}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Email Info */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Mail className="w-5 h-5 text-purple-600" />
                    Email Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email ID:</span>
                        <span className="font-mono text-blue-600">{detailsEmail?.email_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subject:</span>
                        <span className="font-medium truncate max-w-[200px]" title={detailsEmail?.subject}>{detailsEmail?.subject || 'No Subject'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span>{getFilterCategoryBadge(detailsEmail?.filter_category)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span>{getStatusBadge(detailsEmail)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attachments:</span>
                        <span className="font-medium">{detailsEmail?.attachment_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sender:</span>
                        <span className="font-medium truncate max-w-[200px]" title={detailsEmail?.sender}>{detailsEmail?.sender || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'white',
              borderTop: '1px solid #e5e7eb',
              borderBottomLeftRadius: '0.5rem',
              borderBottomRightRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setDetailsEmail(null);
                  }}
                  style={{
                    backgroundColor: '#000000',
                    color: 'white',
                    border: '1px solid #000000',
                    borderRadius: '0.375rem',
                    padding: '0.625rem 2rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = 'black';
                    e.currentTarget.style.border = '1px solid black';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.border = '1px solid #000000';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
