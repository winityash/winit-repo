'use client';

import { useState, useEffect } from 'react';
import { Phone, X, Eye } from 'lucide-react';

export default function EscalationChart() {
  const [escalationData, setEscalationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criticalAlert, setCriticalAlert] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [escalationTimeline, setEscalationTimeline] = useState([]);
  const [escalationHistory, setEscalationHistory] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/conversations?page=1&per_page=100');

        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const result = await response.json();

        // Handle both array response and object with conversations property
        const conversations = Array.isArray(result) ? result : (result.conversations || []);

        // Transform conversations to escalation format
        const escalations = conversations.map(conv => ({
          id: conv.lpo_number,
          conversationId: conv.conversation_id,
          customer: conv.contact || 'Unknown Customer',
          level: conv.status === 'not_solved' ? 'Level 3' : conv.status === 'in_progress' ? 'Level 2' : 'Level 1',
          timeSince: calculateTimeSince(conv.created_at),
          channels: [conv.communication_mode],
          lastResponse: calculateLastResponse(conv.last_update),
          status: conv.status === 'not_solved' ? 'critical' : conv.status === 'in_progress' ? 'medium' : 'low',
          problem: conv.problem,
          createdAt: conv.created_at,
          lastUpdate: conv.last_update
        }));

        setEscalationData(escalations);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const calculateTimeSince = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  const calculateLastResponse = (dateString) => {
    const now = new Date();
    const updated = new Date(dateString);
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `Read ${diffMins}m ago`;
    }
    return 'No response';
  };

  const getEscalationLevelBadge = (level) => {
    const classes = {
      'Level 3': 'badge-danger',
      'Level 2': 'badge-warning',
      'Level 1': 'badge-info'
    };
    return <span className={`badge ${classes[level] || 'badge-secondary'}`}>{level}</span>;
  };

  const fetchConversationDetails = async (conversationId) => {
    setLoadingModal(true);
    try {
      // Fetch messages
      try {
        const messagesResponse = await fetch(`/api/conversations/${conversationId}`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setConversationMessages(messagesData.messages || []);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }

      // Fetch escalation history (API endpoint not available yet, using placeholder)
      // When backend implements /escalation/history/{conversation_id}, uncomment this
      /*
      try {
        const historyResponse = await fetch(`/api/escalation/history/${conversationId}`);
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (Array.isArray(historyData)) {
            setEscalationHistory(historyData);
            setEscalationTimeline(historyData);
          } else if (historyData.history) {
            setEscalationHistory(historyData.history);
            setEscalationTimeline(historyData.timeline || historyData.history);
          }
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      }
      */

      // Temporary: Generate timeline from escalation_info if available
      try {
        const conversation = escalationData.find(e => e.conversationId === conversationId);
        if (conversation && conversation.createdAt) {
          const mockTimeline = [
            {
              timestamp: conversation.createdAt,
              event: 'Issue Reported',
              description: conversation.problem || 'Issue was reported by customer',
              status: 'completed'
            },
            {
              timestamp: conversation.lastUpdate,
              event: 'Last Updated',
              description: 'Most recent activity on this escalation',
              status: 'in_progress'
            }
          ];
          setEscalationTimeline(mockTimeline);
          setEscalationHistory(mockTimeline);
        } else {
          setEscalationTimeline([]);
          setEscalationHistory([]);
        }
      } catch (err) {
        console.error('Error generating timeline:', err);
        setEscalationTimeline([]);
        setEscalationHistory([]);
      }
    } catch (err) {
      console.error('Error fetching conversation details:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const openModal = async (escalation) => {
    setSelectedConversation(escalation);
    setShowModal(true);
    await fetchConversationDetails(escalation.conversationId);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedConversation(null);
    setConversationMessages([]);
    setEscalationTimeline([]);
    setEscalationHistory([]);
    setActiveTab('overview');
  };

  if (loading) {
    return (
      <div className="page active">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p style={{ color: '#6b7280' }}>Loading escalation data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate critical escalations count
  const criticalCount = escalationData.filter(item => item.status === 'critical').length;

  return (
    <div className="page active">
      {/* Critical Alert */}
      {criticalAlert && criticalCount > 0 && (
        <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{criticalCount} Critical Escalation{criticalCount !== 1 ? 's' : ''}</strong> requiring immediate attention
          </div>
          <X
            className="w-5 h-5"
            style={{ cursor: 'pointer' }}
            onClick={() => setCriticalAlert(false)}
          />
        </div>
      )}

      {/* Active Escalations */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <h3>Active Escalations</h3>
            <p>Critical LPOs requiring immediate resolution</p>
          </div>
          <button className="btn btn-primary">
            <Phone className="w-4 h-4" />
            Bulk Call KAMs
          </button>
        </div>
        <div className="card-content">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>LPO ID</th>
                  <th>Customer</th>
                  <th>Escalation Level</th>
                  <th>Time Since Escalation</th>
                  <th>Channels Used</th>
                  <th>Last Response</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {escalationData.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openModal(row)}
                    style={{ cursor: 'pointer' }}
                    className="hover:bg-gray-50"
                  >
                    <td className="font-semibold">{row.id}</td>
                    <td>{row.customer}</td>
                    <td>{getEscalationLevelBadge(row.level)}</td>
                    <td>{row.timeSince}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {row.channels.map((channel, index) => (
                          <span key={index} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {channel}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: row.lastResponse === 'No response' ? '#ef4444' : '#6b7280' }}>
                      {row.lastResponse}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Call Now
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Follow Up
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for conversation details */}
      {showModal && selectedConversation && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
            overflowY: 'auto'
          }}
          onClick={closeModal}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-header"
              style={{
                padding: '1.5rem',
                backgroundColor: '#000000',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, marginBottom: '0.25rem' }}>
                  Escalation Details
                </h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedConversation.id} - {selectedConversation.customer}
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                  marginLeft: '1rem',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '2px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              padding: '0 1.5rem'
            }}>
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'overview' ? 600 : 400,
                  borderBottom: activeTab === 'overview' ? '2px solid #000000' : '2px solid transparent',
                  marginBottom: '-2px',
                  color: activeTab === 'overview' ? '#000000' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                style={{
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'timeline' ? 600 : 400,
                  borderBottom: activeTab === 'timeline' ? '2px solid #000000' : '2px solid transparent',
                  marginBottom: '-2px',
                  color: activeTab === 'timeline' ? '#000000' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'history' ? 600 : 400,
                  borderBottom: activeTab === 'history' ? '2px solid #000000' : '2px solid transparent',
                  marginBottom: '-2px',
                  color: activeTab === 'history' ? '#000000' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                History
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                padding: '1.5rem',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {loadingModal ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                  <span style={{ marginLeft: '0.75rem', color: '#6b7280' }}>Loading details...</span>
                </div>
              ) : (
                <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div style={{ padding: '1rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontWeight: 600, marginBottom: '1rem', color: '#111827', fontSize: '1.125rem' }}>
                        Problem Description
                      </h4>
                      <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                        <p style={{ color: '#374151', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
                          {selectedConversation.problem || 'No description available'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontWeight: 600, marginBottom: '1rem', color: '#111827', fontSize: '1.125rem' }}>
                        Conversation Messages
                      </h4>
                      {conversationMessages.length > 0 ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}>
                          {conversationMessages.map((message, index) => (
                            <div
                              key={index}
                              style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                backgroundColor: message.sender === 'customer' || message.sender === 'user'
                                  ? '#f3f4f6'
                                  : '#ffffff',
                                color: '#000000',
                                border: message.sender === 'customer' || message.sender === 'user'
                                  ? '2px solid #000000'
                                  : '1px solid #e5e7eb'
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {message.sender === 'customer' || message.sender === 'user' ? 'Customer' : 'Agent'}
                              </div>
                              <p style={{ fontSize: '0.9375rem', margin: 0, wordWrap: 'break-word', lineHeight: 1.6 }}>
                                {message.message || message.content || message.text || 'Message'}
                              </p>
                              {message.timestamp && (
                                <span style={{ fontSize: '0.8125rem', opacity: 0.6, display: 'block', marginTop: '0.5rem' }}>
                                  {new Date(message.timestamp).toLocaleString()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                          No messages available
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '1.5rem', color: '#111827', fontSize: '1.125rem' }}>
                      Escalation Timeline
                    </h4>
                    {escalationTimeline.length > 0 ? (
                      <div style={{
                        position: 'relative',
                        paddingLeft: '2rem'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: '1rem',
                          top: 0,
                          bottom: 0,
                          width: '2px',
                          backgroundColor: '#e5e7eb'
                        }}></div>

                        {escalationTimeline.map((item, index) => (
                          <div key={index} style={{
                            position: 'relative',
                            marginBottom: index === escalationTimeline.length - 1 ? 0 : '2rem',
                            paddingLeft: '1.5rem'
                          }}>
                            <div style={{
                              position: 'absolute',
                              left: '-0.5rem',
                              top: '0.25rem',
                              width: '12px',
                              height: '12px',
                              backgroundColor: item.status === 'failed' ? '#6b7280' : '#000000',
                              borderRadius: '50%',
                              border: '3px solid white',
                              boxShadow: '0 0 0 2px #e5e7eb'
                            }}></div>

                            <div style={{
                              backgroundColor: '#f9fafb',
                              padding: '1rem',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                {item.timestamp ? new Date(item.timestamp).toLocaleString() : item.time || 'No time'}
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                                {item.event || item.action || 'Event'}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                {item.details || item.description || ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                        No timeline data available
                      </p>
                    )}
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '1.5rem', color: '#111827', fontSize: '1.125rem' }}>
                      Escalation History
                    </h4>
                    {escalationHistory.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {escalationHistory.map((item, index) => (
                          <div key={index} style={{
                            backgroundColor: '#ffffff',
                            padding: '1.25rem',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                                  {item.action || item.event || 'Action'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {item.timestamp ? new Date(item.timestamp).toLocaleString() : item.date || 'No date'}
                                </div>
                              </div>
                              {item.status && (
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  backgroundColor: item.status === 'completed' ? '#f0fdf4' : item.status === 'failed' ? '#fef2f2' : '#f3f4f6',
                                  color: item.status === 'completed' ? '#166534' : item.status === 'failed' ? '#991b1b' : '#374151'
                                }}>
                                  {item.status}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                                {item.description}
                              </p>
                            )}
                            {item.details && (
                              <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5 }}>
                                {item.details}
                              </div>
                            )}
                            {item.assigned_to && (
                              <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                <strong>Assigned to:</strong> {item.assigned_to}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                        No history data available
                      </p>
                    )}
                  </div>
                )}
                </>
              )}
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#000000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}