import React from 'react';

function SimpleTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple React Test</h1>
      <p>If you can see this, React is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Environment Variables:</h3>
        <p>REACT_APP_API_URL: {process.env.REACT_APP_API_URL || 'Not set'}</p>
        <p>REACT_APP_WEBSOCKET_URL: {process.env.REACT_APP_WEBSOCKET_URL || 'Not set'}</p>
        <p>REACT_APP_ENVIRONMENT: {process.env.REACT_APP_ENVIRONMENT || 'Not set'}</p>
      </div>
    </div>
  );
}

export default SimpleTest;