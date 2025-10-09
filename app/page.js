'use client';

import { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardNew from "../components/DashboardNew";
import TableComponent from "../components/table";
import EscalationChart from "../components/escalation";
import SLATable from "../components/sla";
import ConversationTable from "../components/conversations";
import LPOQueue from "../components/LPOQueue";
import Analytics from "../components/Analytics";
import Validation from "../components/Validation";
import IssueManagement from "../components/IssueManagement";
import Settings from "../components/Settings";
import EmailsTable from "../components/EmailsTable";

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Debug logging
  console.log('[Home] Component mounted, activeTab:', activeTab);

  useEffect(() => {
    console.log('[Home] useEffect: Component hydrated and ready');
    console.log('[Home] setActiveTab function:', typeof setActiveTab);
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardNew onNavigate={setActiveTab} />;
      case 'analytics':
        return <Analytics />;
      case 'queue':
        return <LPOQueue />;
      case 'table':
        return <TableComponent />;
      case 'escalation':
      case 'escalations':
        return <EscalationChart />;
      case 'sla':
        return <SLATable />;
      case 'conversations':
        return <ConversationTable />;
      case 'validation':
        return <Validation />;
      case 'pricing':
        return <IssueManagement />;
      case 'settings':
        return <Settings />;
      case 'emails':
        return <EmailsTable />;
      case 'templates':
      case 'integrations':
      case 'ai-insights':
      case 'help':
      case 'search':
        return (
          <div className="card">
            <div className="card-header">
              <div className="card-header-content">
                <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                <p>This section is under development</p>
              </div>
            </div>
            <div className="card-content">
              <p>Coming soon...</p>
            </div>
          </div>
        );
      default:
        return <DashboardNew onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <Header
          activeTab={activeTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Content */}
        <div className="content">
          <div className="page active">
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}