'use client';

import { Menu, X } from 'lucide-react';

export default function Header({ activeTab, mobileOpen, setMobileOpen }) {
  const pageInfo = {
    dashboard: {
      title: 'Dashboard',
      description: 'Real-time LPO processing overview and analytics'
    },
    analytics: {
      title: 'Analytics',
      description: 'AI-powered insights and performance metrics'
    },
    queue: {
      title: 'LPO Queue',
      description: 'Active LPO processing queue management'
    },
    validation: {
      title: 'Validation',
      description: 'Data validation and quality checks'
    },
    pricing: {
      title: 'Issues',
      description: 'Issue tracking and resolution management'
    },
    escalations: {
      title: 'Escalations',
      description: 'Escalation management and priority handling'
    },
    templates: {
      title: 'Templates',
      description: 'LPO templates and document management'
    },
    integrations: {
      title: 'Integrations',
      description: 'System integrations and API connections'
    },
    'ai-insights': {
      title: 'AI Insights',
      description: 'Machine learning insights and predictions'
    },
    settings: {
      title: 'Settings',
      description: 'System configuration and preferences'
    },
    help: {
      title: 'Get Help',
      description: 'Support resources and documentation'
    },
    search: {
      title: 'Search',
      description: 'Search across all LPOs and documents'
    },
    conversations: {
      title: 'Conversation Details',
      description: 'Detailed conversation tracking and history'
    },
    sla: {
      title: 'Resolution Status',
      description: 'SLA monitoring and resolution tracking'
    },
    table: {
      title: 'Order Extraction KPI',
      description: 'Key performance indicators for order extraction'
    },
    escalation: {
      title: 'Escalation Analysis',
      description: 'Detailed escalation trends and patterns'
    }
  };

  const currentPage = pageInfo[activeTab] || pageInfo.dashboard;

  return (
    <header className="header">
      <div className="header-content">
        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '1rem'
          }}
        >
          {mobileOpen ? (
            <X className="w-6 h-6" style={{ color: '#374151' }} />
          ) : (
            <Menu className="w-6 h-6" style={{ color: '#374151' }} />
          )}
        </button>

        <div className="header-title">
          <h2 id="page-title">{currentPage.title}</h2>
          <p id="page-description">{currentPage.description}</p>
        </div>
        <div className="header-actions">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            padding: '8px 20px',
            borderRadius: '24px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            marginRight: '1rem',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.15)',
            transition: 'all 0.3s ease'
          }}>
            <span style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                position: 'absolute',
                display: 'inline-block',
                width: '14px',
                height: '14px',
                background: 'rgba(34, 197, 94, 0.4)',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite'
              }}></span>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                background: '#22c55e',
                borderRadius: '50%',
                zIndex: 1,
                boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
              }}></span>
            </span>
            <span style={{
              background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '1.2px',
              marginLeft: '10px'
            }}>LIVE</span>
            <span style={{
              color: '#16a34a',
              fontSize: '12px',
              fontWeight: 500,
              marginLeft: '8px',
              paddingLeft: '8px',
              borderLeft: '1px solid rgba(34, 197, 94, 0.3)'
            }}>Real-time</span>
          </div>
        </div>
      </div>
    </header>
  );
}