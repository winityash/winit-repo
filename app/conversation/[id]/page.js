'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [escalation, setEscalation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    fetchConversationDetails();
  }, [conversationId]);

  const fetchConversationDetails = async () => {
    try {
      setLoading(true);

      // Fetch conversation data
      const conversationsRes = await fetch('/api/conversations');
      if (!conversationsRes.ok) throw new Error('Failed to fetch conversations');

      const conversationsData = await conversationsRes.json();
      const conversationData = conversationsData.conversations?.find(
        c => c.conversation_id === conversationId
      );

      if (!conversationData) {
        throw new Error('Conversation not found');
      }

      setConversation(conversationData);

      // Parse escalation info if available
      if (conversationData.escalation_info) {
        try {
          const escalationData = JSON.parse(conversationData.escalation_info);
          setEscalation(escalationData);
        } catch (err) {
          console.error('Error parsing escalation info:', err);
        }
      }

      // Fetch conversation messages
      try {
        const messagesRes = await fetch(`/api/conversations/${conversationId}`);
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData.messages || getSampleMessages());
        } else {
          setMessages(getSampleMessages());
        }
      } catch {
        setMessages(getSampleMessages());
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching conversation details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSampleMessages = () => [
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'solved':
        return 'bg-green-50 text-green-700 border border-green-400';
      case 'in_progress':
        return 'bg-blue-600 text-white';
      case 'not_solved':
        return 'bg-red-50 text-red-700 border-2 border-red-400';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-300';
    }
  };

  const getModeIcon = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'whatsapp':
        return (
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        );
      case 'email':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
            <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
          </svg>
        );
      case 'phone call':
      case 'call':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <div className="text-lg font-medium" style={{ color: '#3B82F6' }}>Loading conversation details...</div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="#3B82F6" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Conversation Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested conversation could not be found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-300 transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Conversation Details</h1>
                <p className="text-sm text-gray-600 mt-1">LPO: <span style={{ color: '#3B82F6' }} className="font-medium">{conversation.lpo_number}</span></p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(conversation.status)}`}>
                {conversation.status.replace('_', ' ').toUpperCase()}
              </span>
              <div className="flex items-center space-x-2">
                <div style={{ color: '#6B7280' }}>
                  {getModeIcon(conversation.communication_mode)}
                </div>
                <span className="font-medium text-gray-700">{conversation.communication_mode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="px-6 bg-white border-t border-gray-100">
          <div className="flex space-x-6">
            {['overview', 'conversation', 'escalation', 'timeline'].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-3 font-medium capitalize transition-all duration-200 border-b-2 ${
                  activeSection === section
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div>
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Problem Details Card */}
              <div
                className="lg:col-span-2 rounded-xl overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: 'none',
                  borderRadius: '16px'
                }}
              >
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Problem Description
                  </h2>
                </div>
                <div className="p-6 bg-white">
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                    <p className="text-gray-800 leading-relaxed">{conversation.problem}</p>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Contact Information</h3>
                      <div className="flex items-center space-x-2">
                        <div style={{ color: '#6B7280' }}>
                          {getModeIcon(conversation.communication_mode)}
                        </div>
                        <span className="text-gray-900 font-medium">{conversation.contact}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Conversation ID</h3>
                      <p className="text-gray-900 font-mono text-sm">{conversation.conversation_id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: 'none',
                  borderRadius: '16px'
                }}
              >
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium text-gray-800">Status & Timeline</h2>
                </div>
                <div className="p-6 bg-white space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Status</label>
                    <div className="mt-2">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(conversation.status)}`}>
                        {conversation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="mt-1 text-gray-900">{new Date(conversation.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="mt-1 text-gray-900">{new Date(conversation.last_update).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="mt-1 text-gray-900">
                      {Math.round((new Date(conversation.last_update) - new Date(conversation.created_at)) / (1000 * 60 * 60))} hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation History Section */}
          {activeSection === 'conversation' && (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: 'none',
                borderRadius: '16px'
              }}
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Conversation History
                </h2>
                <p className="text-sm text-gray-500 mt-1">Chat messages between customer and support agent</p>
              </div>
              <div className="p-6" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)' }}>
                <div
                  className="rounded-xl p-6 max-h-[650px] overflow-y-auto"
                  style={{
                    backgroundColor: '#f8fafc',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9',
                    boxShadow: 'none'
                  }}
                >
                  {messages.length > 0 ? (
                    <div className="space-y-6">
                      {messages.map((msg, index) => {
                        const isCustomer = msg.sender === 'customer' || msg.sender === 'user';
                        const isAgent = msg.sender === 'agent' || msg.sender === 'support';

                        return (
                          <div
                            key={index}
                            className={`flex items-end gap-3 ${isCustomer ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 ${isCustomer ? 'mb-auto' : 'mb-auto'}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isCustomer
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                  : 'bg-gradient-to-br from-green-500 to-green-600'
                              }`}>
                                {isCustomer ? (
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                  </svg>
                                )}
                              </div>
                            </div>

                            {/* Message Bubble */}
                            <div className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'} max-w-[70%]`}>
                              {/* Sender Name */}
                              <div className={`flex items-center gap-2 mb-1 ${isCustomer ? 'mr-3' : 'ml-3'}`}>
                                <span className="text-xs font-semibold text-gray-600">
                                  {isCustomer ? 'Customer' : 'Support Agent'}
                                </span>
                                {!isCustomer && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                    Agent
                                  </span>
                                )}
                              </div>

                              {/* Message Content */}
                              <div
                                className={`relative group ${
                                  isCustomer
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                    : 'bg-white text-gray-800'
                                }`}
                                style={{
                                  borderRadius: isCustomer ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                                  padding: '12px 16px',
                                  wordBreak: 'break-word',
                                  border: isCustomer ? 'none' : '1px solid #e5e7eb'
                                }}
                              >
                                {/* Message Text */}
                                <div className={`text-sm leading-relaxed ${isCustomer ? 'font-medium' : ''}`}>
                                  {msg.message || msg.content || msg.text}
                                </div>

                                {/* HTML Content if present */}
                                {msg.html_content && (
                                  <div
                                    className={`mt-3 pt-3 border-t ${
                                      isCustomer ? 'border-blue-400' : 'border-gray-200'
                                    } text-xs font-mono opacity-90`}
                                    style={{
                                      maxHeight: '200px',
                                      overflowY: 'auto',
                                      backgroundColor: isCustomer ? 'rgba(255,255,255,0.1)' : '#f9fafb',
                                      padding: '8px',
                                      borderRadius: '6px',
                                      marginTop: '8px'
                                    }}
                                  >
                                    <div dangerouslySetInnerHTML={{ __html: msg.html_content }} />
                                  </div>
                                )}

                                {/* Message tail */}
                                <div
                                  className={`absolute top-5 ${
                                    isCustomer
                                      ? '-right-2 border-l-blue-600 border-t-transparent'
                                      : '-left-2 border-r-white border-t-transparent'
                                  }`}
                                  style={{
                                    width: 0,
                                    height: 0,
                                    borderStyle: 'solid',
                                    borderWidth: isCustomer ? '10px 0 10px 10px' : '10px 10px 10px 0',
                                    borderColor: isCustomer
                                      ? 'transparent transparent transparent #3b82f6'
                                      : 'transparent white transparent transparent'
                                  }}
                                />
                              </div>

                              {/* Timestamp */}
                              {msg.timestamp && (
                                <div className={`flex items-center gap-1 mt-1.5 ${isCustomer ? 'mr-3' : 'ml-3'}`}>
                                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs text-gray-500">
                                    {new Date(msg.timestamp).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing Indicator (optional, for live chat feel) */}
                      {false && (
                        <div className="flex items-end gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                          <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">No conversation messages yet</p>
                      <p className="text-sm text-gray-400 mt-1">Messages will appear here once available</p>
                    </div>
                  )}
                </div>

                {/* Quick Stats Footer */}
                <div className="mt-4 flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Customer Messages: {messages.filter(m => m.sender === 'customer' || m.sender === 'user').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Agent Replies: {messages.filter(m => m.sender === 'agent' || m.sender === 'support').length}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: {messages.length} messages
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Escalation Flow Section */}
          {activeSection === 'escalation' && (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                borderRadius: '16px'
              }}
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-800">Escalation Flow</h2>
              </div>
              <div className="p-6 bg-white">
                {escalation ? (
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Step {escalation.current_step} of {escalation.total_steps}
                        </span>
                        <span className="text-sm text-gray-500">
                          Next: {new Date(escalation.next_escalation_time).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(escalation.current_step / escalation.total_steps) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Escalation Steps */}
                    <div className="space-y-4">
                      {escalation.steps?.map((step, index) => (
                        <div
                          key={index}
                          className={`border-l-4 p-4 rounded-lg ${
                            index + 1 < escalation.current_step
                              ? 'border-green-500 bg-green-50'
                              : index + 1 === escalation.current_step
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                                index + 1 < escalation.current_step
                                  ? 'bg-green-500'
                                  : index + 1 === escalation.current_step
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                              }`}>
                                {step.step}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900 capitalize">
                                  {step.action} to {step.target}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Template: {step.template}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Scheduled: {step.time}
                                </p>
                                {step.fallback && (
                                  <p className="text-sm text-gray-500">
                                    Fallback: {step.fallback}
                                  </p>
                                )}
                              </div>
                            </div>
                            {index + 1 <= escalation.current_step && (
                              <span className="text-green-600 font-medium text-sm">✓ Completed</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Escalation Contacts */}
                    {escalation.escalation_contacts && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Escalation Contacts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(escalation.escalation_contacts).map(([role, contact]) => (
                            <div key={role} className="bg-white p-3 rounded border border-gray-200">
                              <h4 className="font-medium text-sm text-gray-700 capitalize mb-2">
                                {role.replace('_', ' ')}
                              </h4>
                              <div className="space-y-1 text-sm text-gray-600">
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
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-gray-500">No escalation flow configured for this conversation</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Section */}
          {activeSection === 'timeline' && (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                borderRadius: '16px'
              }}
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-800">Activity Timeline</h2>
              </div>
              <div className="p-6 bg-white">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900">Conversation Started</p>
                        <p className="text-sm text-gray-600 mt-1">Customer initiated contact via {conversation.communication_mode}</p>
                        <p className="text-xs text-gray-500 mt-2">{new Date(conversation.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {messages.slice(0, 3).map((msg, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        msg.sender === 'customer' || msg.sender === 'user' ? 'bg-gray-400' : 'bg-green-500'
                      }`}>
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="font-medium text-gray-900">
                            {msg.sender === 'customer' || msg.sender === 'user' ? 'Customer' : 'Agent'} Message
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {msg.message || msg.content || msg.text}
                          </p>
                          {msg.timestamp && (
                            <p className="text-xs text-gray-500 mt-2">{new Date(msg.timestamp).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      conversation.status === 'solved' ? 'bg-green-500' :
                      conversation.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900">Last Update</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: {conversation.status.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">{new Date(conversation.last_update).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}