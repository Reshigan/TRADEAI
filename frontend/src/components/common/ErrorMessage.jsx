import React from 'react';

const ErrorMessage = ({ message, onRetry, type = 'error' }) => {
  const types = {
    error: { bg: '#fee2e2', color: '#991b1b', icon: '❌' },
    warning: { bg: '#fef3c7', color: '#92400e', icon: '⚠️' },
    info: { bg: '#dbeafe', color: '#1e40af', icon: 'ℹ️' }
  };

  const style = types[type] || types.error;

  return (
    <div style={{
      padding: '15px 20px',
      marginBottom: '20px',
      borderRadius: '8px',
      backgroundColor: style.bg,
      color: style.color,
      border: `1px solid ${style.color}30`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '15px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <span style={{ fontSize: '20px' }}>{style.icon}</span>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: style.color,
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
