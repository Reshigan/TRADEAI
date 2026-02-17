import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizes = {
    small: { spinner: 24, border: 3 },
    medium: { spinner: 48, border: 4 },
    large: { spinner: 64, border: 5 }
  };

  const { spinner, border } = sizes[size] || sizes.medium;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '40px 20px' 
    }}>
      <div style={{
        width: `${spinner}px`,
        height: `${spinner}px`,
        border: `${border}px solid #E5E5E5`,
        borderTop: `${border}px solid #6D28D9`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      {message && (
        <div style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>
          {message}
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
