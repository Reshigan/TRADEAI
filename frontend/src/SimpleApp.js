import React from 'react';

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Trade AI Platform - Test Version</h1>
      <p>This is a simplified version to test if React is working correctly.</p>
      <div style={{ marginTop: '20px' }}>
        <h2>System Status:</h2>
        <ul>
          <li>React: ✅ Working</li>
          <li>JavaScript: ✅ Loading</li>
          <li>DOM: ✅ Rendering</li>
        </ul>
      </div>
      <button 
        onClick={() => alert('Button clicked! React is working.')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#1e40af',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
}

export default SimpleApp;