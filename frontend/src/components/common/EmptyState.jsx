import React from 'react';

const EmptyState = ({ icon = '📭', title = 'No data found', message, actionLabel, onAction }) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: '#666'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>{icon}</div>
      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px', color: '#333' }}>
        {title}
      </h3>
      {message && (
        <p style={{ fontSize: '14px', marginBottom: '30px', maxWidth: '400px', margin: '0 auto 30px' }}>
          {message}
        </p>
      )}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
