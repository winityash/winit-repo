'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const colors = {
    success: {
      bg: '#d4edda',
      border: '#28a745',
      text: '#155724'
    },
    error: {
      bg: '#f8d7da',
      border: '#dc3545',
      text: '#721c24'
    },
    warning: {
      bg: '#fff3cd',
      border: '#ffc107',
      text: '#856404'
    },
    info: {
      bg: '#d1ecf1',
      border: '#17a2b8',
      text: '#0c5460'
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        minWidth: '300px',
        maxWidth: '500px',
        backgroundColor: colors[type].bg,
        border: `1px solid ${colors[type].border}`,
        borderLeft: `4px solid ${colors[type].border}`,
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10000,
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <div style={{ color: colors[type].border, display: 'flex', alignItems: 'center' }}>
        {icons[type]}
      </div>
      <div style={{ flex: 1, color: colors[type].text, fontSize: '14px', fontWeight: '500' }}>
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors[type].text,
          opacity: 0.7
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
      >
        <X className="w-4 h-4" />
      </button>
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
