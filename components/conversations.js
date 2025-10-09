'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConversationTable() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const controller = new AbortController();

        const response = await fetch('/api/conversations', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Handle both array response and object with conversations property
        const conversations = Array.isArray(result) ? result : (result.conversations || []);

        setData(conversations);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err.message || 'Failed to fetch data');
        }
        console.error('Error fetching conversations data:', err);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'solved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not_solved':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getModeIcon = (mode) => {
    switch (mode.toLowerCase()) {
      case 'whatsapp':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        );
      case 'email':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
            <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
          </svg>
        );
      case 'phone call':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const fetchConversationMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);
      const response = await fetch(`/api/conversations/${conversationId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversation messages');
      }

      const result = await response.json();

      if (!result.messages || result.messages.length === 0) {
        const sampleMessages = [
          {
            sender: 'customer',
            message: 'Hi, I have an issue with LPO price. The price is showing 400 but the LPO price is 200.',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            sender: 'agent',
            message: "Hello! I understand you're experiencing a price mismatch. Let me check your LPO details.",
            timestamp: new Date(Date.now() - 3500000).toISOString()
          },
          {
            sender: 'agent',
            message: "I can see the issue. The product price was updated recently but the LPO price wasn't reflected. Let me escalate this to our pricing team.",
            timestamp: new Date(Date.now() - 3400000).toISOString()
          },
          {
            sender: 'customer',
            message: 'How long will it take to resolve this?',
            timestamp: new Date(Date.now() - 3300000).toISOString()
          },
          {
            sender: 'agent',
            message: "Our pricing team typically responds within 2-4 hours. I've marked this as urgent due to the price discrepancy.",
            timestamp: new Date(Date.now() - 3200000).toISOString()
          }
        ];
        setConversationMessages(sampleMessages);
      } else {
        setConversationMessages(result.messages);
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      const sampleMessages = [
        {
          sender: 'customer',
          message: 'Hi, I have an issue with LPO price. The price is showing 400 but the LPO price is 200.',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          sender: 'agent',
          message: "Hello! I understand you're experiencing a price mismatch. Let me check your LPO details.",
          timestamp: new Date(Date.now() - 3500000).toISOString()
        },
        {
          sender: 'agent',
          message: "I can see the issue. The product price was updated recently but the LPO price wasn't reflected. Let me escalate this to our pricing team.",
          timestamp: new Date(Date.now() - 3400000).toISOString()
        },
        {
          sender: 'customer',
          message: 'How long will it take to resolve this?',
          timestamp: new Date(Date.now() - 3300000).toISOString()
        },
        {
          sender: 'agent',
          message: "Our pricing team typically responds within 2-4 hours. I've marked this as urgent due to the price discrepancy.",
          timestamp: new Date(Date.now() - 3200000).toISOString()
        }
      ];
      setConversationMessages(sampleMessages);
    } finally {
      setLoadingMessages(false);
    }
  };

  const openModal = async (conversation) => {
    setSelectedConversation(conversation);
    setShowModal(true);
    await fetchConversationMessages(conversation.conversation_id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedConversation(null);
  };

  const openEscalationModal = (conversation, e) => {
    e.stopPropagation();
    if (conversation.escalation_info) {
      try {
        const escalationData = JSON.parse(conversation.escalation_info);
        setSelectedEscalation({ ...escalationData, conversation_id: conversation.conversation_id });
        setShowEscalationModal(true);
      } catch (err) {
        console.error('Error parsing escalation info:', err);
      }
    }
  };

  const closeEscalationModal = () => {
    setShowEscalationModal(false);
    setSelectedEscalation(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border-2 border-gray-200">
        <div className="text-center">
          <div className="h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <div className="text-lg font-medium" style={{ color: '#3B82F6' }}>Loading conversations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border-2 border-gray-200">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="#3B82F6" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-lg font-medium" style={{ color: '#3B82F6' }}>Error loading data</div>
          <div className="text-sm mt-1" style={{ color: '#3B82F6' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="conversations-wrapper">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: '#ffffff',
          boxShadow: 'none',
          borderRadius: '16px'
        }}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-800">Conversation Details</h2>
              <p className="text-sm text-gray-500 mt-1">Customer Support Conversations</p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">Live Conversations</span>
              </div>
              <div className="text-gray-700">
                <span className="font-medium">{data.length}</span>
                <span className="text-gray-500 ml-1">Total Conversations</span>
              </div>
              <div className="text-gray-700">
                <span className="font-medium">{data.filter(item => item.status === 'solved').length}</span>
                <span className="text-gray-500 ml-1">Solved</span>
              </div>
              <div className="text-gray-700">
                <span className="font-medium">{data.filter(item => item.status === 'in_progress').length}</span>
                <span className="text-gray-500 ml-1">In Progress</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white">
          <div
            className="overflow-hidden"
            style={{
              backgroundColor: '#ffffff'
            }}
          >
            <div className="overflow-x-auto">
              <div
                className="overflow-y-auto scrollable-table"
                style={{
                  maxHeight: '520px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#3B82F6 #f3f4f6'
                }}
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">LPO Number</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Problem Description</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Communication</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Last Update</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Escalation</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {data.slice(0, 10).map((conversation, index) => (
                      <tr
                        key={conversation.conversation_id}
                        className={`transition-all duration-200 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                        onClick={() => router.push(`/conversation/${conversation.conversation_id}`)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {conversation.lpo_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight"
                                 title={conversation.problem}
                                 style={{ maxWidth: '250px', wordWrap: 'break-word' }}>
                              {conversation.problem}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Issue reported
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {getModeIcon(conversation.communication_mode)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {conversation.communication_mode}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {conversation.contact}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.status)}`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              conversation.status === 'solved' ? 'bg-green-400' :
                              conversation.status === 'in_progress' ? 'bg-blue-400' :
                              conversation.status === 'not_solved' ? 'bg-red-400' : 'bg-gray-400'
                            }`}></span>
                            {conversation.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-900">
                              {new Date(conversation.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(conversation.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-900">
                              {new Date(conversation.last_update).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(conversation.last_update).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          {conversation.escalation_info ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEscalationModal(conversation, e);
                              }}
                              className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            >
                              View Flow
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">No escalation</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(conversation);
                              }}
                              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                              title="Quick View"
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/conversation/${conversation.conversation_id}`);
                              }}
                              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                              title="View Details"
                            >
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
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
        </div>
      </div>

      {showModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 text-white flex items-center justify-between" style={{ backgroundColor: '#3B82F6' }}>
              <div>
                <h3 className="text-xl font-semibold">Conversation Details</h3>
                <p className="text-white opacity-70 text-sm mt-1">ID: {selectedConversation.conversation_id}</p>
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

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2" style={{ color: '#374151' }}>Problem Description</h4>
                    <p className="text-gray-700">{selectedConversation.problem}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2" style={{ color: '#374151' }}>Contact Information</h4>
                    <div className="flex items-center space-x-2 mb-2">
                      {getModeIcon(selectedConversation.communication_mode)}
                      <span className="font-medium">{selectedConversation.communication_mode}</span>
                    </div>
                    <p className="text-gray-700">{selectedConversation.contact}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border-2" style={{ borderColor: '#E5E7EB', minHeight: '200px' }}>
                    <h4 className="font-semibold mb-3" style={{ color: '#374151' }}>Conversation History</h4>
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="h-6 w-6 border-b-2 border-[#3B82F6]"></div>
                        <span className="ml-2 text-sm text-gray-600">Loading...</span>
                      </div>
                    ) : conversationMessages.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {conversationMessages.map((message, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded text-sm ${
                              message.sender === 'customer' || message.sender === 'user'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-white text-gray-800'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-xs">
                                {message.sender === 'customer' || message.sender === 'user' ? 'Customer' : 'Agent'}:
                              </span>
                              <p className="flex-1 text-xs">{message.message || message.content || message.text || 'Message content'}</p>
                            </div>
                            {message.timestamp && (
                              <span className="text-xs text-gray-500 mt-1 block">
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No conversation messages available</p>
                        <p className="text-xs text-gray-400 mt-1">Customer: Hi, I have an issue with LPO price</p>
                        <p className="text-xs text-gray-400">Agent: I&apos;ll help you with that...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2" style={{ color: '#374151' }}>Status & Timeline</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedConversation.status)}`}>
                          {selectedConversation.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>LPO Number:</span>
                        <span className="font-mono" style={{ color: '#3B82F6' }}>{selectedConversation.lpo_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-sm">{formatDateTime(selectedConversation.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Update:</span>
                        <span className="text-sm">{formatDateTime(selectedConversation.last_update)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedConversation.escalation_info && (
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                      <h4 className="font-semibold mb-2 text-red-800">Escalation Information</h4>
                      <div className="overflow-y-auto" style={{ maxHeight: '300px', scrollbarWidth: 'thin', scrollbarColor: '#dc2626 #fee2e2' }}>
                        <pre className="text-xs text-red-700 whitespace-pre-wrap">
                          {JSON.stringify(JSON.parse(selectedConversation.escalation_info), null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-center">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 text-white rounded font-medium transition-all duration-200 hover:opacity-80"
                  style={{ backgroundColor: '#3B82F6' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEscalationModal && selectedEscalation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 text-white flex items-center justify-between" style={{ backgroundColor: '#3B82F6' }}>
              <div>
                <h3 className="text-xl font-semibold">Escalation Flow</h3>
                <p className="text-white opacity-70 text-sm mt-1">
                  Conversation: {selectedEscalation.conversation_id} |
                  Issue: {selectedEscalation.issue_type} |
                  Urgency: {selectedEscalation.urgency}
                </p>
              </div>
              <button
                onClick={closeEscalationModal}
                className="text-white hover:text-white transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-gray-50">
              <div className="bg-white rounded-lg p-4 mb-6 border-2" style={{ borderColor: '#E5E7EB' }}>
                <h4 className="font-semibold mb-3" style={{ color: '#374151' }}>Current Progress</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Step {selectedEscalation.current_step} of {selectedEscalation.total_steps}</span>
                  <span className="text-xs text-gray-500">Next escalation: {new Date(selectedEscalation.next_escalation_time).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedEscalation.current_step / selectedEscalation.total_steps) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold" style={{ color: '#374151' }}>Escalation Steps</h4>
                {selectedEscalation.steps && selectedEscalation.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-lg p-4 border-l-4 ${
                      index + 1 < selectedEscalation.current_step
                        ? 'border-green-500 bg-green-50'
                        : index + 1 === selectedEscalation.current_step
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm  ${
                            index + 1 < selectedEscalation.current_step
                              ? 'bg-green-500'
                              : index + 1 === selectedEscalation.current_step
                              ? 'bg-blue-500'
                              : 'bg-gray-400'
                          }`}>
                            {step.step}
                          </span>
                          <div>
                            <span className="font-medium text-gray-900 capitalize">{step.action} to {step.target}</span>
                            <span className="ml-2 text-xs text-gray-500">({step.time})</span>
                          </div>
                        </div>
                        <div className="ml-11 space-y-1">
                          <p className="text-sm text-gray-600">Template: {step.template}</p>
                          <p className="text-sm text-gray-600">Fallback: {step.fallback}</p>
                          {index + 1 <= selectedEscalation.current_step && (
                            <p className="text-xs text-green-600 font-medium">✓ Completed</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {step.action === 'email' && (
                          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                            <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                          </svg>
                        )}
                        {step.action === 'whatsapp' && (
                          <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        )}
                        {step.action === 'call' && (
                          <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedEscalation.escalation_contacts && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3" style={{ color: '#374151' }}>Escalation Contacts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedEscalation.escalation_contacts).map(([role, contact]) => (
                      <div key={role} className="bg-white rounded-lg p-3 border border-gray-200">
                        <h5 className="font-medium text-sm capitalize mb-2" style={{ color: '#374151' }}>
                          {role.replace('_', ' ')}
                        </h5>
                        <div className="space-y-1 text-xs text-gray-600">
                          <p><span className="font-medium">Name:</span> {contact.name}</p>
                          {contact.email && <p><span className="font-medium">Email:</span> {contact.email}</p>}
                          {contact.phone && <p><span className="font-medium">Phone:</span> {contact.phone}</p>}
                          {contact.whatsapp && <p><span className="font-medium">WhatsApp:</span> {contact.whatsapp}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-center">
                <button
                  onClick={closeEscalationModal}
                  className="px-6 py-2 text-white rounded font-medium transition-all duration-200 hover:opacity-80"
                  style={{ backgroundColor: '#3B82F6' }}
                >
                  Close Flow Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}