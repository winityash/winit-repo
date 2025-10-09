'use client';

import {
  LayoutDashboard,
  BarChart3,
  Inbox,
  CheckCircle,
  Calculator,
  AlertTriangle,
  Settings,
  HelpCircle,
  Search,
  User,
  PanelLeftClose,
  Mail
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {

  // Debug logging
  console.log('[Sidebar] Rendered with activeTab:', activeTab);
  console.log('[Sidebar] setActiveTab is:', typeof setActiveTab);

  const handleNavClick = (itemId) => {
    console.log('[Sidebar] Navigation clicked:', itemId);
    setActiveTab(itemId);
    if (mobileOpen) setMobileOpen(false);
  };

  const mainMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-[18px] h-[18px]" />
    },
    {
      id: 'emails',
      label: 'All Emails',
      icon: <Mail className="w-[18px] h-[18px]" />
    },
    {
      id: 'queue',
      label: 'LPO Queue',
      icon: <Inbox className="w-[18px] h-[18px]" />
    },
    {
      id: 'validation',
      label: 'Validation',
      icon: <CheckCircle className="w-[18px] h-[18px]" />
    },
    {
      id: 'pricing',
      label: 'Issues',
      icon: <Calculator className="w-[18px] h-[18px]" />
    },
    {
      id: 'escalations',
      label: 'Escalations',
      icon: <AlertTriangle className="w-[18px] h-[18px]" />
    }
  ];

  const bottomMenuItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-[18px] h-[18px]" />
    },
    {
      id: 'help',
      label: 'Get Help',
      icon: <HelpCircle className="w-[18px] h-[18px]" />
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-[18px] h-[18px]" />
    }
  ];

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo Section */}
      <div className="logo-container">
        <div className="logo-box">
          <img
            src="/logo.png"
            alt="WINIT Logo"
            className="logo-img"
          />
        </div>
        <div className="logo-text-container">
          <h1 className="logo-title">WINIT LPO</h1>
        </div>
      </div>

      <div className="nav-menu">
        {/* Main Navigation */}
        <div className="nav-section">
          {mainMenuItems.map((item) => (
            <div key={item.id} className="nav-item">
              <div
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : ''}
              >
                {item.icon}
                <span className="nav-text">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="nav-bottom">
        <div className="nav-section">
          {bottomMenuItems.map((item) => (
            <div key={item.id} className="nav-item">
              <div
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : ''}
              >
                {item.icon}
                <span className="nav-text">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="user-profile">
        <div className="user-info">
          <div className="user-avatar">
            <User className="w-[18px] h-[18px]" />
          </div>
          <div className="user-details">
            <div className="user-name">yash</div>
            <div className="user-email">yash.lohade@winitsoftware.com</div>
          </div>
        </div>
        <div className="user-actions">
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title="Minimize sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}