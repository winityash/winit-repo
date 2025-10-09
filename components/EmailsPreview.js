'use client';

import { useState, useEffect } from 'react';
import { Mail, Paperclip, Clock, Shield, AlertTriangle, X } from 'lucide-react';

export default function EmailsPreview({ onNavigate }) {
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPreviewData();
  }, []);



  const fetchPreviewData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emails/all?limit=4&include_spam=true');
      const result = await response.json();

      if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
        // Sort by timestamp (date_received) in ascending order and take first 4
        const sortedData = result.data.sort((a, b) => new Date(a.date_received) - new Date(b.date_received));
        setPreviewData(sortedData.slice(0, 4));
      } else {
        // No data from API
        setPreviewData([]);
      }
    } catch (err) {
      console.error('Error fetching emails preview data:', err);
      // Show empty state on error
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  };

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

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
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

    return (
      <div className="flex items-center space-x-1">
        <Paperclip className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium">{email.attachment_count}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="text-sm text-gray-600">Loading emails preview...</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Email ID</th>
            <th>Subject</th>
            <th>Sender</th>
            <th>Status</th>
            <th>Category</th>
            <th>Attachments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {previewData.map((email) => (
            <tr
              key={email.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                console.log('Row clicked for email:', email);
                setSelectedEmail(email);
                setShowDetailsModal(true);
              }}
            >
              <td>
                <div className="text-sm">
                  <div>{formatDate(email.date_received).date}</div>
                  <div className="text-xs text-gray-500">{formatDate(email.date_received).time}</div>
                </div>
              </td>
              <td className="font-mono text-sm">{email.email_id}</td>
              <td>
                <div className="max-w-[200px] truncate" title={email.subject}>
                  <div className="font-medium">{email.subject || 'No Subject'}</div>
                </div>
              </td>
              <td>
                <div className="max-w-[150px] truncate" title={email.sender}>
                  {email.sender}
                </div>
              </td>
              <td>{getStatusBadge(email)}</td>
              <td>{getFilterCategoryBadge(email.filter_category)}</td>
              <td>{renderAttachments(email)}</td>
              <td>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Details button clicked for email:', email);
                    setSelectedEmail(email);
                    setShowDetailsModal(true);
                  }}
                  title="Show Details"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}
        onClick={() => {
          setShowDetailsModal(false);
          setSelectedEmail(null);
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            maxWidth: '672px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#000000',
            color: 'white',
            borderTopLeftRadius: '0.5rem',
            borderTopRightRadius: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail className="w-6 h-6" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'white' }}>Email Details</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
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
            maxHeight: 'calc(90vh - 180px)',
            backgroundColor: '#f9fafb'
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
                      {selectedEmail?.filter_reason || 'No filter reason available'}
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
                    </h5>                      <div className="text-sm">
                        <div className="font-medium text-gray-800">
                          {selectedEmail?.created_at ? formatDate(selectedEmail.created_at).date : 
                           selectedEmail?.date_received ? formatDate(selectedEmail.date_received).date : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedEmail?.created_at ? formatDate(selectedEmail.created_at).time : 
                           selectedEmail?.date_received ? formatDate(selectedEmail.date_received).time : 'N/A'}
                        </div>
                      </div>
                  </div>

                  {/* Spam Score */}
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
                      Spam Score
                    </h5>
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-2 ${                            (selectedEmail?.spam_confidence || 0) > 80 ? 'text-red-600' :
                            (selectedEmail?.spam_confidence || 0) > 50 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {selectedEmail?.spam_confidence || 0}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (selectedEmail?.spam_confidence || 0) > 80 ? 'bg-red-500' :
                            (selectedEmail?.spam_confidence || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}                            style={{width: `${selectedEmail?.spam_confidence || 0}%`}}
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
                      <span className="font-mono text-blue-600">{selectedEmail?.email_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subject:</span>
                      <span className="font-medium truncate max-w-[200px]" title={selectedEmail?.subject}>{selectedEmail?.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{getFilterCategoryBadge(selectedEmail?.filter_category)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span>{selectedEmail ? getStatusBadge(selectedEmail) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attachments:</span>
                      <span className="font-medium">{selectedEmail?.attachment_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sender:</span>
                      <span className="font-medium truncate max-w-[200px]" title={selectedEmail?.sender}>{selectedEmail?.sender}</span>
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
                onClick={() => setShowDetailsModal(false)}
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