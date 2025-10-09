'use client';

import { AlertCircle, Info, CheckCircle, XCircle, X } from 'lucide-react';

export default function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info', // 'info', 'warning', 'error', 'success', 'confirm'
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) {
  if (!isOpen) return null;

  const icons = {
    info: <Info className="w-6 h-6" />,
    warning: <AlertCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    success: <CheckCircle className="w-6 h-6" />,
    confirm: <AlertCircle className="w-6 h-6" />
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
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
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={handleCancel}
      >
        {/* Dialog Box */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxWidth: '500px',
            width: '90%',
            overflow: 'hidden',
            border: '1px solid #000',
            animation: 'scaleIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#000',
              borderBottom: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <div style={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                {icons[type]}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#fff'
                }}
              >
                {title || (type === 'confirm' ? 'Confirm Action' : 'Alert')}
              </h3>
            </div>
            <button
              onClick={handleCancel}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                opacity: 0.8,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.8)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '2rem 1.5rem' }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.9375rem',
                lineHeight: '1.6',
                color: '#000'
              }}
            >
              {message}
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#fff',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            {showCancel && (
              <button
                onClick={handleCancel}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  backgroundColor: '#fff',
                  color: '#000',
                  border: '1px solid #000',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                }}
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                backgroundColor: '#000',
                color: '#fff',
                border: '1px solid #000',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000';
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
